import {emitBaseCollections} from './base-collection.mjs';
import {composedCollection} from './composed-collection.mjs';
import {asOwnerFragment} from './owner-fragment.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';
import {assembleSourceOwner} from './source-owner-assembly.mjs';
import {bindPreparedOwnerIndexes} from './owner-index-requirements.mjs';

// Source adapter only: complete item declarations and ordinary collection
// emission share the existing collection compiler, never a metadata handler.
export function sourceOwnerCollections(source,extraction,catalog,graph,{id,properties,composedItems={}}) {
 const route=sourceOwnerXmlRoute(source),md=source.properties.find(row=>row.type==='XMLRoot')?.parameters.rootAttributes._xmlns;
 if(!md || !id || !Array.isArray(properties))throw new Error('Source collection owner required');
 const modules=[],attachments=[],requirements=[];
 for(const property of properties) {
  const edges=graph.edges.filter(edge=>edge.owner.path===source.path && edge.owner.symbol===source.symbol && edge.property===property);
  if(edges.length!==1)throw new Error(`Ambiguous source owner collection: ${property}`);
  const edge=edges[0];
  let result;
  if(composedItems[property]) {
   const selected=composedItems[property];
   const descriptor=typeof selected==='string'?{id:selected}:selected;
   let item=catalog.get(descriptor.id);
   if(!item)throw new Error(`Missing composed collection item: ${property}`);
   // Accepted operation entries may use an index provider without spelling its
   // type twice. Recover that type from their already typed compose contract.
   const typed=composeOwnerFragments(item.id,item.compose.map(part=>({alias:part.use,
    fragment:catalog.get(item.imports[part.use]),
    bindings:Object.fromEntries(Object.entries(part.bind??{}).map(([name,value])=>{
     return [name,Object.keys(value).length===1 && typeof value.input==='string'?value.input:value];
    })),
   })));
   item={...structuredClone(item),imports:{...item.imports,...typed.imports},
    inputs:Object.fromEntries(Object.entries(item.inputs).map(([name,input])=>
     [name,input.type?input:{...typed.inputs[name],...input}]))};
   const rowField=name=>({get:{of:{var:'row'},field:name}});
   const body=composedCollection(edge,item,catalog,[],{
    bindings:descriptor.bindings??{itemOwner:{field:'uuid'},itemName:{field:edge.mapping.keyField},
     qualifiedName:{concat:[{input:'parentName'},{literal:'.'},{field:edge.mapping.keyField}]},
     kind:{literal:edge.mapping.xml}},
    extraInputs:descriptor.bindings?(descriptor.extraInputs??{}):{parentName:{type:{kind:'scalar',scalar:'text'}}},
    namespaces:{md,xr:'http://v8.1c.ru/8.3/xcf/readable'},defaultXmlNamespace:'md',
    identity:descriptor.bindings?descriptor.identity:{index:'metadata.own-identities',
     key:{record:{component:{input:'component'},owner:{input:'parentOwner'},
      kind:{literal:edge.mapping.xml},name:rowField(edge.mapping.keyField)}},value:rowField('uuid')},
   });
   for(const [name,index] of Object.entries(descriptor.indexProviders??{})) {
    const input=body.entry.inputs[name];
    if(input?.type?.kind!=='index' || (input.index && input.index!==index))
     throw new Error(`Invalid composed collection provider: ${property}.${name}`);
    input.index=index;
   }
   result={modules:body.modules,entry:body.entry};
  }else {
   const emitted=emitBaseCollections({...graph,edges},extraction.entries,catalog,{md});
   const row=emitted.results[0];
   if(row.status!=='candidate' || emitted.deferredResources.length)
    throw new Error(`Blocked source owner collection: ${property}: ${JSON.stringify(row.blockers)}`);
   result={modules:emitted.modules,entry:emitted.modules.find(module=>module.id===row.declaration)};
   if(row.ownerRequirements)requirements.push({property,...row.ownerRequirements});
  }
  const indexProviders=Object.fromEntries(Object.entries(result.entry.inputs??{}).filter(([,input])=>input.index)
   .map(([name,input])=>[name,input.index]));
  const fragment=asOwnerFragment(result.entry,`${id}.${property}`,route,'md');
  modules.push(...result.modules.filter(module=>module.id!==result.entry.id),fragment);
  const probeFields=new Set(['xmlRoot','name',property]);
  const probeSource={...source,properties:source.properties.filter(row=>probeFields.has(row.name)),
   propertyStates:[],xmlOrder:{...source.xmlOrder,keys:source.xmlOrder.keys.filter(name=>probeFields.has(name))}};
  const probe=assembleSourceOwner(probeSource,new Map([...catalog,...modules.map(module=>[module.id,module])]),{
   id:`${id}.${property}.probe`,attachments:[{alias:'items',properties:[property],module:fragment,indexProviders,
    bindings:Object.fromEntries(Object.keys(fragment.inputs??{}).map(name=>[name,name]))}],
  });
  if(!probe.indexRequirements.missing.length) {
   const original=probe.owner;
   probe.owner=bindPreparedOwnerIndexes(original,probe.indexRequirements);
   probe.modules=probe.modules.map(module=>module===original?probe.owner:module);
  }
  modules.push(...probe.modules.filter(module=>!modules.some(row=>row.id===module.id)));
  attachments.push({alias:property,properties:[property],module:fragment,
   indexProviders});
 }
 return {modules,attachments,requirements,profile:'base-configuration',
  blockers:[{reason:'collection-extension-profile-required',properties:[...properties]}]};
}
