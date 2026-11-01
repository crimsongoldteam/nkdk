import {readFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {stateCapabilitiesFor} from './state-contributions.mjs';
import {compatibilityConstraints} from './compatibility-constraints.mjs';

// Extend the existing history-owning fragment with the shared declarative
// base relation. This is source assembly; no XML/YAML conversion runs here.
export function ownerBaseState(fragment,source,{id,catalog}={}) {
 const property=source.properties.find(row=>row.name==='extendedConfigurationObject');
 const history=fragment.presence?.find(row=>row.target.field==='history');
 const registered=property?.status==='static-parameters' && property.type==='string' &&
  property.parameters?.runtimeOnly===true;
 const inherited=!property && stateCapabilitiesFor(source).extendedConfigurationObject?.availability==='borrowed';
 if(!(registered || inherited) ||
  !Array.isArray(history?.yaml?.default?.concat) || !fragment.inputs.adopted ||
  !fragment.inputs.component || !fragment.inputs.owner)
  throw new Error('Base reference requires a registered property or service policy and shared owner history');
 const result=structuredClone(fragment);
 result.id=id??fragment.id+'.base-state';
 const historyXml=result.presence.find(row=>row.target.field==='history').xml;
 const emptyHistory=historyXml.canonical?.find(row=>row.form==='missing')?.when;
 if(!emptyHistory)throw new Error('Base reference requires a declared empty history condition');
 historyXml.canonical.unshift({when:{and:[{input:'adopted'},structuredClone(emptyHistory)]},form:'empty-element'});
 const relation=yaml.load(readFileSync(new URL('../contracts/borrowed-base.yaml',import.meta.url),'utf8'));
 const rewrite=value=>{
  if(!value || typeof value!=='object')return;
  if(value.field==='rows')value.field='history';
  for(const child of Object.values(value))rewrite(child);
 };
 rewrite(relation);
 if(['state','base','notice'].some(name=>result.value.fields.some(row=>row.name===name)))
  throw new Error('Base reference conflicts with existing fields');
 result.imports.state=relation.imports.state;
 result.value.fields.push(...relation.value.fields.filter(row=>row.name!=='rows'));
 const route=sourceOwnerXmlRoute(source);
 const xml=relation.representations.xml.fields.find(row=>row.field==='base');
 result.representations.xml.fields.push({...xml,path:[...route,...xml.path.map(name=>'md:'+name)]});
 result.representations.yaml.fields.push({field:'state',key:property?.parameters.yaml??'ОбъектРасширяемойКонфигурации'});
 const text={kind:'scalar',scalar:'text'};
 result.inputs.baseIds={type:{kind:'index',key:{kind:'record',
  fields:['component','identity'].map(name=>({name,type:text}))},value:text}};
 const base={lookup:{in:{input:'baseIds'},key:{record:{
  component:{input:'component'},identity:{input:'owner'}}}}};
 relation['state-relations'][0].sources.base.present={if:{input:'adopted'},
  then:{require:base},else:{absent:true}};
 (result['state-relations']??=[]).push(...relation['state-relations']);
 result.presence.push({target:{field:'state'},yaml:{omitWhen:{not:{input:'adopted'}}}});
 const notice=relation.presence[0].yaml.missing.denotes;
 notice.else={sequence:[]};
 result.presence.find(row=>row.target.field==='history').yaml.default.concat.push(notice);
 const constraints=compatibilityConstraints(source,catalog,{participates:{input:'adopted'},enumInput:true});
 // This fragment owns the state, while ObjectBelonging lives in another part.
 constraints[0].diagnostic.at={field:'state'};
 (result.constraints??=[]).push(...constraints);
 return result;
}

export function baseReferenceSource(fragment,id) {
 const field=fragment.value.fields.find(row=>row.name==='base');
 const mapping=fragment.representations.xml.fields.find(row=>row.field==='base');
 if(!field || !mapping)throw new Error('Missing shared base reference');
 return {format:fragment.format,kind:'object',id,namespaces:fragment.namespaces,
  inputs:{component:fragment.inputs.component,owner:fragment.inputs.owner},
  value:{kind:'record',fields:[structuredClone(field)]},
  representations:{xml:{kind:'record',fields:[structuredClone(mapping)]},
   yaml:{kind:'mapping',fields:[{field:'base',key:'base'}]}},
  presence:[{target:{field:'base'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}}],
  contributions:[{index:'metadata.base-identities',when:{present:{field:'base'}},
   key:{record:{component:{input:'component'},identity:{input:'owner'}}},value:{field:'base'}}]};
}
