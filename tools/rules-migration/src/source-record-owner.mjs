import {ownerResourceStates} from './owner-resource-states.mjs';
import {sourceResourceFacts} from './source-resource-facts.mjs';
import {sourceFileOwners} from './source-file-owners.mjs';
import {sourceTabularCollections} from './source-tabular-collections.mjs';
import {sourceInputHistory} from './source-input-history.mjs';
import {renameOwnerFields} from './owner-fragment.mjs';
import {sourceOwnerAttachments} from './source-owner-attachments.mjs';
import {numericOwnerFragment} from './numeric-owner-fragment.mjs';
import {ownerBaseState} from './owner-base-state.mjs';
import {ownerStateRecords} from './owner-state-records.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {assembleSourceOwner} from './source-owner-assembly.mjs';
import {stateCapabilitiesFor} from './state-contributions.mjs';
import {sourceScalarHistory} from './source-scalar-history.mjs';
import {ownerSemanticStates} from './owner-semantic-states.mjs';
import {ownerStateSections} from './owner-state-sections.mjs';

// Source registration -> full declaration. Conversion remains in the common
// AOT compiler; this adapter contains no XML/YAML conversion callbacks.
export function assembleRecordStateOwner(source,catalog,{id,xmlNamespace,attachments=[]}={}) {
 if(!id)throw new Error('Record owner identity required');
 const inputHistory=sourceInputHistory(source,catalog);
 let history=inputHistory?.status==='candidate'?renameOwnerFields(inputHistory.module,inputHistory.renames):numericOwnerFragment(id+'.history',sourceOwnerXmlRoute(source),[],catalog,[],source);
 // This fragment owns history, not numeric properties or their base values.
 if(inputHistory?.status!=='candidate') {
  delete history.inputs.baseNumbers;
  delete history.imports.number;
 }
 history.inputs.component={type:{kind:'scalar',scalar:'text'}};
 const scalars=sourceScalarHistory(history,source,catalog);
 history=scalars.module;
 const sections=ownerStateSections(history,source,catalog);
 const base=ownerBaseState(sections.module,source,{id:id+'.base-state',catalog});
 const state=ownerStateRecords(base,source,new Map([...catalog,
  ...[...scalars.declarations,...sections.declarations].map(row=>[row.id,row])]),{id:id+'.state'});
 state.declarations.push(...scalars.declarations,...sections.declarations);
 if(inputHistory?.status==='candidate') {
  state.properties=[...inputHistory.properties,...state.properties];
  state.fieldViews={...inputHistory.fieldViews,...state.fieldViews};
 }
 state.properties=[...scalars.properties,...state.properties];
 state.fieldViews={...scalars.fieldViews,...state.fieldViews};
 // The base-relation fragment already owns a registered runtime-only path.
 // Claim it by its XML registration, even when no record payload is supported.
 const route=sourceOwnerXmlRoute(source);
 const qualify=name=>name.includes(':')?name:'md:'+name;
 const serviceProperties=source.properties.filter(property=>property.parameters?.runtimeOnly===true &&
  (state.module.representations.xml.fields.some(field=>JSON.stringify(field.path)===JSON.stringify([
   ...route,...(property.parameters.xmlParents??[]).map(qualify),
   qualify(property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1)),
  ])) || property.parameters.xml===undefined && property.parameters.xmlParents===undefined &&
    state.module.representations.yaml.fields.some(field=>field.key===property.parameters.yaml)))
    .map(property=>property.name);
 const claimed=attachments.flatMap(row=>row.properties);
 const collections=sourceTabularCollections(source,catalog,id,{claimed});
 const services=sourceOwnerAttachments(source,id,{catalog,claimed:[...claimed,...collections.attachments.flatMap(row=>row.properties)]});
 const local=new Map([...catalog,...state.declarations.map(row=>[row.id,row]),...collections.modules.map(row=>[row.id,row])]);
 const assembly=assembleSourceOwner(source,local,{id,xmlNamespace,
  extensionContext:{adopted:'state_adopted',component:'state_component'},
  attachments:[{alias:'state',properties:[...state.properties,...serviceProperties],module:state.module,fieldViews:state.fieldViews,
   indexProviders:{...(inputHistory?.status==='candidate'?inputHistory.indexProviders:{states:'metadata.property-state-membership',baseIds:'metadata.base-identities'}),...scalars.indexProviders}},...services.attachments,...collections.attachments,...attachments],
 });
 assembly.modules.push(...state.declarations,...collections.modules.filter(row=>!assembly.modules.some(module=>module.id===row.id)));
 assembly.coverage.blockers.push(...services.blockers,...collections.blockers);
 if(inputHistory?.status==='blocked')assembly.coverage.blockers.push({reason:inputHistory.reason});
 sourceFileOwners(assembly,source,catalog,{claimed,component:'state_component'});
 const semantic=ownerSemanticStates(assembly,source,state,catalog);
 const attached=new Set([...state.properties,...semantic,'extendedConfigurationObject',
  ...sections.properties.filter(name=>assembly.coverage.assembled.includes(name))]);
 assembly.coverage.stateContracts=Object.entries(stateCapabilitiesFor(source))
  .filter(([,contract])=>contract.modes?.length)
  .map(([property,contract])=>({property,representation:contract.representation,
   requiresHistory:contract.representation!=='plain',
   attached:contract.representation==='plain'
    ? assembly.coverage.assembled.includes(property) : attached.has(property)}));
 const resourceFactSources=sourceResourceFacts(source,{blockers:assembly.coverage.blockers});
 ownerResourceStates(assembly,source,state,catalog,resourceFactSources);
 assembly.coverage.complete=assembly.coverage.pending.length===0 && assembly.coverage.blockers.length===0;
 return {...assembly,state,resourceFactSources};
}
