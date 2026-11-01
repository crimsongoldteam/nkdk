import {createHash} from 'node:crypto';
import {mapProperty} from './mappings.mjs';
import {prepareCollectionProperty} from './collection-property.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';

const identify=(part,value)=>`candidate.member-source.${part}.${createHash('sha256')
  .update(JSON.stringify(value)).digest('hex').slice(0,20)}`;

// A fact projection reads the registered collection key. It is deliberately
// separate from accepting the complete child conversion.
export function namedMemberFactSource(edge,entries,catalog,namespaces,projection={}) {
  if(edge.status!=='linked-structure'||edge.mapping.yamlAsArray===true||
    typeof edge.mapping.keyField!=='string'||typeof edge.context.ownerFactRole!=='string')
    throw new Error('Named member fact source requires a registered key and role');
  if(Object.keys(projection).some(key=>!['properties','index','value','computed'].includes(key)))
    throw new Error('Unsupported named member projection');
  if(projection.properties!==undefined && !Array.isArray(projection.properties))
    throw new Error('Named member projection properties must be a list');
  if(projection.computed && (projection.computed.value?.kind!=='record'||
    !Array.isArray(projection.computed.value.fields)||
    Object.keys(projection.computed).some(key=>!['value','presence'].includes(key))))
    throw new Error('Named member computed projection requires record fields and presence');
  const owner=entries.find(entry=>entry.path===edge.owner.path&&entry.symbol===edge.owner.symbol);
  const child=entries.find(entry=>entry.path===edge.item.path&&entry.symbol===edge.item.symbol);
  const property=child?.properties.find(property=>property.name===edge.mapping.keyField);
  if(!owner||!property)throw new Error('Named member fact source is missing its source rule');
  const mapped=mapProperty(prepareCollectionProperty(property,edge.mapping),catalog,namespaces);
  if(mapped.status!=='candidate'||Object.keys(mapped.inputs??{}).length||mapped.attribute||!mapped.key)
    throw new Error('Named member fact key requires a complete context-free scalar');
  const qualify=name=>name.includes(':')?name:`md:${name}`;
  const row={format:'nkdk-declarations/1',kind:'value',namespaces,
    imports:{...mapped.imports,key:mapped.id},
    value:{kind:'record',fields:[{name:property.name,type:{...mapped.type,use:'key'}}]},
    representations:{xml:{kind:'record',fields:[{field:property.name,path:mapped.path.map(qualify)}]},
      yaml:{kind:'mapping',fields:[{field:property.name,key:mapped.key}]}}};
  if(mapped.presence)row.presence=[structuredClone(mapped.presence)];
  if(mapped.constraints)row.constraints=structuredClone(mapped.constraints);
  // Identity is read as source text here; UUID reconstruction is owned by the
  // complete child rule, and this projection publishes only membership.
  for(const property of child.properties){
    const identity=mapProperty(property,catalog,namespaces);
    if(!identity.identityProjection)continue;
    if(identity.status!=='candidate'||!identity.attribute)
      throw new Error('Named member fact identity requires a declared XML attribute');
    row.value.fields.push({name:property.name,type:{kind:'scalar',scalar:'text'}});
    row.representations.xml.fields.push({field:property.name,path:identity.path.map(qualify),
      attribute:identity.attribute});
    (row.presence??=[]).push({target:{field:property.name},yaml:{missing:{denotes:{absent:true}}}});
  }
  for(const selected of projection.properties??[]){
    const propertyName=typeof selected==='string'?selected:selected.name;
    if(typeof propertyName!=='string'||(typeof selected!=='string'&&
      Object.keys(selected).some(key=>!['name','use'].includes(key))))
      throw new Error('Unsupported named member fact property projection');
    if(row.value.fields.some(field=>field.name===propertyName))
      throw new Error(`Repeated named member fact field: ${propertyName}`);
    const property=child.properties.find(property=>property.name===propertyName);
    if(!property)throw new Error(`Missing named member fact field: ${propertyName}`);
    const extra=mapProperty(property,catalog,namespaces);
    if(extra.status!=='candidate'||Object.keys(extra.inputs??{}).length||extra.attribute||!extra.key)
      throw new Error(`Named member fact field requires a context-free declaration: ${propertyName}`);
    const alias=`source_${propertyName}`;
    const declared=typeof selected==='string'?extra.id:selected.use;
    if(typeof declared!=='string'||!catalog.has(declared))
      throw new Error(`Missing named member fact declaration: ${propertyName}`);
    row.imports={...row.imports,...extra.imports,[alias]:declared};
    row.value.fields.push({name:propertyName,type:{...extra.type,use:alias}});
    row.representations.xml.fields.push({field:propertyName,path:extra.path.map(qualify)});
    row.representations.yaml.fields.push({field:propertyName,key:extra.key});
    if(extra.presence)(row.presence??=[]).push(structuredClone(extra.presence));
    if(extra.constraints)(row.constraints??=[]).push(...structuredClone(extra.constraints));
  }
  if(projection.computed){
    for(const field of projection.computed.value.fields){
      if(row.value.fields.some(existing=>existing.name===field.name))
        throw new Error(`Repeated named member computed field: ${field.name}`);
      row.value.fields.push(structuredClone(field));
    }
    (row.presence??=[]).push(...structuredClone(projection.computed.presence??[]));
  }
  row.id=identify('item',row);
  const list={format:'nkdk-declarations/1',kind:'value',namespaces,imports:{item:row.id},
    value:{kind:'sequence',item:{use:'item'}},
    representations:{xml:{kind:'element-sequence',path:[qualify(edge.mapping.xml)]},
      yaml:{kind:'record-mapping',key:property.name}}};
  list.id=identify('list',list);
  const name={get:{of:{var:'row'},field:property.name}};
  const source={format:'nkdk-declarations/1',kind:'object',namespaces,imports:{items:list.id},
    inputs:{component:{type:{kind:'scalar',scalar:'text'}},owner:{type:{kind:'scalar',scalar:'text'}}},
    value:{kind:'record',fields:[{name:edge.property,type:{use:'items'}}]},
    representations:{xml:{kind:'record',fields:[{field:edge.property,
      path:[...sourceOwnerXmlRoute(owner),...edge.mapping.xmlParents.map(qualify)]}]},
      yaml:{kind:'mapping',fields:[{field:edge.property,key:edge.mapping.yaml}]}},
    presence:[{target:{field:edge.property},
      xml:{missing:{denotes:{sequence:[]}}},yaml:{missing:{denotes:{sequence:[]}}}}],
    contributions:[{index:projection.index??'metadata.owner-members',forEach:{in:{field:edge.property},as:'row'},
      key:{record:{component:{input:'component'},owner:{input:'owner'},
        role:{literal:edge.context.ownerFactRole},name}},value:structuredClone(projection.value??name)}]};
  source.id=identify('owner',[edge.owner,source]);
  return {modules:[row,list,source],source};
}
