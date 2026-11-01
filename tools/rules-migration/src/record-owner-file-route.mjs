import {recordOwnerFactSources} from './record-owner-fact-sources.mjs';
import {sourceResourceFingerprints} from './source-resource-facts.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {attachOwnerMembership} from './owner-membership-source.mjs';
import {sourceChildNameFacts} from './source-child-name-facts.mjs';
import {sourceInternalTypeFacts} from './source-internal-type-facts.mjs';

// Source assembly only: mount checked fragment roles, never generated prefixes.
// Rust receives ordinary route bindings and prepared declaration indexes.
export function recordOwnerFileRoute(source,assembly,catalog,
 {xmlDirectory,yamlDirectory,yamlFile='Свойства.yaml',maxBytes,baseComponent='cf',factSources:additionalSources=[]}={}) {
 if(!xmlDirectory || !yamlDirectory || assembly.coverage.pending.length || assembly.indexRequirements.missing.length)
  throw new Error('Complete registered file owner required');
 const factSources=recordOwnerFactSources(source,assembly,catalog);
 const [own,states,base]=factSources;
 const children=sourceChildNameFacts(source,assembly.owner.id,catalog);
 factSources.push(...children.modules.filter(module=>module.kind==='object'));
 attachOwnerMembership(source,base);
 const snapshot=(entry,field)=>({snapshot:{entry:entry.id,field}});
 const identity=snapshot(own,'uuid'),name=snapshot(own,'name');
 const internalTypes=sourceInternalTypeFacts(source,assembly.owner.id,catalog,{yamlKind:yamlDirectory});
 factSources.push(...internalTypes);
 const membership=catalog.get(base.imports?.belonging);
 if(!membership?.enum.Native || !membership.enum.Adopted)
  throw new Error('Registered owner membership required for file context');
 const adopted={byComponent:{cf:{literal:false},cfe:{select:{on:snapshot(base,'objectBelonging'),
  cases:{[membership.enum.Native]:{literal:false},[membership.enum.Adopted]:{literal:true}}}}}};
 const roles={component:'component',adopted,compatibilityMode:'compatibilityMode',ownerName:name,
  defaultLanguage:'defaultLanguage',registeredLanguages:'registeredLanguages',name,
  kind:{literal:sourceOwnerXmlRoute(source).at(-1).split(':').at(-1)},
  baseComponent:{literal:baseComponent},...children.bindings};
 const inputs={},modules=new Map([...catalog,...assembly.modules.map(row=>[row.id,row])]);
 for(const part of assembly.owner.compose) {
  const module=modules.get(assembly.owner.imports[part.use]);
  if(!module)throw new Error('Missing file context fragment');
  for(const [role,binding] of Object.entries(part.bind??{})) {
   if(!binding.input || assembly.indexRequirements.bindings[binding.input])continue;
   const value=role==='owner'?(module.id===assembly.state.module.id ||
    module.id==='fragment.resource-state-policy'?identity:'parent'):roles[role];
   if(value===undefined)throw new Error('Unbound file context role: '+role);
   if(inputs[binding.input] && JSON.stringify(inputs[binding.input])!==JSON.stringify(value))
    throw new Error('Conflicting file context role: '+role);
   inputs[binding.input]=structuredClone(value);
  }
 }
 for(const input of Object.keys(assembly.owner.inputs??{}))
  if(!assembly.indexRequirements.bindings[input] && !(input in inputs))
   throw new Error('Unbound owner file input: '+input);
 const fingerprints=sourceResourceFingerprints(source,{identitySource:own.id,maxBytes});
 for(const source of additionalSources) {
  const declaration=catalog.get(source.entry);
  if(declaration?.kind!=='object')throw new Error('Missing registered fact source: '+source.entry);
  factSources.push(declaration);
 }
 const location={xmlDir:xmlDirectory,yamlDir:yamlDirectory,...(yamlFile===null?{}:{yamlFile})};
 const route={...location,owners:{cf:assembly.owner.id,cfe:assembly.owner.id},ownerFacts:false,inputs,
  sources:[{entry:own.id,inputs:{component:'component',owner:'parent',ownerName:'name'}},
   {entry:states.id,inputs:{owner:identity},newOwner:{template:{}}},
   {entry:base.id,inputs:{component:'component',owner:identity},newOwner:{template:{}}},
   ...internalTypes.map(module=>({entry:module.id,inputs:{owner:identity,ownerName:name}})),
   ...fingerprints,...children.sources,...structuredClone(additionalSources)]};
 const factRoutes=fingerprints.map(row=>({...location,entry:row.entry,fromBase:true,only:[baseComponent],
  factDirections:['yaml-to-xml'],inputs:row.inputs}));
 return {route,factRoutes,factSources,contextModules:children.modules};
}
