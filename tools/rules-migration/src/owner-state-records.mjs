import {recordStateView} from './record-state-view.mjs';
import {emitCandidates} from './emit.mjs';
import {asOwnerFragment} from './owner-fragment.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {sourceOwnerFieldOrder} from './source-owner-assembly.mjs';
import {groupedRecordState} from './grouped-record-state.mjs';
import {statefulScalarDeclarations} from './stateful-scalar.mjs';
import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {yaml} from './candidate-catalog.mjs';
import {mapProperty} from './mappings.mjs';
import {stateCapabilitiesFor,stateVersionConstraints} from './state-contributions.mjs';
import {stateHistoryEntries} from './state-history.mjs';
import {mergeOwnerFragments} from './owner-composition.mjs';
import {deriveOwnerDefaultProfiles} from './owner-default-profiles.mjs';
import {orderNumericHistory} from './numeric-owner-fragment.mjs';

const profiles=yaml.load(readFileSync(new URL('../contracts/record-state-profiles.yaml',import.meta.url),'utf8')).values;

// Discover structured states by the source capabilities and the common contract.
// A new property using a registered common adds no branch to the runtime.
export function sourceRecordStateFields(source,catalog) {
 const capabilities=stateCapabilitiesFor(source);
 return source.properties.flatMap(property=>{
  const capability=capabilities[property.name];
  if(!['tagged','multi'].includes(capability?.representation))return [];
  const mapped=mapProperty(property,catalog);
  // Runtime-only relations belong to the separate owner-context attachment;
  // this discovery neither claims them nor marks the owner accepted.
  if(mapped.reason==='runtime-only-profile')return [];
  // Discovery attaches supported record states only. Ordinary source emission
  // keeps every unresolved property in coverage.pending, never as an anomaly.
  if(mapped.status!=='candidate')return [];
  if(!['record','sequence'].includes(catalog.get(mapped.id)?.value?.kind))return [];
  const profile=profiles[mapped.id];
  if(!profile)throw new Error(`Unregistered record state profile: ${mapped.id}`);
  const selected=structuredClone(profile);
  delete selected.view;
  if(selected.grouped)delete selected.grouped.viewGroups;
  if(capability.representation!=='multi')delete selected.grouped;
  if(capability.representation==='multi' && !selected.grouped)
   throw new Error(`Missing grouped state profile: ${mapped.id}`);
  return [{name:property.name,...selected}];
 });
}

