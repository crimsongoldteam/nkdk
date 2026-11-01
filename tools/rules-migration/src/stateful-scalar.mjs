import {readFileSync,writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {commonInputs} from './common-inputs.mjs';
import {candidateCatalog,yaml} from './candidate-catalog.mjs';
import {taggedNumberProperties,taggedScalarProperties,taggedTextProperties} from './state-contributions.mjs';
const template=yaml.load(readFileSync('tools/rules-migration/profiles/stateful-scalar.yaml','utf8'));
export const statefulEnumerationId=id=>'common.stateful.'+id;
export function statefulScalarDeclarations({ids,payload,type,semantic,implicit=true,plainForm,taggedForm='scalar',payloadInputs={},payloadImports={}}) {
 const bindings={$changed:ids.changed,$notified:ids.notified,$plain:ids.plain,$main:ids.main,$payload:payload,$type:type};
 const expand=value=>typeof value==='string'&&Object.hasOwn(bindings,value)?structuredClone(bindings[value]):
  Array.isArray(value)?value.map(expand):value&&typeof value==='object'?
   Object.fromEntries(Object.entries(value).map(([key,value])=>[bindings[key]??key,expand(value)])):value;
 const declarations=expand(template.declarations);
 const context=Object.keys(type.bind??{});
 const inputNames=Object.fromEntries(context.map(name=>[name,`${payload}_${name}`]));
 const lifted=commonInputs({imports:payloadImports,inputs:Object.fromEntries(context.map(name=>{
  const input=payloadInputs[name];
  if(!input?.type)throw new Error(`Missing payload input: ${name}`);
  return [name,input];
 }))});
 const inputs=Object.fromEntries(Object.entries(lifted.inputs).map(([name,input])=>{
  delete input.index;
  return [inputNames[name],input];
 }));
 for(const declaration of declarations) {
  for(const [name,input] of Object.entries(inputs)) {
   if(Object.hasOwn(declaration.inputs,name) && !isDeepStrictEqual(declaration.inputs[name],input))
    throw new Error(`Conflicting payload input: ${name}`);
   declaration.inputs[name]=structuredClone(input);
  }
  for(const [alias,dependency] of Object.entries(lifted.imports)) {
   if(Object.hasOwn(declaration.imports,alias) && declaration.imports[alias]!==dependency)
    throw new Error(`Conflicting payload input import: ${alias}`);
   declaration.imports[alias]=dependency;
  }
  for(const variant of declaration.value.variants??[])
   for(const name of Object.values(inputNames))variant.type.bind[name]={input:name};
  const field=declaration.value.fields?.find(field=>field.name===payload);
  if(field && context.length)field.type.bind=Object.fromEntries(context.map(name=>[name,{input:inputNames[name]}]));
 }
 if(semantic)for(const declaration of declarations)declaration.imports.semantic=semantic;
 for(const variant of declarations.find(row=>row.id===ids.main).representations.yaml.variants)
  if(variant.tag)variant.form=taggedForm;
 if(!implicit)for(const declaration of declarations) {
  delete declaration.inputs.implicit;
  for(const variant of declaration.value.variants??[])delete variant.type.bind.implicit;
  if(declaration.presence)declaration.presence=declaration.presence.filter(row=>row.target.field!==payload);
 }
 if(plainForm) {
  const variants=declarations.find(row=>row.id===ids.main).representations.yaml.variants;
  const plain=variants.find(row=>row.variant==='plain');
  if(plainForm==='input-profile') {
   const main=declarations.find(row=>row.id===ids.main);
   main.inputs.presentation={type:{kind:'scalar',scalar:'text'}};
   Object.assign(plain??{}, {form:plainForm,input:'presentation',equals:'ordinary'});
   if(!plain)variants.push({variant:'plain',form:plainForm,input:'presentation',equals:'ordinary'});
  } else if(plain)plain.form=plainForm;
  else variants.push({variant:'plain',form:plainForm});
 }
 return declarations;
}
export function statefulScalarCatalog(catalog=candidateCatalog().catalog) {
 const sourceEntries=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries;
 const entries=sourceEntries.filter(entry=>taggedNumberProperties(entry).length);
 const scalars=[...sourceEntries.flatMap(taggedScalarProperties),...sourceEntries
  .flatMap(taggedTextProperties)];
 const domains=new Set([...scalars.filter(property=>property.type==='SystemEnumeration').map(property=>property.parameters.typeSE),
  ...entries.flatMap(entry=>entry.properties.filter(row=>row.parameters?.maximumWhen)
  .map(row=>entry.properties.find(property=>property.name===row.parameters.maximumWhen.propertyKey)?.parameters?.typeSE))]);
 const declarations=[];
 for(const domain of domains) {
  const semantic='system.'+domain;
  if(!catalog.has(semantic))throw new Error(`Missing scalar enumeration: ${domain}`);
  const main=statefulEnumerationId(semantic);
  declarations.push(...statefulScalarDeclarations({ids:{main,changed:main+'.changed',notified:main+'.notified',plain:main+'.plain'},
   payload:'value',type:{use:'semantic'},semantic}));
 }
 if(scalars.some(property=>property.type==='boolean')) {
  const main=statefulEnumerationId('common.boolean');
  declarations.push(...statefulScalarDeclarations({ids:{main,changed:main+'.changed',notified:main+'.notified',plain:main+'.plain'},
   payload:'value',type:{use:'semantic'},semantic:'common.boolean'}));
 }
 if(scalars.some(property=>property.type==='string')) {
  const main=statefulEnumerationId('common.string');
  declarations.push(...statefulScalarDeclarations({ids:{main,changed:main+'.changed',notified:main+'.notified',plain:main+'.plain'},
   payload:'value',type:{use:'semantic'},semantic:'common.string',implicit:false}));
 }
 return declarations;
}
if(process.argv[1]?.endsWith('stateful-scalar.mjs')) {
 const outputs={
  'rust/declarations/common/stateful-system-enumerations.generated.yaml':statefulScalarCatalog(),
  'rust/declarations/common/stateful-number.yaml':statefulScalarDeclarations({ids:{main:'common.stateful-number',changed:'common.changed-number',notified:'common.notified-number',plain:'common.plain-number'},
   payload:'capacity',type:{kind:'scalar',scalar:'number',profile:'decimal'}}),
 };
 for(const [path,declarations] of Object.entries(outputs)) {
  const content=yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations},{noRefs:true});
  if(process.argv.includes('--check')) {if(readFileSync(path,'utf8')!==content)throw new Error(`Stale scalar declaration: ${path}`);}
  else writeFileSync(path,content);
 }
}
