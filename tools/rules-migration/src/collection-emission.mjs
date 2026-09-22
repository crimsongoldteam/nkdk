import {createHash} from 'node:crypto';
import {mapProperty} from './mappings.mjs';
import {bindSiblingExpressions,mergeMappedInputs} from './common-inputs.mjs';
import {prepareCollectionProperty} from './collection-property.mjs';
const id=(role,value)=>`candidate.collection.${role}.${createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,20)}`;
const yamlCollator=new Intl.Collator('ru');
const yamlPriority=key=>key==='Заголовок'||key==='Синоним'?0:key==='Вид'?1:key==='Тип'?2:3;
const compareYamlKeys=(left,right)=>yamlPriority(left)-yamlPriority(right)||yamlCollator.compare(left,right);

// Emit complete element rules only. Property projections cannot stand in for an element.
export function emitCollections(graph,entries,catalog,namespaces={},options={}) {
  const modules=[],results=[];
  const defaultPrefix=options.defaultXmlNamespace;
  if(defaultPrefix && typeof namespaces[defaultPrefix]!=='string')throw new Error(`Missing default XML namespace: ${defaultPrefix}`);
  const xmlPath=path=>path.map(name=>defaultPrefix&&!name.includes(':')?`${defaultPrefix}:${name}`:name);
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
    if(child.itemType && !Array.isArray(child.propertyStates))block('item-state-inventory-required');
    if(child.propertyStates?.length) {
      result.propertyStates=structuredClone(child.propertyStates);
      block('item-state-assembly-required');
    }
    if(child.xmlOrder?.status==='unresolved' || (child.xmlOrder?.status==='static' && new Set(child.xmlOrder.keys).size!==child.xmlOrder.keys.length))block('item-order-unresolved');
    const owner=entries.find(e=>e.path===edge.owner.path&&e.symbol===edge.owner.symbol);
    const property=owner?.properties.find(p=>p.name===edge.property);
    const propertyKeys=['type','yaml','xml','xmlParents','itemRule','ownerFactRole','configurationIndexUidSegment'];
    const unsupported=Object.keys(property?.parameters??{}).filter(key=>!propertyKeys.includes(key));
    const operationTarget=property?.parameters?.operationTarget;
    if(operationTarget && options.deferOwnerContributions!==true)block('collection-owner-operation-required');
    if(unsupported.filter(key=>key!=='operationTarget').length)block('collection-property-options',unsupported.filter(key=>key!=='operationTarget'));
    if(owner?.comparison?.status!=='keys-match')block('owner-source-incomplete');
    const fields=child.properties.map(property=>{
      // The source record collection uses keyField as its key's YAML name
      // when the property omits yaml. Array items have no such contract.
      const source=prepareCollectionProperty(property,edge.mapping);
      return {property,mapped:mapProperty(source,catalog,namespaces)};
    });
    if(edge.mapping.yamlAsArray!==true && !fields.some(f=>f.property.name===edge.mapping.keyField && f.property.parameters?.type==='string'))block('collection-key-type');
    const incomplete=fields.filter(f=>f.mapped.status!=='candidate').map(f=>({property:f.property.name,reason:f.mapped.reason}));
    if(incomplete.length)block('item-properties',incomplete);
    if(!fields.length)block('empty-item');
    // Source metadataCollection selects its name through keyField, then "name".
    // This is a migration correspondence, not a runtime rule for named fields.
    const nameField=fields.find(f=>f.property.name===(edge.mapping.keyField??'name'));
    for(const {mapped} of fields) for(const [input,sibling] of Object.entries(mapped.siblingBindings??{})) {
      const source=fields.find(field=>field.property.name===sibling && field.mapped.status==='candidate');
      if(!source) {block('item-sibling-binding-required',{input,sibling});continue;}
      (mapped.type.bind??={})[input]={field:sibling};
      mapped.inputs=Object.fromEntries(Object.entries(mapped.inputs??{}).filter(([name])=>name!==input));
    }
    bindSiblingExpressions(fields,(input,sibling)=>block('item-sibling-binding-required',{input,sibling}));
    const identities=fields.filter(field=>field.mapped.identityProjection);
    if(identities.length>1)block('multiple-identity-properties');
    for(const {mapped} of identities) {
      if(nameField?.mapped.id!=='common.string') { block('identity-name-required'); continue; }
      if(typeof edge.mapping.xml!=='string') {block('identity-kind-required');continue;}
      mapped.type.bind.name={field:nameField.property.name};
      mapped.type.bind.kind={literal:edge.mapping.xml.split(':').at(-1)};
      mapped.inputs=Object.fromEntries(Object.entries(mapped.inputs).filter(([name])=>!['name','kind'].includes(name)));
    }
    for(const {property,mapped} of fields) {
      if(!['I8nText','FormattedI8nText'].includes(property.parameters?.type) || mapped.status!=='candidate')continue;
      if(nameField?.mapped.id!=='common.string')continue;
      const argument=property.parameters.type==='FormattedI8nText'?'name':'ownerName';
      mapped.type.bind[argument]={field:nameField.property.name};
      mapped.inputs=Object.fromEntries(Object.entries(mapped.inputs).filter(([name])=>name!=='ownerName'));
    }
    // Shared indexes retain their explicit provider. Only researched language
    // inputs are shared scalars; other context still requires a source binding.
    const inputRequirements=[...new Set(fields.flatMap(f=>Object.entries(f.mapped.inputs??{}).filter(([name,input])=>input.type?.kind!=='index' &&
      !((['I8nText','FormattedI8nText','MetadataValue'].includes(f.property.parameters?.type) && ['defaultLanguage','registeredLanguages'].includes(name)) || (f.mapped.identityProjection && ['component','owner'].includes(name)))).map(([name])=>name)))];
    if(inputRequirements.length)result.inputRequirements=inputRequirements;
    if(fields.some(f=>f.mapped.sourceTag))block('item-source-tag');
    if(typeof edge.mapping.xml!=='string' || typeof edge.mapping.yaml!=='string' || !Array.isArray(edge.mapping.xmlParents) || !edge.mapping.xmlParents.length || edge.mapping.xmlParents.some(p=>typeof p!=='string'))block('collection-owner-path');
    if(edge.context.ownerFactRole || edge.context.configurationIndexUidSegment || operationTarget) {
      if(options.deferOwnerContributions===true)result.ownerRequirements={...structuredClone(edge.context),...(operationTarget?{operationTarget:structuredClone(operationTarget)}:{})};
      else block('collection-owner-contributions-required');
    }
    const qualified=[edge.mapping.xml,...(Array.isArray(edge.mapping.xmlParents)?edge.mapping.xmlParents:[])].filter(p=>typeof p==='string'&&p.includes(':'));
    if(qualified.some(p=>typeof namespaces[p.split(':')[0]]!=='string'))block('collection-namespace-binding');
    if(result.blockers.length)continue;
    if(child.xmlOrder?.status==='static') {
      const ranks=new Map(child.xmlOrder.keys.map((name,index)=>[name,index]));
      fields.sort((a,b)=>(ranks.get(a.property.name)??ranks.size)-(ranks.get(b.property.name)??ranks.size));
    }
    const row={format:'nkdk-declarations/1',kind:'value',imports:{},value:{kind:'record',fields:[]},
      representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
    const inputs={},inputImports={};
    for(const {property,mapped} of fields) {
      mergeMappedInputs(inputs,mapped);
      Object.assign(inputImports,mapped.imports);
      if(mapped.namespaces)Object.assign(row.namespaces??={},mapped.namespaces);
      Object.assign(row.imports,mapped.imports);
      const alias=`field${row.value.fields.length}`;
      if(Object.hasOwn(row.imports,alias))throw new Error('Generated collection alias collision');
      row.imports[alias]=mapped.id;
      row.value.fields.push({name:property.name,type:{...mapped.type,use:alias}});
      row.representations.xml.fields.push({field:property.name,path:xmlPath(mapped.path),...(mapped.attribute?{attribute:mapped.attribute}:{})});
      if(mapped.key!==undefined)row.representations.yaml.fields.push({field:property.name,key:mapped.key});
      if(mapped.presence)(row.presence??=[]).push(mapped.presence);
      if(mapped.constraints)(row.constraints??=[]).push(...mapped.constraints);
    }
    // xmlOrder orders the XML representation only. YAML follows source property
    // registration order; the two orders differ for adopted metadata objects.
    const yamlOrder=new Map(child.properties.map((property,index)=>[property.name,index]));
    row.representations.yaml.fields.sort((a,b)=>options.canonicalYamlKeyOrder
      ? compareYamlKeys(a.key,b.key)||yamlOrder.get(a.field)-yamlOrder.get(b.field)
      : yamlOrder.get(a.field)-yamlOrder.get(b.field));
    const bind=Object.fromEntries(Object.keys(inputs).map(name=>[name,{input:name}]));
    const withInputs=module=>{
      if(Object.keys(inputs).length) {
        module.inputs=structuredClone(inputs);
        Object.assign(module.imports,inputImports);
      }
      return module;
    };
    withInputs(row);
    if(defaultPrefix)(row.namespaces??={})[defaultPrefix]=namespaces[defaultPrefix];
    row.id=id('item',[edge.item,row]);
    const list={format:'nkdk-declarations/1',kind:'value',imports:{item:row.id},value:{kind:'sequence',item:{use:'item'}},
      representations:{xml:{kind:'element-sequence',path:xmlPath([edge.mapping.xml])},yaml:edge.mapping.yamlAsArray===true?{kind:'sequence'}:{kind:'record-mapping',key:edge.mapping.keyField}}};
    withInputs(list);
    if(Object.keys(inputs).length)list.value.item.bind=structuredClone(bind);
    if(qualified.length)list.namespaces=Object.fromEntries(qualified.map(p=>[p.split(':')[0],namespaces[p.split(':')[0]]]));
    if(defaultPrefix)(list.namespaces??={})[defaultPrefix]=namespaces[defaultPrefix];
    list.id=id('list',list);
    const projection={format:'nkdk-declarations/1',kind:'object',imports:{items:list.id},
      value:{kind:'record',fields:[{name:edge.property,type:{use:'items'}}]},
      representations:{xml:{kind:'record',fields:[{field:edge.property,path:xmlPath(edge.mapping.xmlParents)}]},yaml:{kind:'mapping',fields:[{field:edge.property,key:edge.mapping.yaml}]}}};
    withInputs(projection);
    if(Object.keys(inputs).length)projection.value.fields[0].type.bind=structuredClone(bind);
    if(list.namespaces)projection.namespaces=list.namespaces;
    if(identities.length) {
      projection.inputs.identities.index='metadata.own-identities';
      const field=name=>({get:{of:{var:'row'},field:name}});
      projection.contributions=[{index:'metadata.own-identities',forEach:{in:{field:edge.property},as:'row'},
        key:{record:{component:{input:'component'},owner:{input:'owner'},kind:{literal:edge.mapping.xml.split(':').at(-1)},name:field(nameField.property.name)}},
        value:field(identities[0].property.name)}];
    }
    projection.id=id('property',[edge.owner,projection]);
    modules.push(row,list,projection);
    result.status='candidate';result.declaration=projection.id;
  }
  return {scope:'Complete supported array and named record elements; collection property projection is not a complete owner',
    modules:[...new Map(modules.map(m=>[m.id,m])).values()],results};
}
