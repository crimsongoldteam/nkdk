import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {taggedScalarProperties,taggedTextProperties} from './state-contributions.mjs';
import {numericOwnerFragment,scalarPart,orderNumericHistory} from './numeric-owner-fragment.mjs';
import {renameOwnerFields,asOwnerFragment} from './owner-fragment.mjs';
import {mergeOwnerHistory,mergeOwnerFragments} from './owner-composition.mjs';
import {emitCandidates,referencedFields} from './emit.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {mapProperty} from './mappings.mjs';
import {scalarStateView} from './record-state-view.mjs';
import {stateValueOmission} from './state-history.mjs';

// Mount already declared scalar state contracts in the owner's one history.
// Source callbacks are mapped first; their dependency conditions remain data.
export function sourceScalarHistory(fragment,source,catalog) {
 const names=new Set(fragment.value.fields.map(row=>row.name));
 const properties=[...taggedScalarProperties(source),...taggedTextProperties(source)
  .filter(row=>mapProperty(row,catalog,{},source).status==='candidate')].filter(row=>!names.has(row.name));
 if(!properties.length)return {module:fragment,properties:[],fieldViews:{},declarations:[]};
 const snapshot=JSON.parse(readFileSync(new URL('../../../tests/migration/rules-extraction.json',import.meta.url)));
 const registered=snapshot.entries.find(row=>row.symbol===source.symbol&&row.path===source.path);
 for(const property of properties)if(!isDeepStrictEqual(property,registered?.properties.find(row=>row.name===property.name)))
  throw new Error('Unreviewed scalar state registration: '+property.name);
 const extra=renameOwnerFields(numericOwnerFragment(fragment.id+'.scalars',sourceOwnerXmlRoute(source),[],catalog,properties,source),
  Object.fromEntries(properties.map(row=>[row.parameters.xml??row.name[0].toUpperCase()+row.name.slice(1),row.name])));
 // Scalar state fields do not consume the numeric base-value index.
 delete extra.inputs.baseNumbers;
 delete extra.imports.number;
 const declarations=[];
 const local=new Map(catalog);
 for(const field of extra.value.fields.filter(row=>row.name!=='history')) {
  const original=catalog.get(extra.imports[field.type.use]);
  const copies=[original,...original.value.variants.map(row=>catalog.get(original.imports[row.type.use]))].map(row=>structuredClone(row));
  const ids=new Map(copies.map(row=>[row.id,extra.id+'.'+field.name+'.'+row.id]));
  for(const row of copies) {
   row.id=ids.get(row.id);
   for(const [alias,id] of Object.entries(row.imports??{}))if(ids.has(id))row.imports[alias]=ids.get(id);
   local.set(row.id,row);declarations.push(row);
  }
  extra.imports[field.type.use]=ids.get(original.id);
 }
 const allFields=[...fragment.value.fields,...extra.value.fields];
 const payloads=new Map(allFields.flatMap(field=>{
  const id=fragment.imports[field.type.use]??extra.imports[field.type.use];
  if(id==='common.stateful-number')return [[field.name,'capacity']];
  if(id?.startsWith('common.stateful.') || declarations.some(row=>row.id===id))return [[field.name,'value']];
  return [];
 }));
 const meaning=value=>{
  if(Array.isArray(value))return value.map(meaning);
  if(!value||typeof value!=='object')return value;
  if(Object.keys(value).length===1 && value.present?.field)return structuredClone(value);
  if(Object.keys(value).length===1 && payloads.has(value.field))return scalarPart(value.field,payloads.get(value.field));
  return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,meaning(child)]));
 };
 const lift=value=>{
  if(value.absent===true)return structuredClone(value);
  if(value.if)return {if:meaning(value.if),then:lift(value.then),else:lift(value.else)};
  return {variant:{name:'plain',value:{record:{value:meaning(value),state:{literal:false}}}}};
 };
 const fieldViews={};
 for(const property of properties) {
  const mapped=mapProperty(property,catalog,{},source);
  if(mapped.status!=='candidate')throw new Error('Unresolved scalar state profile: '+property.name);
  extra.constraints.push(...(mapped.constraints??[]).map(row=>({...structuredClone(row),
   assert:meaning(row.assert),...(row.when?{when:meaning(row.when)}:{}),
  })));
  const field=extra.value.fields.find(row=>row.name===property.name);
  const presence=extra.presence.find(row=>row.target.field===property.name);
  if(mapped.presence?.xml?.canonical)presence.xml.canonical=meaning(mapped.presence.xml.canonical);
  const missing=mapped.presence?.yaml?.missing?.denotes;
  if(missing?.absent===true) {
   delete presence.yaml.default;
   presence.yaml.missing={denotes:{absent:true}};
  } else if(missing)presence.yaml.default=lift(missing);
  if(mapped.presence?.yaml?.omitWhen) {
   presence.yaml.missing={denotes:presence.yaml.default};
   delete presence.yaml.default;
   if(!missing?.if || missing.if.input!=='adopted')throw new Error('Unsupported scalar state omission profile: '+property.name);
   presence.yaml.omitWhen={if:meaning(missing.if),then:{literal:false},
    else:stateValueOmission(property.name,lift(missing.else))};
  }
  fieldViews[property.name]=scalarStateView(mapped.id,field.type,{field:property.name,module:extra,catalog:local,payload:'value'});
 }
 const references=referencedFields([extra.presence,extra.constraints]);
 const presentNames=new Set([...fragment.value.fields,...extra.value.fields].map(row=>row.name));
 const dependencies=source.properties.filter(row=>references.has(row.name)&&!presentNames.has(row.name));
 let complete=extra;
 const indexProviders={};
 if(dependencies.length) {
  const emission=emitCandidates([{...source,properties:dependencies}],catalog);
  if(emission.entries[0].properties.some(row=>row.status!=='candidate'))throw new Error('Unresolved scalar state dependency');
  for(const original of emission.modules)
   for(const [name,input] of Object.entries(original.inputs??{}))if(input.index) {
    if(indexProviders[name] && indexProviders[name]!==input.index)throw new Error('Conflicting scalar dependency index');
    indexProviders[name]=input.index;
   }
  const parts=emission.modules.filter(row=>row.kind==='fragment').map(original=>{
   const declared={...original,namespaces:{...(original.namespaces??{}),md:fragment.namespaces.md}};
   return asOwnerFragment(declared,extra.id+'.dependency.'+original.id,sourceOwnerXmlRoute(source),'md');
  });
  complete=mergeOwnerFragments(extra.id,[extra,...parts]);
 }
 const module=mergeOwnerHistory(fragment.id,fragment,complete);
 orderNumericHistory(module);
 return {module,properties:[...properties,...dependencies].map(row=>row.name),fieldViews,declarations,indexProviders};
}
