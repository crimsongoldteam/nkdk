import {stateCapabilitiesFor} from './state-contributions.mjs';
import {ownerIndexRequirements} from './owner-index-requirements.mjs';

// Source registrations supply names; the shared declaration owns comparison.
// No file IO, value conversion or metadata-specific runtime branch lives here.
export function ownerResourceStates(assembly,source,state,catalog,factSources) {
 const paths=factSources.flatMap(row=>row.resourcePresence?.paths??[]);
 if(!paths.length)return;
 const policy=catalog.get('fragment.resource-state-policy');
 if(policy?.kind!=='fragment' || policy.value.fields.length)
  throw new Error('Fieldless resource state policy required');
 const part=assembly.owner.compose.find(row=>assembly.owner.imports[row.use]===state.module.id);
 if(!part)throw new Error('Resource state requires mounted owner history');
 const context=name=>{
  const expression=part.bind?.[name];
  if(!expression)throw new Error('Missing resource state context: '+name);
  return structuredClone(expression);
 };
 const owner=assembly.owner;
 const addInput=(name,input)=>{
  if(owner.inputs[name])throw new Error('Resource state input collision: '+name);
  owner.inputs[name]=structuredClone(input);
 };
 addInput('resource_baseComponent',policy.inputs.baseComponent);
 for(const name of ['resource_fingerprints','resource_registrations'])
  addInput(name,policy.inputs.fingerprints);
 const component=context('component'),identity=context('owner');
 const base={lookup:{in:context('baseIds'),key:{record:{component,identity}}}};
 const baseOwner={if:{present:base},then:{require:base},else:{literal:''}};
 const baseComponent={input:'resource_baseComponent'};
 const lookup=(input,component,owner,property)=>({lookup:{in:{input},key:{record:{
  component,owner,property:{literal:property},
 }}}});
 const fields=new Set(state.module.value.fields.map(row=>row.name));
 const contains=(field,name)=>fields.has(field)?{exists:{in:{field},as:'resourceSection',where:{eq:[
  {get:{of:{var:'resourceSection'},field:'name'}},{literal:name},
 ]}}}:{literal:false};
 const capabilities=stateCapabilitiesFor(source);
 for(const path of paths) {
  const property=source.properties.find(row=>row.name===path.name),capability=capabilities[path.name];
  if(!property || !capability?.externalName)throw new Error('Resource state registration required');
  const changed=contains('section_extend',capability.externalName);
  const notified=contains('section_notify',capability.externalName);
  const controlled={exists:{in:{field:'history'},as:'resourceHistory',where:{and:[
   {eq:[{get:{of:{var:'resourceHistory'},field:'name'}},
    {literal:property.parameters.xml??path.name[0].toUpperCase()+path.name.slice(1)}]},
   {eq:[{get:{of:{var:'resourceHistory'},field:'mode'}},{literal:'Control'}]},
  ]}}};
  const alias='resourceState_'+path.name;
  if(owner.imports[alias])throw new Error('Resource state alias collision');
  owner.imports[alias]=policy.id;
  owner.compose.push({use:alias,bind:{component,owner:identity,baseComponent,baseOwner,
   active:{or:[changed,notified,controlled,{and:[context('adopted'),
    {present:lookup('resource_fingerprints',component,identity,path.name)}]}]},
   basePropertyExists:{present:lookup('resource_registrations',baseComponent,baseOwner,path.name)},
   fingerprints:{input:'resource_fingerprints'},property:{literal:path.name},
   mode:{if:changed,then:{literal:'extend'},else:{if:notified,then:{literal:'notify'},else:{literal:'control'}}},
  }});
 }
 assembly.indexRequirements=ownerIndexRequirements(owner,new Map([...catalog,
  ...assembly.modules.map(row=>[row.id,row])]),{[owner.id]:{
   ...assembly.indexRequirements.bindings,
   resource_fingerprints:'metadata.resource-fingerprints',
   resource_registrations:'metadata.resource-registrations',
 }});
 // Composition is ready; independent identity snapshots and base-component
 // route bindings still require full-file acceptance before removing this gate.
 assembly.coverage.blockers.push({properties:paths.map(row=>row.name),reason:'resource-state-fact-routing-required'});
}
