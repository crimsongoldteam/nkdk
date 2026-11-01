const text=()=>({kind:'scalar',scalar:'text'});
export const ownerNumberIndex={type:{kind:'index',key:{kind:'record',fields:[
  {name:'owner',type:text()},{name:'property',type:text()}]},
  value:text()}};
const key=name=>({record:{owner:{input:'owner'},property:{literal:name}}});
const lookup=name=>({lookup:{in:{input:'baseNumbers'},key:key(name)}});
export function scalarTextExpression(type,value) {
 if(type==='number')return {decimalText:value};
 if(type==='SystemEnumeration')return {enumText:value};
 if(type==='boolean')return {if:value,then:{literal:'true'},else:{literal:'false'}};
 throw new Error('Unsupported base scalar kind: '+type);
}
export function ownerNumberFactSource(id,route,properties,selectors=[]){
 const declaration={format:'nkdk-declarations/1',kind:'object',id,
  namespaces:{md:'http://v8.1c.ru/8.3/MDClasses'},imports:{number:'common.exact-decimal'},
  inputs:{owner:{type:text()}},
  value:{kind:'record',fields:properties.map(name=>({name,type:{use:'number'}}))},
  representations:{xml:{kind:'record',fields:properties.map(field=>({field,path:[...route,'md:Properties',`md:${field}`]}))},
   yaml:{kind:'mapping',fields:properties.map(field=>({field,key:field}))}},
  presence:properties.map(field=>({target:{field},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}})),
  contributions:properties.map(field=>({index:'metadata.base-owner-numbers',
   when:{present:{field}},key:key(field),value:{decimalText:{field}}}))};
 for(const property of selectors) {
  const field=property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1),alias='context_'+property.name;
  declaration.imports[alias]=property.type==='boolean'?'common.boolean':'system.'+property.parameters.typeSE;
  declaration.value.fields.push({name:field,type:{use:alias}});
  declaration.representations.xml.fields.push({field,path:[...route,'md:Properties',`md:${field}`]});
  declaration.representations.yaml.fields.push({field,key:field});
  declaration.presence.push({target:{field},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}});
  declaration.contributions.push({index:'metadata.base-owner-numbers',when:{present:{field}},key:key(field),value:scalarTextExpression(property.type,{field})});
 }
 return declaration;
}
// The working primary YAML uses source-derived names/defaults; fact snapshots
// retain the independent XML presence policy. No metadata kind is interpreted.
export function ownerNumberYamlProjection(source,properties) {
 const result=structuredClone(source);result.id=source.id+'.current-yaml';
 const byField=new Map(properties.map(property=>[
  property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1),property]));
 for(const field of result.representations.yaml.fields) {
  const property=byField.get(field.field);
  if(!property?.parameters?.yaml || property.parameters.implicitValueYAML===undefined)
   throw new Error('Missing primary scalar fact contract: '+field.field);
  field.key=property.parameters.yaml;
  result.presence.find(row=>row.target.field===field.field).yaml={missing:{denotes:{literal:property.parameters.implicitValueYAML}}};
 }
 return result;
}
export function baseScalarConstraints(properties,lexicalValue){
 return properties.flatMap(field=>{
  const active={and:[{input:'adopted'},{present:{field}}]};
  const diagnostic=(code,severity,message)=>({code,severity,at:{field},message});
  return [{id:`base-present-${field}`,appliesTo:['yaml-validation'],when:active,
   assert:{present:lookup(field)},diagnostic:diagnostic('base.property.missing','error','Свойство отсутствует в основной конфигурации')},
   ...[{variant:'plain',severity:'error'},{variant:'notified',severity:'warning'}].map(({variant,severity})=>({
    id:`base-value-${field}-${variant}`,appliesTo:['yaml-validation'],
    when:{and:[active,{isVariant:{value:{field},variant}}]},
    assert:{match:{value:lookup(field),present:{as:'base',then:{eq:[lexicalValue(field),{var:'base'}]}},absent:{literal:true}}},
    diagnostic:diagnostic('base.value.changed',severity,'Значение отличается от основной конфигурации'),
   }))];
 });
}

export const baseNumberConstraints=(properties,numberValue)=>baseScalarConstraints(properties,field=>scalarTextExpression('number',numberValue(field)));
