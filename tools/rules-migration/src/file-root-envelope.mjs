import {sourceRootEnvelope,sourceOwnerPlacement,sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {reviewedPropertyExpression} from './reviewed-property-expressions.mjs';
import {isDeepStrictEqual} from 'node:util';
import {composeOwnerFragments} from './owner-composition.mjs';

// Bind a standalone collection shell structurally, independent of metadata kind.
export function bindFileRootEnvelope(valueTemplate,ownerTemplate,source,context) {
 const fail=()=>{throw new Error('Unsupported single-collection file envelope');};
 const envelope=sourceRootEnvelope(source,context);
 const value=structuredClone(valueTemplate),owner=structuredClone(ownerTemplate);
 const fields=owner.representations?.xml?.fields;
 if(envelope.path.length!==1 || value.kind!=='value' || owner.kind!=='object' ||
  value.representations?.xml?.kind==='with-attributes' ||
  owner.representations?.xml?.kind!=='record' || fields?.length!==1 || fields[0].path?.length!==0)fail();
 const field=owner.value?.fields?.find(row=>row.name===fields[0].field);
 if(!field || owner.imports?.[field.type?.use]!==value.id)fail();
 const aliases=Object.entries(value.namespaces??{}).filter(([,uri])=>uri===envelope.namespaces.md);
 const ownerAliases=Object.entries(owner.namespaces??{}).filter(([,uri])=>uri===envelope.namespaces.md);
 if(!aliases.length || !ownerAliases.length)fail();
 const prefix=ownerAliases[0][0];
 const attributes=mappedAttributes(envelope,value.namespaces,fail);
 value.representations.xml={kind:'with-attributes',attributes,content:value.representations.xml};
 fields[0].path=envelope.path.map(part=>prefix+':'+part.slice(part.indexOf(':')+1));
 return {value,owner};
}

function mappedAttributes(envelope,namespaces,fail) {
 const bindNamespace=(preferred,uri)=>{
  if(!uri)fail();
  const existing=Object.entries(namespaces).find(([,namespace])=>namespace===uri)?.[0];
  if(existing)return existing;
  let target=preferred,suffix=1;
  while(namespaces[target])target=preferred+suffix++;
  namespaces[target]=uri;
  return target;
 };
 return envelope.attributes.map(attribute=>{
  const parts=attribute.name.split(':');
  const alias=parts.length===2?parts[0]:undefined,local=parts.at(-1);
  const name=alias?bindNamespace(alias,envelope.namespaces[alias])+':'+local:local;
  if(envelope.namespaces[alias]==='http://www.w3.org/2001/XMLSchema-instance' && local==='type') {
   const text=attribute.value.text;
   if(!/^[A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?$/.test(text))fail();
   const parts=text.split(':'),preferred=parts.length===1?'md':parts[0];
   const target=bindNamespace(preferred,envelope.namespaces[preferred]);
   return {name,value:{qname:target+':'+parts.at(-1)}};
  }
  return {...structuredClone(attribute),name};
 });
}

export function bindObjectRootEnvelope(template,source,context,catalog) {
 const fail=()=>{throw new Error('Unsupported object root envelope');};
 const owner=structuredClone(template),envelope=sourceRootEnvelope(source,context);
 let content=owner.representations?.xml;
 if(content?.kind==='with-attributes')content=content.content;
 if(owner.kind!=='object' || content?.kind!=='record')fail();
 owner.namespaces??={};
 const path=envelope.path.map(part=>[envelope.namespaces.md,part.slice(part.indexOf(':')+1)]);
 const containsRoot=(module,seen=new Set())=>{
  if(seen.has(module.id))fail();
  const visited=new Set(seen).add(module.id);
  let xml=module.representations?.xml;
  if(xml?.kind==='with-attributes')xml=xml.content;
  if(xml?.kind!=='record')fail();
  if(xml.fields.some(field=>Array.isArray(field.path) && path.every(([uri,local],index)=>{
   const segment=field.path[index];
   if(typeof segment!=='string')return false;
   const parts=segment.split(':');
   return (parts.length===1?'':module.namespaces?.[parts[0]])===uri && parts.at(-1)===local;
  })))return true;
  return (module.compose??[]).some(part=>{
   const target=catalog?.get(module.imports?.[part.use]);
   if(!target)fail();
   return containsRoot(target,visited);
  });
 };
 if(!containsRoot(owner))fail();
 owner.representations.xml={kind:'with-attributes',
  attributes:mappedAttributes(envelope,owner.namespaces,fail),content};
 return owner;
}


// Only attachment placement is inferred here. The supplied, separately accepted
// file declaration owns item rules and their context-dependent semantics.
export function bindExternalFileAttachment(owner,property,id) {
 const fail=()=>{throw new Error('Unsupported external file attachment');};
 const params=property?.parameters;
 if(typeof id!=='string' || !id || typeof params?.filePath!=='string' ||
  typeof params.yaml!=='string' || !params.yaml || params.filePath.includes('\\'))fail();
 const file=params.filePath.split('/');
 if(file.some(segment=>!segment || segment==='.' || segment==='..' || segment.includes('\0')))fail();
 const result=structuredClone(owner),xml=result.representations?.xml;
 if(result.kind!=='object' || xml?.kind!=='record' || xml.fields?.length!==1 ||
   result.representations?.yaml?.kind!=='projection' ||
   result.representations.yaml.field!==xml.fields[0].field || xml.fields[0].file)fail();
 result.kind='fragment';result.id=id;
 // Prepared index ownership stays on the object; the fragment receives a typed input.
 for(const input of Object.values(result.inputs??{})){
  if(input.index!==undefined){if(!input.type)fail();delete input.index;}
 }
 xml.fields[0].file=file;
 if(params.required!==true)result.presence=[...(result.presence??[]),{target:{field:xml.fields[0].field},
  xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}}];
 result.representations.yaml={kind:'mapping',fields:[{field:xml.fields[0].field,key:params.yaml}]};
 return result;
}

// This is an explicitly limited owner projection, not acceptance of all its
// properties. Placement and field paths come from the source registration;
// context is ordinary declaration data, compiled by the existing machinery.
export function bindExternalFileOwner(fileOwner,attachment,source,profile) {
 const fail=()=>{throw new Error('Unsupported external file owner context');};
 if(!profile?.id || !Array.isArray(profile.fields) || !profile.fields.length ||
  attachment.kind!=='fragment' || !profile.identity?.component || !profile.identity?.input)fail();
 const root=sourceOwnerXmlRoute(source),placement=sourceOwnerPlacement(source);
 const text={kind:'scalar',scalar:'text'};
 const result={format:'nkdk-declarations/1',kind:'object',id:profile.id,
  namespaces:{md:'http://v8.1c.ru/8.3/MDClasses'},imports:{file:attachment.id},
  inputs:{[profile.identity.component]:{type:text}},compose:[{use:'file',bind:{}}],
  value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
 const names=new Set(),keys=new Set();
 for(const field of profile.fields){
  const matches=source.properties.filter(row=>row.name===field.property);
  const property=matches[0],params=property?.parameters;
  const nameDefault=reviewedPropertyExpression('defaultValue',params?.defaultValue);
  if(matches.length!==1 || (property.status!=='static-parameters' &&
    !(property.status==='requires-expression-mapping' && nameDefault?.kind==='owner-name-default' && property.issues?.length===1)) ||
   !['string','SystemEnumeration'].includes(property.type) || !field.field ||
   !field.key || names.has(field.field) || keys.has(field.key))fail();
  names.add(field.field);keys.add(field.key);
  const path=[...(params.xmlParents??[]),params.xml??property.name[0].toUpperCase()+property.name.slice(1)];
  if(path.some(part=>typeof part!=='string' || !/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(part)))fail();
  result.value.fields.push({name:field.field,type:structuredClone(text)});
  result.representations.xml.fields.push({field:field.field,path:[...root,...path.map(part=>'md:'+part)]});
  result.representations.yaml.fields.push({field:field.field,key:field.key});
  if(nameDefault?.kind==='owner-name-default'){
   result.inputs.ownerName={type:structuredClone(text)};
   (result.presence??=[]).push({target:{field:field.field},xml:{missing:{denotes:{input:'ownerName'}}},yaml:{missing:{denotes:{input:'ownerName'}}}});
  }
  if(typeof params.implicitValueYAML==='string'){
   const value={literal:params.implicitValueYAML};
   (result.presence??=[]).push({target:{field:field.field},
    xml:{missing:{denotes:value},canonical:[{when:{eq:[{field:field.field},value]},form:'missing'},{form:'ordinary'}]},
    yaml:{default:structuredClone(value)}});
  }
 }
 if(!names.has(profile.identity.name))fail();
 const bind=result.compose[0].bind;
 for(const [name,input] of Object.entries(attachment.inputs??{})){
  if(name===profile.identity.input){
   bind[name]={concat:[{input:profile.identity.component},{literal:'/'},
    {literal:placement.yamlDir+'.'},{field:profile.identity.name}]};
  }else if(profile.conditions?.[name]){
   const condition=profile.conditions[name];
   if(!names.has(condition.field) || typeof condition.equals!=='string')fail();
   bind[name]={eq:[{field:condition.field},{literal:condition.equals}]};
  }else{
   if(Object.hasOwn(result.inputs,name) || !fileOwner.inputs?.[name])fail();
   result.inputs[name]=structuredClone(fileOwner.inputs[name]);bind[name]={input:name};
  }
 }
 if(!bind[profile.identity.input])fail();
 return result;
}

// Extend the existing declaration rather than replacing its fields, types,
// presence, constraints, state history or resource composition with a probe.
export function attachExternalFileOwner(owner,fileOwner,attachment,source,profile,catalog=new Map()) {
 const fail=()=>{throw new Error('Unsupported existing external file owner context');};
 if(owner.kind!=='object' || owner.value?.kind!=='record')fail();
 const context=bindExternalFileOwner(fileOwner,attachment,source,profile);
 const fields=new Map();
 const visit=(module,seen=new Set())=>{
  if(seen.has(module.id) || module.value?.kind!=='record')fail();
  for(const field of module.value.fields){if(fields.has(field.name))fail();fields.set(field.name,module);}
  for(const part of module.compose??[]){
   const fragment=catalog.get(module.imports?.[part.use]);
   if(!fragment)fail();visit(fragment,new Set(seen).add(module.id));
  }
 };
 visit(owner);
 const remap=new Map(profile.fields.map(field=>[field.field,field.ownerField??field.property]));
 if([...remap.values()].some(field=>!fields.has(field)))fail();
 const expanded=(path,module)=>{
  if(!Array.isArray(path))fail();
  return path.map(segment=>{
   if(typeof segment!=='string')fail();
   const parts=segment.split(':');
   if(parts.length>2 || (parts.length===2 && !module.namespaces?.[parts[0]]))fail();
   return [parts.length===2?module.namespaces[parts[0]]:'',parts.at(-1)];
  });
 };
 for(const [name,actual] of remap){
  const module=fields.get(actual);
  let xml=module.representations?.xml;
  if(xml?.kind==='with-attributes')xml=xml.content;
  const paths=xml?.fields?.filter(field=>field.field===actual);
  const expected=context.representations.xml.fields.find(field=>field.field===name);
  if(paths?.length!==1 || !isDeepStrictEqual(expanded(paths[0].path,module),expanded(expected.path,context)))fail();
 }
 const result=structuredClone(owner);result.imports??={};result.inputs??={};result.compose??=[];
 if(Object.values(result.imports).includes(attachment.id))fail();
 let alias='externalFile',suffix=1;
 while(Object.hasOwn(result.imports,alias))alias='externalFile'+suffix++;
 result.imports[alias]=attachment.id;
 const typed=composeOwnerFragments(context.id,[{alias,fragment:{kind:'fragment',id:attachment.id,
  imports:fileOwner.imports,inputs:context.inputs},bindings:Object.fromEntries(Object.keys(context.inputs).map(name=>[name,name]))}]);
 const typeAliases=new Map();
 for(const [name,id] of Object.entries(typed.imports)){
  if(name===alias)continue;
  let target=Object.entries(result.imports).find(([,dependency])=>dependency===id)?.[0];
  if(!target){target=name;suffix=1;while(Object.hasOwn(result.imports,target))target=name+suffix++;result.imports[target]=id;}
  typeAliases.set(name,target);
 }
 const typeInput=value=>{
  if(Array.isArray(value))return value.map(typeInput);
  if(!value || typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,
   key==='use'?typeAliases.get(child):typeInput(child)]));
 };
 const inputs=new Map();
 for(const [name,original] of Object.entries(typed.inputs)){
  const input=typeInput(original);
  let target=name;
  if(Object.hasOwn(result.inputs,target) && !isDeepStrictEqual(result.inputs[target],input)){
   if(name===profile.identity.component)fail();
   target=alias+'_'+name;suffix=1;
   while(Object.hasOwn(result.inputs,target))target=alias+'_'+name+suffix++;
  }
  result.inputs[target]=structuredClone(input);inputs.set(name,target);
 }
 const rewrite=value=>{
  if(Array.isArray(value))return value.map(rewrite);
  if(!value || typeof value!=='object')return value;
  if(typeof value.field==='string'){
   if(!remap.has(value.field))fail();return {field:remap.get(value.field)};
  }
  if(typeof value.input==='string'){
   if(!inputs.has(value.input))fail();return {input:inputs.get(value.input)};
  }
  return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,rewrite(child)]));
 };
 result.compose.push({use:alias,bind:rewrite(context.compose[0].bind)});
 return result;
}
