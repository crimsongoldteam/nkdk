// Derive extension defaults from the same property parameters used by rules.ts.
// The resulting conditions live in the declaration; Rust ownership code sees
// only ordinary presence expressions.
import {readFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {reviewedPropertyExpression} from './reviewed-property-expressions.mjs';

export function deriveOwnerDefaultProfiles(fragment,source,{adopted:adoptedContext,catalog}={}) {
 fragment.inputs.component={type:{kind:'scalar',scalar:'text'}};
 const adopted=adoptedContext??{and:[{present:{field:'objectBelonging'}},
  {eq:[{field:'objectBelonging'},{literal:'Adopted'}]}]};
 const native={not:adopted};
 for(const field of fragment.value.fields) {
  const property=source.properties.find(item=>item.name===field.name);
  if(property?.type==='I8nText' && property.parameters?.defaultValueXMLRaw==='' &&
    field.type.use)field.type.with={...(field.type.with??{}),preserveEmptyXML:true};
  const presence=fragment.presence?.find(row=>row.target?.field===field.name);
  if(catalog && field.type.with?.allowEmpty===true && property?.parameters?.defaultValueXMLRaw==='' && presence) {
   const payload=catalog.get(fragment.imports[field.type.use]);
   const candidates=(payload?.value?.variants??[]).filter(variant=>{
    const value=catalog.get(payload.imports[variant.type.use]);
    return value?.value?.kind==='record' && value.value.fields.length===0 &&
      ['xml','yaml'].every(side=>JSON.stringify(value.representations?.[side]?.parts)==='[{"literal":""}]');
   });
   if(candidates.length!==1)throw new Error('Unique declared empty value required: '+field.name);
   const empty={variant:{name:candidates[0].name,value:{record:{}}}};
   delete presence.xml.empty;
   presence.yaml={...(presence.yaml??{}),missing:{denotes:empty},
    omitWhen:{isVariant:{value:{field:field.name},variant:candidates[0].name}}};
  }
  const sparseDefault=adoptedContext && property?.parameters &&
    Object.hasOwn(property.parameters,'defaultValueXML') &&
    !Object.hasOwn(property.parameters,'defaultValueAdoptedXML');
  const dependent=reviewedPropertyExpression('toXML',property?.parameters?.toXML)?.kind==='xml-dependent-adopted-default';
  const hiddenContextHeader=adoptedContext && property?.type==='SystemEnumeration' &&
    property.parameters?.typeSE==='ObjectBelonging' && property.parameters.toYAML===false &&
    property.parameters.fromYAML===false && presence?.yaml?.default;
  if(hiddenContextHeader) {
   presence.yaml.default={if:adopted,then:{literal:'Adopted'},else:presence.yaml.default};
  }
  if(property?.type==='I8nText' && property.parameters?.excludeIfEqualNameYAML===true &&
    property.parameters?.defaultValueXMLRaw==='' && presence) {
   const nameWords=yaml.load(readFileSync('rust/declarations/common/i8n-text.yaml','utf8'))
    .types['name-words'];
   fragment.types={...(fragment.types??{}),'name-words':nameWords};
   presence.yaml={...(presence.yaml??{}),missing:{denotes:{if:adopted,then:{absent:true},else:{match:{
     value:{transform:{local:'name-words',value:{input:'ownerName'}}},
     present:{as:'words',then:{sequence:[{record:{language:{input:'defaultLanguage'},
      content:{var:'words'}}}]}},absent:{absent:true}}}}}};
   presence.xml.canonical=[{when:{and:[native,
    {not:{present:{field:field.name}}}]},form:'empty-element'}];
  }
  if(property?.type==='I8nText' && property.parameters?.defaultValueXMLRaw==='' &&
    property.parameters?.excludeIfEqualNameYAML!==true && presence) {
   const empty={sequence:[{record:{language:{input:'defaultLanguage'},content:{literal:''}}}]};
   presence.yaml={...(presence.yaml??{}),missing:{denotes:{if:native,then:empty,else:{absent:true}}},
    omitWhen:{and:[native,
     {eq:[{field:field.name},empty]}]}};
   presence.xml.canonical=[{when:{and:[native,
    {not:{present:{field:field.name}}}]},form:'empty-element'}];
  }
  if(property?.parameters?.preserveExplicitDefaultXML===true &&
    property.parameters?.defaultValueXMLRaw==='' && presence?.xml?.empty?.length) {
   presence.xml.canonical=[{when:{and:[
    native,
    {not:{present:{field:field.name}}}]},form:'empty-element'},
    ...(presence.xml.canonical??[])];
  }
  if(!sparseDefault && !hiddenContextHeader && presence?.yaml?.default && property?.parameters &&
    !Object.hasOwn(property.parameters,'defaultValueAdoptedXML')) {
   presence.xml.canonical=[
    {when:{and:[
     adopted,
     {eq:[{field:field.name},presence.yaml.default]}]},form:'missing'},
    ...(presence.xml.canonical??[{form:'ordinary'}])];
  }
  if(property?.type==='MetadataItemLink' && ['this','type'].includes(property.parameters?.metadataTarget?.owner) &&
    property.parameters?.metadataTarget?.memberKinds?.length===1 &&
    property.parameters.metadataTarget.memberKinds[0]==='Form' &&
    property.parameters?.defaultValueXMLRaw==='') {
   if(!presence?.xml?.empty?.length)throw new Error('Missing form-link empty contract: '+field.name);
   delete presence.xml.empty;
   presence.yaml={...(presence.yaml??{}),
    empty:[{form:'null',denotes:{absent:true}}],
    nullWhen:{and:[{eq:[{input:'component'},{literal:'cfe'}]},
     {not:{present:{field:'objectBelonging'}}},
     {isVariant:{value:{field:field.name},variant:'empty'}}]},
    omitWhen:{and:[
    {eq:[{input:'component'},{literal:'cf'}]},
    {isVariant:{value:{field:field.name},variant:'empty'}}]}};
   presence.xml.canonical=[
    {when:{and:[{eq:[{input:'component'},{literal:'cfe'}]},adopted,
     {not:{present:{field:field.name}}}]},form:'missing'},
    ...presence.xml.canonical];
  }
  if(adoptedContext && !hiddenContextHeader && !dependent && presence?.xml &&
    (sparseDefault || presence.xml.canonical?.length)) {
   presence.xml.canonical??=[{form:'ordinary'}];
   presence.xml.canonical.unshift({when:{and:[adopted,
     {not:{present:{field:field.name}}}]},form:'missing'});
   if(sparseDefault && presence.xml.missing?.denotes &&
     presence.xml.missing.denotes.absent!==true)
    presence.xml.missing.denotes={if:adopted,then:{absent:true},else:presence.xml.missing.denotes};
   if(sparseDefault && presence.yaml?.default) {
     const fallback=presence.yaml.default;
     presence.yaml={...presence.yaml,missing:{denotes:fallback},
       omitWhen:{eq:[{field:field.name},fallback]}};
     delete presence.yaml.default;
   }
   if(presence.yaml?.missing?.denotes) {
     if(presence.yaml.missing.denotes.absent!==true)
      presence.yaml.missing.denotes={if:adopted,then:{absent:true},else:presence.yaml.missing.denotes};
     if(presence.yaml.omitWhen)presence.yaml.omitWhen={if:adopted,
       then:{literal:false},else:presence.yaml.omitWhen};
   }
  }
 }
 return fragment;
}
