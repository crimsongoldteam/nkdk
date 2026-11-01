import {readFileSync} from 'node:fs';
import {commonInputs,mergeInputs} from './common-inputs.mjs';

const profiles=JSON.parse(readFileSync(new URL('../profiles/declared-elements.json',import.meta.url),'utf8'));

// Only checked source registrations can publish a reusable element contract.
// Field defaults and name/id restoration belong to that declaration.
export function declaredElementProperty(property,catalog,registrations=profiles) {
  const p=property.parameters,profile=registrations[p?.type];
  if(!profile)return undefined;
  const fail=reason=>({status:'blocked',reason});
  if(Object.keys(p).some(key=>!['type','yaml','xml','xmlParents','toEnterprise','defaultValueXMLEmpty'].includes(key)))
    return fail('declared-element-parameters');
  if(Object.hasOwn(p,'defaultValueXMLEmpty') &&
    (p.defaultValueXMLEmpty?.itemType!==profile.itemType || Object.keys(p.defaultValueXMLEmpty).length!==1))
    return fail('declared-element-empty-profile');
  const declaration=catalog.get(profile.declaration);
  if(declaration?.kind!=='value' || declaration.value?.kind!=='record')return fail('unsupported-element-body');
  const xml=p.xml??property.name[0].toUpperCase()+property.name.slice(1),parents=p.xmlParents??[];
  if(typeof p.yaml!=='string' || !p.yaml || !Array.isArray(parents) || [...parents,xml].some(part=>
    typeof part!=='string' || !/^[A-Za-z][A-Za-z0-9]*$/.test(part)))return fail('declared-element-path');
  const lifted=commonInputs(declaration),inputs={},bind={};
  if(Object.keys(profile.inputs).length!==Object.keys(lifted.inputs).length)return fail('declared-element-context');
  for(const [name,input] of Object.entries(lifted.inputs)) {
    const target=profile.inputs[name];
    if(typeof target!=='string' || !target)return fail('declared-element-context');
    mergeInputs(inputs,{[target]:input});bind[name]={input:target};
  }
  return {status:'candidate',id:declaration.id,type:{use:'value',bind},inputs,imports:lifted.imports,
    path:[...parents,xml],key:p.yaml,
    ...(Object.hasOwn(p,'toEnterprise')?{excludedParameters:['toEnterprise']}:{}),
    presence:{target:{field:property.name},xml:{missing:{denotes:{absent:true}}},
      yaml:{missing:{denotes:{record:{}}}}}};
}

export function elementPropertyProfile(assembly,itemType) {
  const inputs={};
  for(const part of assembly.owner.compose)for(const [name,expression] of Object.entries(part.bind)) {
    if(typeof expression.input!=='string')continue;
    if(inputs[expression.input] && inputs[expression.input]!==name)throw new Error('Ambiguous element context input');
    inputs[expression.input]=name;
  }
  if(Object.keys(assembly.owner.inputs).some(name=>!inputs[name]))throw new Error('Unclassified element context');
  return {declaration:assembly.owner.id,itemType,inputs};
}
