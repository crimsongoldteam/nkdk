// Declaration data shared by scalar and structured fields; no value conversion.
export const stateModes=[{variant:'changed',mode:'Extended'},{variant:'notified',mode:'Notify'}];
// Compare the complete semantic value, including the selected variant and its
// hidden fields, rather than its shortened YAML projection.
export function stateValueOmission(field,value) {
 if(value.if)return {if:structuredClone(value.if),then:stateValueOmission(field,value.then),else:stateValueOmission(field,value.else)};
 // Physically absent fields are omitted by the writer itself; no comparison
 // between a typed choice and the absence marker is required.
 if(value.absent)return {literal:false};
 if(!value.variant)throw new Error('Typed state default required');
 const {name,value:payload}=value.variant;
 return {and:[{isVariant:{value:{field},variant:name}},
  {eq:[{variantValue:{value:{field},variant:name}},structuredClone(payload)]}]};
}
export function stateHistoryEntries({field,property,xml=field,availability={},modes=stateModes}) {
 const selected=variant=>({isVariant:{value:{field},variant}});
 const guarded=(condition,variant)=>availability[variant]
  ?{and:[condition,structuredClone(availability[variant])]}:condition;
 return {
  defaults:modes.map(({variant,mode})=>({
   if:guarded(selected(variant),variant),
   then:{sequence:[{record:{name:{literal:xml},mode:{literal:mode}}}]},else:{sequence:[]}})),
  constraints:modes.map(({variant,mode})=>({id:`state-agrees-${property}-${variant}`,
   appliesTo:['yaml-validation'],when:guarded({present:{field}},variant),
   assert:{eq:[selected(variant),{exists:{in:{field:'history'},as:'row',where:{and:[
    {eq:[{get:{of:{var:'row'},field:'name'}},{literal:xml}]},
    {eq:[{get:{of:{var:'row'},field:'mode'}},{literal:mode}]},
   ]}}}]},diagnostic:{code:'state.expected',severity:'error',at:{field},
    message:'Пометка не соответствует явно заданным состояниям'}})),
 };
}
