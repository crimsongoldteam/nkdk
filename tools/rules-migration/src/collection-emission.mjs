import {createHash} from 'node:crypto';
import {mapProperty} from './mappings.mjs';
const id=(role,value)=>`candidate.collection.${role}.${createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,20)}`;

// Emit complete element rules only. Property projections cannot stand in for an element.
export function emitCollections(graph,entries,catalog,namespaces={}) {
  const modules=[],results=[];
  for(const edge of graph.edges) {
    const result={owner:edge.owner,property:edge.property,item:edge.item,status:'blocked',blockers:[]};
    results.push(result);
    const block=(reason,details)=>result.blockers.push({reason,...(details?{details}: {})});
    if(edge.status!=='linked-structure')block('collection-link',edge.blockers);
    const registration=graph.registrations.find(r=>r.type===edge.type);
    const parameters=registration?.parameters??{};
    const supported=['propertyType','itemRule','xmlElement','yamlAsArray','collectionItemRule','schemaName','schemaShape','keyField'];
    const extra=Object.keys(parameters).filter(key=>!supported.includes(key));
    if(extra.length)block('collection-registration-options',extra);
    if(edge.mapping.yamlAsArray!==true && typeof edge.mapping.keyField!=='string')block('collection-key-required');
    if(parameters.schemaShape && parameters.schemaShape!=='array')block('collection-schema-shape');
    const child=entries.find(e=>e.path===edge.item.path&&e.symbol===edge.item.symbol);
    if(!child || child.comparison?.status!=='keys-match' || !child.shapeComplete) {block('item-source-incomplete');continue;}
    if(child.xmlOrder?.status==='unresolved' || (child.xmlOrder?.status==='static' && new Set(child.xmlOrder.keys).size!==child.xmlOrder.keys.length))block('item-order-unresolved');
    const owner=entries.find(e=>e.path===edge.owner.path&&e.symbol===edge.owner.symbol);
    const property=owner?.properties.find(p=>p.name===edge.property);
    const propertyKeys=['type','yaml','xml','xmlParents','itemRule','ownerFactRole','configurationIndexUidSegment'];
    const unsupported=Object.keys(property?.parameters??{}).filter(key=>!propertyKeys.includes(key));
    if(unsupported.length)block('collection-property-options',unsupported);
    if(owner?.comparison?.status!=='keys-match')block('owner-source-incomplete');
    const fields=child.properties.map(property=>({property,mapped:mapProperty(property,catalog,namespaces)}));
    if(edge.mapping.yamlAsArray!==true && !fields.some(f=>f.property.name===edge.mapping.keyField && f.property.parameters?.type==='string'))block('collection-key-type');
    const incomplete=fields.filter(f=>f.mapped.status!=='candidate').map(f=>({property:f.property.name,reason:f.mapped.reason}));
    if(incomplete.length)block('item-properties',incomplete);
    if(!fields.length)block('empty-item');
    if(fields.some(f=>f.mapped.inputs && Object.keys(f.mapped.inputs).length))block('item-context-binding-required');
    if(fields.some(f=>f.mapped.sourceTag))block('item-source-tag');
    if(typeof edge.mapping.xml!=='string' || typeof edge.mapping.yaml!=='string' || !Array.isArray(edge.mapping.xmlParents) || !edge.mapping.xmlParents.length || edge.mapping.xmlParents.some(p=>typeof p!=='string'))block('collection-owner-path');
    if(edge.context.ownerFactRole || edge.context.configurationIndexUidSegment)block('collection-owner-contributions-required');
    const qualified=[edge.mapping.xml,...(Array.isArray(edge.mapping.xmlParents)?edge.mapping.xmlParents:[])].filter(p=>typeof p==='string'&&p.includes(':'));
    if(qualified.some(p=>typeof namespaces[p.split(':')[0]]!=='string'))block('collection-namespace-binding');
    if(result.blockers.length)continue;
    if(child.xmlOrder?.status==='static') {
      const ranks=new Map(child.xmlOrder.keys.map((name,index)=>[name,index]));
      fields.sort((a,b)=>(ranks.get(a.property.name)??ranks.size)-(ranks.get(b.property.name)??ranks.size));
    }
    const row={format:'nkdk-declarations/1',kind:'value',imports:{},value:{kind:'record',fields:[]},
      representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
    for(const {property,mapped} of fields) {
      if(mapped.namespaces)Object.assign(row.namespaces??={},mapped.namespaces);
      Object.assign(row.imports,mapped.imports);
      const alias=`field${row.value.fields.length}`;
      if(Object.hasOwn(row.imports,alias))throw new Error('Generated collection alias collision');
      row.imports[alias]=mapped.id;
      row.value.fields.push({name:property.name,type:{...mapped.type,use:alias}});
      row.representations.xml.fields.push({field:property.name,path:mapped.path});
      row.representations.yaml.fields.push({field:property.name,key:mapped.key});
      if(mapped.presence)(row.presence??=[]).push(mapped.presence);
      if(mapped.constraints)(row.constraints??=[]).push(...mapped.constraints);
    }
    row.id=id('item',[edge.item,row]);
    const list={format:'nkdk-declarations/1',kind:'value',imports:{item:row.id},value:{kind:'sequence',item:{use:'item'}},
      representations:{xml:{kind:'element-sequence',path:[edge.mapping.xml]},yaml:edge.mapping.yamlAsArray===true?{kind:'sequence'}:{kind:'record-mapping',key:edge.mapping.keyField}}};
    if(qualified.length)list.namespaces=Object.fromEntries(qualified.map(p=>[p.split(':')[0],namespaces[p.split(':')[0]]]));
    list.id=id('list',list);
    const projection={format:'nkdk-declarations/1',kind:'object',imports:{items:list.id},
      value:{kind:'record',fields:[{name:edge.property,type:{use:'items'}}]},
      representations:{xml:{kind:'record',fields:[{field:edge.property,path:edge.mapping.xmlParents}]},yaml:{kind:'mapping',fields:[{field:edge.property,key:edge.mapping.yaml}]}}};
    if(list.namespaces)projection.namespaces=list.namespaces;
    projection.id=id('property',[edge.owner,projection]);
    modules.push(row,list,projection);
    result.status='candidate';result.declaration=projection.id;
  }
  return {scope:'Complete supported array and named record elements; collection property projection is not a complete owner',
    modules:[...new Map(modules.map(m=>[m.id,m])).values()],results};
}
