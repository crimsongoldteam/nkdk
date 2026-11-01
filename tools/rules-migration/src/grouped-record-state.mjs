import {commonInputs} from './common-inputs.mjs';
// Add a declared grouped alternative alongside the existing whole-value states.
// The XML/YAML converters remain those of the referenced declarations.
export function groupedRecordState(wrappers,common,{grouped,parameters={},bindings={}}) {
 if(common?.value?.kind!=='record' || !grouped.mode)
  throw new Error('Grouped record state requires a complete declaration descriptor');
 const result=structuredClone(wrappers),main=result.find(row=>row.value.kind==='choice');
 if(!main || Object.hasOwn(main.inputs,'groupMode'))throw new Error('Grouped record mode input conflicts with payload');
 let alias='grouped';
 while(Object.hasOwn(main.imports,alias))alias+='Value';
 main.imports[alias]=common.id;
 main.inputs.groupMode={type:{kind:'scalar',scalar:'text'}};
 const bind={},liftedInputs=commonInputs(common);
 for(const [alias,dependency] of Object.entries(liftedInputs.imports)) {
  if(main.imports[alias] && main.imports[alias]!==dependency)throw new Error(`Conflicting grouped input import: ${alias}`);
  main.imports[alias]=dependency;
 }
 for(const [name,input] of Object.entries(liftedInputs.inputs)) {
  const lifted=main.inputs['value_'+name];
  if(JSON.stringify(input.type)!==JSON.stringify(lifted?.type) || !bindings[name])
   throw new Error(`Grouped payload input differs: ${name}`);
  bind[name]={input:'value_'+name};
 }
 const withParameters=Object.fromEntries(Object.entries(parameters).filter(([name])=>Object.hasOwn(common.parameters??{},name)));
 main.value.variants.push({name:'grouped',type:{use:alias,
  ...(Object.keys(bind).length?{bind}:{}),...(Object.keys(withParameters).length?{with:withParameters}:{})}});
 main.representations.yaml.variants.push({variant:'grouped',form:'input-profile',input:'groupMode',equals:grouped.mode});
 return result;
}