// Attach registered record values to the existing shared owner history.
// Only declaration data is emitted; common readers derive their own fields.
export function ownerStateRecords(fragment,source,catalog,{id,fields=sourceRecordStateFields(source,catalog)}) {
 if(!id || !Array.isArray(fields))throw new Error('Record state attachment requires fields and identity');
 const declarations=[],fragments=[],fieldViews={};
 let module=structuredClone(fragment);
 for(const {name,plainForm,fragmentId=id+'.'+name,stateId=id+'.'+name+'.state',grouped} of fields) {
  const property=source.properties.find(row=>row.name===name);
  if(!property || module.value.fields.some(row=>row.name===name))throw new Error(`Invalid record state property: ${name}`);
  const emission=emitCandidates([{...source,properties:[property]}],catalog);
  const emitted=emission.modules.find(row=>row.kind==='fragment'&&row.value.fields.some(field=>field.name===name));
  if(!emitted || emission.entries.some(row=>row.properties.some(property=>property.status!=='candidate')))throw new Error(`Unresolved record state property: ${name}`);
  const extra=asOwnerFragment({...emitted,namespaces:{...emitted.namespaces,md:'http://v8.1c.ru/8.3/MDClasses'}},
   fragmentId,sourceOwnerXmlRoute(source),'md');
  const value=extra.value.fields.find(row=>row.name===name),semantic=extra.imports[value.type.use];
  if(catalog.get(semantic)?.value?.kind==='sequence') {
   (extra.inputs??={}).adopted=structuredClone(module.inputs.adopted);
   deriveOwnerDefaultProfiles(extra,source,{adopted:{input:'adopted'}});
  }
  if(!['record','sequence'].includes(catalog.get(semantic)?.value?.kind) || !['sequence','mapping-any','input-profile'].includes(plainForm))
   throw new Error(`Record state representation required: ${name}`);
  const payloadBindings=structuredClone(value.type.bind??{}),common=catalog.get(semantic);
  const variants=[['changed','extend'],['notified','notify'],['plain','control']];
  let wrappers=statefulScalarDeclarations({ids:{main:stateId,changed:stateId+'.changed',notified:stateId+'.notified',plain:stateId+'.plain'},
   payload:'value',type:{...value.type,use:'semantic'},semantic,implicit:false,plainForm,taggedForm:'tagged',payloadInputs:common.inputs,payloadImports:common.imports});
  const normalPresence=extra.presence.find(row=>row.target.field===name);
  if(common.value.kind==='sequence' && normalPresence?.yaml?.missing) {
   const normalDefault=structuredClone(normalPresence.yaml.missing.denotes);
   const payloadDefault=value=>Array.isArray(value)?value.map(payloadDefault):value&&typeof value==='object'?
    (Object.keys(value).length===1&&Object.hasOwn(payloadBindings,value.input)?{input:'value_'+value.input}:
     Object.fromEntries(Object.entries(value).map(([key,child])=>[key,payloadDefault(child)]))):value;
   const specialize=value=> {
    if(Array.isArray(value))return value.map(specialize);
    if(!value||typeof value!=='object')return value;
    if(value.parameter)return {literal:(Object.hasOwn(extra.value.fields[0].type.with??{},value.parameter)?extra.value.fields[0].type.with[value.parameter]:common.parameters[value.parameter].default)};
    if(value.input&&Object.hasOwn(payloadBindings,value.input))return structuredClone(payloadBindings[value.input]);
    const result=Object.fromEntries(Object.entries(value).map(([key,child])=>[key,specialize(child)]));
    if(result.if&&typeof result.if.literal==='boolean')return result.if.literal?result.then:result.else;
    return result;
   };
   const spelling=expression=> {
    const forms=common.presence?.find(row=>row.target==='self'||row.target?.self)?.yaml?.empty??[];
    const form=forms.find(row=>row.form==='empty-string'&&isDeepStrictEqual(specialize(row.denotes),expression));
    if(!form)throw new Error(`State default needs a declared scalar empty spelling: ${name}`);
    return {parseYaml:{literal:''}};
   };
   const wrap=value=>value.absent?value:value.if?{if:value.if,then:wrap(value.then),else:wrap(value.else)}:spelling(value);
   normalPresence.yaml.missing.denotes=wrap(normalDefault);
   // Parsed defaults use the compiler's complete-value equality, retaining tags.
   if(normalPresence.yaml.omitWhen)normalPresence.yaml.omitWhen={literal:false};
   const explicitDefaults=[];
   const collect=value=> {if(value.if){collect(value.then);collect(value.else);}else if(!value.absent&&!explicitDefaults.some(row=>isDeepStrictEqual(row,value)))explicitDefaults.push(value);};
   collect(normalDefault);
   if(explicitDefaults.length!==1)throw new Error(`State empty XML needs one declared default: ${name}`);
   for(const wrapper of wrappers)if(wrapper.value.kind==='record')wrapper.presence.push({target:{field:'value'},xml:{empty:[
    {form:'empty-element',denotes:payloadDefault(explicitDefaults[0])}]}});
  }
  if(grouped) {
   wrappers=groupedRecordState(wrappers,catalog.get(grouped.semantic),{grouped,parameters:value.type.with,bindings:payloadBindings});
   variants.push(['grouped',grouped.capability??'multi']);
  }
  // Each property has its own state contract, even when payload commons match.
  const stateAlias='state_'+name;
  if(extra.imports[stateAlias] && extra.imports[stateAlias]!==stateId)
   throw new Error(`Conflicting record state import: ${stateAlias}`);
  delete extra.imports[value.type.use];
  extra.imports[stateAlias]=stateId;
  extra.inputs={...extra.inputs,owner:structuredClone(wrappers[0].inputs.owner),states:structuredClone(wrappers[0].inputs.states),
   adopted:structuredClone(module.inputs.adopted),compatibilityMode:{type:{use:'compatibility'}}};
  if(!extra.inputs.adopted)throw new Error('Record state attachment requires adopted owner context');
  const xml=property.parameters.xml??name[0].toUpperCase()+name.slice(1);
  value.type={use:stateAlias,bind:{property:{literal:xml},owner:{input:'owner'},states:{input:'states'},
   ...Object.fromEntries(Object.entries(payloadBindings).map(([input,expression])=>['value_'+input,expression]))}};
  if(plainForm==='input-profile')value.type.bind.presentation={literal:'ordinary'};
  if(grouped)value.type.bind.groupMode={if:{present:{lookup:{in:{input:'states'},key:{record:{
   owner:{input:'owner'},property:{literal:xml},mode:{literal:grouped.mode}}}}}},
   then:{literal:grouped.mode},else:{literal:'Control'}};
  extra.imports.compatibility='system.CompatibilityMode';
  extra.constraints=stateVersionConstraints(source,[property],catalog.get('system.CompatibilityMode').enum,row=>row.name,{variants});
  const availability=Object.fromEntries(variants.flatMap(([variant,mode])=>{
   const rule=extra.constraints.find(rule=>rule.id===`state-version-${name}-${mode}`);
   return rule?[[variant,rule.assert]]:[];
  }));
  const history=stateHistoryEntries({field:name,property:name,xml,availability,
   ...(grouped?{modes:[{variant:'changed',mode:'Extended'},{variant:'notified',mode:'Notify'},{variant:'grouped',mode:grouped.mode}]}:{})});
  module=mergeOwnerFragments(id,[module,extra]);
  const defaults=module.presence.find(row=>row.target.field==='history')?.yaml?.default?.concat;
  if(!defaults)throw new Error('Record state attachment requires shared history');
  defaults.push(...history.defaults);
  module.constraints.push(...history.constraints);
  const view=recordStateView(common,wrappers.find(row=>row.id===stateId),{field:name,profile:profiles[semantic]?.view,grouped:grouped?{...profiles[semantic]?.grouped,...grouped}:undefined,catalog:new Map([...catalog,...wrappers.map(row=>[row.id,row])])});
  if(view)fieldViews[name]=view;
  declarations.push(...wrappers);
  fragments.push(extra);
 }
 const local=new Map([...catalog,[module.id,module],...declarations.map(row=>[row.id,row])]);
 const orderedFields=sourceOwnerFieldOrder(module,source,local);
 const order=['history',...orderedFields.filter(name=>name!=='history')];
 module.xmlOrder=order;
 module.representations.xml.fields.sort((left,right)=>order.indexOf(left.field)-order.indexOf(right.field));
 orderNumericHistory(module);
 return {module,declarations,fragments,fieldViews,properties:fields.map(row=>row.name)};
}
