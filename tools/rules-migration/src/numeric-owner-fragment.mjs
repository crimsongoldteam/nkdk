import {stateVersionConstraints} from './state-contributions.mjs';
import {baseNumberConstraints,ownerNumberIndex} from './owner-number-facts.mjs';
import {statefulEnumerationId} from './stateful-scalar.mjs';
const pascal=name=>name[0].toUpperCase()+name.slice(1);
const xmlName=property=>property.parameters.xml??pascal(property.name);
import {stateModes as numericModes,stateHistoryEntries} from './state-history.mjs';
export {numericModes};
export const scalarPart=(name,payload,value={field:name})=>numericModes.reduceRight((otherwise,{variant})=>({
  if:{isVariant:{value,variant}},
  then:{get:{of:{variantValue:{value,variant}},field:payload}},else:otherwise}),
  {get:{of:{variantValue:{value,variant:'plain'}},field:payload}});
export const numericPart=name=>scalarPart(name,'capacity');
export function orderNumericHistory(fragment) {
 const order=new Map(fragment.representations.xml.fields.map((field,index)=>[field.path.at(-1).split(':').at(-1),index]));
 const history=fragment.presence.find(row=>row.target.field==='history');
 const rank=entry=>order.get(entry.then.sequence[0].record.name.literal)??Number.MAX_SAFE_INTEGER;
 const fixed=entry=>typeof entry.then.sequence[0].record.mode.literal==='string';
 // Field tags follow physical property order; computed relation notices retain
 // the tail order declared by their own inverse contract.
 const defaults=history.yaml.default.concat;
 history.yaml.default.concat=[...defaults.filter(fixed).sort((left,right)=>rank(left)-rank(right)),
  ...defaults.filter(entry=>!fixed(entry))];
}
export function numericDependencies(properties,source) {
 const keys=[...new Set(properties.flatMap(property=>property.parameters.maximumWhen?[property.parameters.maximumWhen.propertyKey]:[]))];
 return keys.map(key=>{
  const property=source.properties.find(row=>row.name===key);
  if(property?.type!=='SystemEnumeration')throw new Error(`Unsupported numeric dependency: ${key}`);
  return property;
 });
}
export const numberField=property=>({name:xmlName(property),type:{use:'number',bind:{
 implicit:{literal:property.parameters.implicitValueYAML},property:{literal:xmlName(property)},
 owner:{input:'owner'},states:{input:'states'}}}});
