import {compatibilityConstraints} from './compatibility-constraints.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {yaml} from './candidate-catalog.mjs';

// Source-to-declaration correspondence for the researched borrowed-base profile.
// No conversion runs here; the resulting ordinary declarations compile to Rust.
export function attachBorrowedBase(emission,source,catalog) {
  if(emission.results.length!==1 || emission.results[0].status!=='candidate')throw new Error('Expected one complete base collection candidate');
  const properties=source.properties;
  if(!['uuid','name','synonym','objectBelonging','extendedConfigurationObject'].every(name=>properties.some(p=>p.name===name)))throw new Error('Incomplete borrowed-base source');
  const contracts=source.propertyStates??[];
  for(const contribution of contracts)for(const item of [contribution.item,...(contribution.delta?.items??[])].filter(Boolean)) {
    for(const [name,state] of Object.entries(item.properties??{})) {
      if(state.availability==='own')continue;
      if(name==='extendedConfigurationObject' && state.representation==='tagged' && state.modes.every(mode=>['control','notify'].includes(mode)))continue;
      if(name==='synonym' && state.representation==='plain' && state.modes.every(mode=>mode==='extend'))continue;
      throw new Error('Unmapped state source: '+name);
    }
  }
  if(!contracts.length)throw new Error('Missing borrowed-base source registry');
  const result=structuredClone(emission);
  const [row,list,owner]=result.modules;
  const relation=yaml.load(readFileSync(new URL('../contracts/borrowed-base.yaml',import.meta.url),'utf8'));
  Object.assign(row.imports,{state:'common.base-reference-state',rows:'common.property-states'});
  row.value.fields.push(...relation.value.fields);
  row.representations.xml.fields.push(...relation.representations.xml.fields);
  row.representations.yaml.fields.push({field:'state',key:'ОбъектРасширяемойКонфигурации'});
  row.imports.boolean='common.boolean';row.value.fields.push({name:'participates',type:{use:'boolean'}});
  const profile={if:{present:{field:'objectBelonging'}},then:{eq:[{field:'objectBelonging'},{literal:'Adopted'}]},else:{literal:false}};
  row.presence.push({target:{field:'participates'},xml:{missing:{denotes:profile}},yaml:{missing:{denotes:profile}}});
  const adopted={field:'participates'};
  row.value.fields.push({name:'implicitName',type:{kind:'scalar',scalar:'text'}});
  const implicitName={if:adopted,then:{absent:true},else:{field:'name'}};
  row.presence.push({target:{field:'implicitName'},xml:{missing:{denotes:implicitName}},yaml:{missing:{denotes:implicitName}}});
  row.value.fields.find(f=>f.name==='synonym').type.bind.ownerName={field:'implicitName'};
  const synonymPresence=row.presence.find(p=>p.target.field==='synonym');
  synonymPresence.xml.canonical=[{when:{and:[{not:{present:{field:'synonym'}}},adopted]},form:'missing'},...synonymPresence.xml.canonical];

  row['state-relations']=relation['state-relations'];
  row['state-relations'][0].sources.base.present={if:adopted,then:{require:{lookup:{in:{input:'baseIds'},key:{record:{component:{input:'component'},identity:{field:'uuid'}}}}}},else:{absent:true}};
  row.presence.push(...relation.presence,{target:{field:'state'},yaml:{omitWhen:{not:adopted}}});
  row.presence.find(p=>p.target.field==='rows').yaml.missing.denotes.else={if:adopted,then:{sequence:[]},else:{absent:true}};
  for(const fields of [row.value.fields,row.representations.xml.fields]) {
    const i=fields.findIndex(f=>(f.name??f.field)==='rows');fields.unshift(...fields.splice(i,1));
  }
  const baseType={type:{kind:'index',key:{kind:'record',fields:['component','identity'].map(name=>({name,type:{kind:'scalar',scalar:'text'}}))},value:{kind:'scalar',scalar:'text'}}};
  for(const m of result.modules)m.inputs.baseIds=structuredClone(baseType);
  list.value.item.bind.baseIds={input:'baseIds'};owner.value.fields[0].type.bind.baseIds={input:'baseIds'};owner.inputs.baseIds.index='metadata.base-identities';

  for(const module of result.modules)module.inputs.compatibilityMode={type:{kind:'scalar',scalar:'text'}};
  list.value.item.bind.compatibilityMode={input:'compatibilityMode'};owner.value.fields[0].type.bind.compatibilityMode={input:'compatibilityMode'};
  (row.constraints??=[]).push(...compatibilityConstraints(source,catalog));

  // The source metadata envelope supplies MDClasses for all unqualified paths.
  // Keep this namespace in the complete child operation instead of stripping it.
  for(const module of result.modules) {
    (module.namespaces??={}).md='http://v8.1c.ru/8.3/MDClasses';
    const xml=module.representations.xml;
    for(const mapping of xml.fields??[xml])if(mapping.path)mapping.path=mapping.path.map(name=>name.includes(':')?name:`md:${name}`);
  }

  // Hash the completed modules, not the earlier base-only candidate.
  for(const [module,consumer,alias] of [[row,list,'item'],[list,owner,'items'],[owner,null,null]]) {
    delete module.id;
    module.id='candidate.borrowed.'+createHash('sha256').update(JSON.stringify(module)).digest('hex').slice(0,20);
    if(consumer)consumer.imports[alias]=module.id;
  }
  result.results[0].declaration=owner.id;
  result.profile='own-and-borrowed';
  result.scope='Child conversion with declared compatibility; owner contributions require operation attachment';
  return result;
}