export function numberStateSource(id,route) {
  return {format:'nkdk-declarations/1',kind:'object',
      id,
      imports:{rows:'common.property-states'},namespaces:{md:'http://v8.1c.ru/8.3/MDClasses'},
      inputs:{owner:{type:{kind:'scalar',scalar:'text'}}},
      value:{kind:'record',fields:[{name:'states',type:{use:'rows'}}]},
      representations:{xml:{kind:'record',fields:[{field:'states',path:[...route,'md:InternalInfo']}]},
        yaml:{kind:'mapping',fields:[{field:'states',key:'Состояния'}]}},
      presence:[{target:{field:'states'},xml:{missing:{denotes:{sequence:[]}}},yaml:{missing:{denotes:{sequence:[]}}}}],
      contributions:[{index:'metadata.property-state-membership',duplicates:'coalesce-equal',
        forEach:{in:{field:'states'},as:'row'},
        key:{record:{owner:{input:'owner'},property:{get:{of:{var:'row'},field:'name'}},mode:{get:{of:{var:'row'},field:'mode'}}}},
        value:{literal:'present'}}]};

}
export function numericOwnerFragment(id,route,properties,catalog,selectors=[],source) {
    const fragment={format:'nkdk-declarations/1',kind:'fragment',id,
      namespaces:{md:'http://v8.1c.ru/8.3/MDClasses'},
      imports:{number:'common.stateful-number',stateRows:'common.property-states'},
      inputs:{adopted:{type:{kind:'scalar',scalar:'boolean'}},
        owner:{type:{kind:'scalar',scalar:'text'}},
        states:structuredClone(catalog.get('common.stateful-number').inputs.states),baseNumbers:structuredClone(ownerNumberIndex)},
      value:{kind:'record',fields:[{name:'history',type:{use:'stateRows'}},...properties.map(property=>numberField(property))]},
      representations:{xml:{kind:'record',fields:[{field:'history',path:[...route,'md:InternalInfo']},...properties.map(property=>({
        field:xmlName(property),path:[...route,'md:Properties',`md:${xmlName(property)}`]}))]},
      yaml:{kind:'mapping',fields:properties.map(property=>({
        field:xmlName(property),key:property.parameters.yaml})).concat([{field:'history',key:'Состояния'}])}},
      presence:[...properties.map(property=>({target:{field:xmlName(property)},
        xml:{missing:{denotes:{absent:true}}},
        yaml:{default:{if:{input:'adopted'},then:{absent:true},
          else:{variant:{name:'plain',value:{record:{capacity:{literal:property.parameters.implicitValueYAML},state:{literal:false}}}}}}}})),
      {target:{field:'history'},xml:{missing:{denotes:{sequence:[]}},canonical:[
        {when:{not:{exists:{in:{field:'history'},as:'row',where:{literal:true}}}},form:'missing'},
        {form:'ordinary'}]},
        yaml:{default:{concat:properties.flatMap(property=>stateHistoryEntries({field:xmlName(property),property:property.name}).defaults)}}}],};
    fragment.constraints=properties.flatMap(property=>stateHistoryEntries({field:xmlName(property),property:property.name}).constraints);
    fragment.constraints.push(...baseNumberConstraints(properties.map(xmlName),numericPart));
    for(const property of properties) for(const bound of ['minimum','maximum']) {
      const limit=property.parameters[bound];
      if(limit===undefined)continue;
      if(!Number.isSafeInteger(limit))throw new Error(`Unsupported numeric bound: ${property.name}.${bound}`);
      const field=xmlName(property),value=numericPart(field);
      fragment.constraints.push({id:`${property.name}-${bound}`,appliesTo:['xml-import','yaml-validation'],
        when:{present:{field}},assert:{lte:bound==='minimum'?[{literal:limit},value]:[value,{literal:limit}]},
        diagnostic:{code:`number.${bound}`,severity:'error',at:{field},message:`Число вне допустимой границы ${limit}`}});
    }
    for(const property of selectors) {
      const field=xmlName(property),alias='context_'+property.name;
      const valueType=statefulEnumerationId(property.type==='SystemEnumeration'?'system.'+property.parameters.typeSE:'common.'+(property.type==='string'?'string':'boolean'));
      if(!catalog.has(valueType))throw new Error(`Missing stateful scalar: ${valueType}`);
      fragment.imports[alias]=valueType;
      fragment.value.fields.push({name:field,type:{use:alias,bind:{
        implicit:{literal:property.parameters.implicitValueYAML},property:{literal:field},owner:{input:'owner'},states:{input:'states'}}}});
      if(property.type==='string')delete fragment.value.fields.at(-1).type.bind.implicit;
      fragment.representations.xml.fields.push({field,path:[...route,'md:Properties',`md:${field}`]});
      fragment.representations.yaml.fields.splice(-1,0,{field,key:property.parameters.yaml});
      fragment.presence.push({target:{field},xml:{missing:{denotes:{absent:true}}},yaml:{default:{
        if:{input:'adopted'},then:{absent:true},else:property.type==='string'?{absent:true}:{variant:{name:'plain',value:{record:{value:{literal:property.parameters.implicitValueYAML},state:{literal:false}}}}}}}});
      const history=stateHistoryEntries({field,property:property.name});
      fragment.presence.find(row=>row.target.field==='history').yaml.default.concat.push(...history.defaults);
      fragment.constraints.push(...history.constraints);
    }
    const dependencyContexts=new Map();
    for(const property of properties) {
      const condition=property.parameters.maximumWhen;
      if(!condition)continue;
      const selector=selectors.find(row=>row.name===condition.propertyKey),field=xmlName(property),dependency=xmlName(selector);
      const base={lookup:{in:{input:'baseNumbers'},key:{record:{owner:{input:'owner'},property:{literal:dependency}}}}};
      const dependencyAvailable={or:[{present:{field:dependency}},
        {not:{input:'adopted'}},{present:structuredClone(base)}]};
      dependencyContexts.set(field,dependencyAvailable);
      fragment.constraints.push({id:`${property.name}-dependency-present`,
        appliesTo:['xml-import','yaml-validation'],when:{present:{field}},
        assert:structuredClone(dependencyAvailable),
        diagnostic:{code:'base.context.missing',severity:'error',at:{field},
          message:'Нет значения зависимого свойства в объекте и основной конфигурации'}});
      const selected={if:{present:{field:dependency}},then:{eq:[scalarPart(dependency,'value'),{literal:condition.equals}]},
        else:{if:{input:'adopted'},then:{match:{value:base,present:{as:'baseSelector',then:{eq:[{var:'baseSelector'},{literal:condition.equals}]}},absent:{literal:false}}},
          else:{literal:selector.parameters.implicitValueYAML===condition.equals}}};
      fragment.constraints.push({id:`${property.name}-maximum-when`,appliesTo:['xml-import','yaml-validation'],
        when:{and:[{present:{field}},selected]},assert:{lte:[numericPart(field),{literal:condition.maximum}]},
        diagnostic:{code:'number.maximum',severity:'error',at:{field},message:`Число вне зависимой границы ${condition.maximum}`}});
    }
    if(!source)throw new Error('Numeric owner needs source state capabilities');
    fragment.imports.compatibility='system.CompatibilityMode';
    fragment.inputs.compatibilityMode={type:{use:'compatibility'}};
    const versionRules=stateVersionConstraints(source,[...properties,...selectors],catalog.get('system.CompatibilityMode').enum,xmlName);
    fragment.constraints.push(...versionRules);
    const defaults=fragment.presence.find(row=>row.target.field==='history').yaml.default.concat;
    for(const part of defaults) {
      const selected=part.if.isVariant;
      const rule=versionRules.find(rule=>rule.when.and.at(-1).isVariant.variant===selected.variant &&
        rule.when.and.at(-1).isVariant.value.field===selected.value.field);
      if(rule) {
        const numeric=properties.some(property=>xmlName(property)===selected.value.field);
        const basePresent={present:{lookup:{in:{input:'baseNumbers'},key:{record:{
          owner:{input:'owner'},property:{literal:selected.value.field}}}}}};
        const available=numeric?{and:[structuredClone(rule.assert),
          {or:[{not:{input:'adopted'}},basePresent]},
          ...(dependencyContexts.has(selected.value.field)?[structuredClone(dependencyContexts.get(selected.value.field))]:[])]}:structuredClone(rule.assert);
        part.if={and:[part.if,available]};
        const agreement=fragment.constraints.find(candidate=>candidate.id===
          `state-agrees-${[...properties,...selectors].find(property=>xmlName(property)===selected.value.field).name}-${selected.variant}`);
        agreement.when={and:[agreement.when,structuredClone(available)]};
      }
    }

    return fragment;
}
