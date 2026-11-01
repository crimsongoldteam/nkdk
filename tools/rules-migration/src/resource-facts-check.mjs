// Exercise actual application modules with only their resource-fact AOT entries.
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {candidateCatalog,dependencyFiles,yaml} from './candidate-catalog.mjs';
import {writeFocused,writeChanged} from './focused-output.mjs';
import {readFileSync} from 'node:fs';
import {recordOwnerFactSources} from './record-owner-fact-sources.mjs';
import {recordOwnerFileOperation} from './record-owner-file-operation.mjs';
import {sourceResourceFingerprints} from './source-resource-facts.mjs';
import {assembleRecordStateOwner} from './source-record-owner.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';
import {ownerResourceStates} from './owner-resource-states.mjs';
import {ownerIndexRequirements,bindPreparedOwnerIndexes} from './owner-index-requirements.mjs';
import {baseReferenceSource} from './owner-base-state.mjs';
import {numberStateSource} from './numeric-owner-fragment.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {sourceChildNameFacts} from './source-child-name-facts.mjs';
import {sourceOwnerAttachments} from './source-owner-attachments.mjs';
import {sourceInternalTypeFacts} from './source-internal-type-facts.mjs';

const root=fileURLToPath(new URL('../../../',import.meta.url));
process.chdir(root);
execFileSync(process.execPath,['tools/rules-migration/src/source-resource-facts.mjs','--check'],
 {cwd:root,stdio:'inherit'});
const entries=['migration.journal-help-pages-source','migration.resource-presence-source','migration.resource-fingerprint-source','migration.resource-state-comparison'];
const {catalog}=candidateCatalog();
const modules=entries.map(id=>{
 const module=catalog.get(id);
 if(!module)throw new Error('Missing resource fact declaration: '+id);
 return module;
});
const storageSource=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'))
 .entries.find(row=>row.symbol==='MetadataSettingsStorageRules');
const childFacts=sourceChildNameFacts(storageSource,'migration.storage-context',catalog);
const storageAssembly=assembleRecordStateOwner(storageSource,catalog,{
 id:'migration.storage-context',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses',
});
const storageIdentity=recordOwnerFactSources(storageSource,storageAssembly,catalog)[0];
const storageTypes=sourceInternalTypeFacts(storageSource,storageAssembly.owner.id,catalog,
 {yamlKind:'ХранилищеНастроек'})[0];
if(!storageTypes)throw new Error('Registered internal type source required');
modules.push(storageIdentity,storageTypes);
entries.push(storageIdentity.id,storageTypes.id);
modules.push(...childFacts.modules);
entries.push(...childFacts.sources.map(row=>row.entry));
const children=sourceOwnerAttachments(storageSource,'migration.storage-context',{catalog})
 .attachments.find(row=>row.alias==='children');
if(!children)throw new Error('Registered child attachment required');
const childOwner=composeOwnerFragments('migration.storage-child-files',[
 {alias:'children',fragment:children.module,
  bindings:Object.fromEntries(Object.keys(children.module.inputs).map(name=>[name,name]))},
]);
modules.push(children.module,childOwner);
entries.push(childOwner.id);
const childRoute=join(root,'rust/target/resource-boundary-check/child-names-route.json');
// Compile the real source-mounted child fragment. This proves context and
// resource wiring, not acceptance of the full owner or its form conversion.
// Compile only the real XDTO state composition, not the entire owner catalog.
// Its resource policies are mounted by the same adapter used by full owners.
const source=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'))
 .entries.find(row=>row.symbol==='MetadataXDTOPackageRules');
const generated=assembleRecordStateOwner(source,catalog,{id:'migration.resource-state-owner-probe',
 xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
const state=generated.state;
const statePart=generated.owner.compose.find(part=>generated.owner.imports[part.use]===state.module.id);
const owner=composeOwnerFragments(generated.owner.id,[{alias:'state',fragment:state.module,
 bindings:Object.fromEntries(Object.entries(statePart.bind).map(([name,value])=>[name,value.input]))}]);
const local=new Map([...catalog,...generated.modules.map(row=>[row.id,row])]);
const assembly={owner,modules:[state.module,...state.declarations,owner],coverage:{blockers:[]},
 indexRequirements:ownerIndexRequirements(owner,local,{[state.module.id]:{
  states:'metadata.property-state-membership',baseIds:'metadata.base-identities',
 }})};
ownerResourceStates(assembly,source,state,local,generated.resourceFactSources);
const preparedOwner=bindPreparedOwnerIndexes(owner,assembly.indexRequirements);
const baseSource=baseReferenceSource(state.module,owner.id+'.base-source');
const statesSource=numberStateSource(owner.id+'.states-source',sourceOwnerXmlRoute(source));
const identitySource=recordOwnerFactSources(source,generated,catalog)[0];
const profile=yaml.load(readFileSync('tools/rules-migration/profiles/record-file-owners.yaml','utf8'))
 .find(row=>row.symbol===source.symbol);
const fileOperation=recordOwnerFileOperation({entries:[source]},catalog,{...profile,
 xmlDirectory:'Inputs',yamlDirectory:'Outputs',maxBytes:131072});
const preparedFullOwner=catalog.get(profile.id);
if(!preparedFullOwner || JSON.stringify(preparedFullOwner)!==JSON.stringify(fileOperation.owner))
 throw new Error('Saved full file declaration must match its registered source operation');
for(const module of [preparedOwner,state.module,...state.declarations,baseSource,statesSource,identitySource,...fileOperation.factSources,...fileOperation.modules,preparedFullOwner]) {
 catalog.set(module.id,module);
 if(!modules.some(row=>row.id===module.id))modules.push(module);
}
entries.push(preparedOwner.id,baseSource.id,statesSource.id,identitySource.id,...fileOperation.factSources.map(row=>row.id),preparedFullOwner.id);
// The shared file-owner matrix runs the same routes against all registered
// profiles. Select their AOT dependencies without compiling unrelated owners.
const selectedOwners=process.env.NKDK_RECORD_FILE_ENTRIES?.split(',');
const selectedOperations=[];
for(const profile of yaml.load(readFileSync('tools/rules-migration/profiles/record-file-owners.yaml','utf8'))) {
 if(selectedOwners && !selectedOwners.includes(profile.id))continue;
 const operation=recordOwnerFileOperation(
  JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')),catalog,profile);
 selectedOperations.push(operation);
 for(const module of operation.modules) {
  catalog.set(module.id,module);
  if(!modules.some(row=>row.id===module.id))modules.push(module);
 }
 entries.push(operation.owner.id,...operation.factSources.map(row=>row.id));
}
const paths=writeFocused(join(root,'rust/target/resource-boundary-check'),{
 'boundary.yaml':yaml.dump({format:'nkdk-declarations/1',kind:'catalog',
  declarations:[...modules,...dependencyFiles(modules,catalog)]},{noRefs:true}),
},{cases:[]});
writeChanged(childRoute,JSON.stringify({format:'nkdk-operation-routes/1',routes:[{
 xmlDir:'Inputs',yamlDir:'Outputs',yamlFile:'Свойства.yaml',
 owners:{cf:childOwner.id},inputs:childFacts.bindings,sources:[
  {entry:storageIdentity.id,inputs:{component:'component',owner:'parent',ownerName:'name'}},
  {entry:storageTypes.id,inputs:{
   owner:{snapshot:{entry:storageIdentity.id,field:'uuid'}},
   ownerName:{snapshot:{entry:storageIdentity.id,field:'name'}},
  }},...childFacts.sources,
 ],
}]})+'\n');
const fingerprintSources=sourceResourceFingerprints(source,{identitySource:identitySource.id,maxBytes:131072});
writeChanged(join(root,'rust/target/resource-boundary-check/fingerprint-route.json'),JSON.stringify({
 format:'nkdk-operation-routes/1',routes:[{xmlDir:'Inputs',yamlDir:'Outputs',yamlFile:'Свойства.yaml',
  owners:{cf:'migration.resource-presence-source'},inputs:{},sources:[
   {entry:identitySource.id,inputs:{component:'component',owner:{literal:''},ownerName:'name'}},...fingerprintSources,
  ]}],
 factRoutes:[{xmlDir:'Inputs',yamlDir:'Outputs',yamlFile:'Свойства.yaml',
  entry:fingerprintSources[0].entry,fromBase:true,only:['cf'],factDirections:['yaml-to-xml'],
  inputs:fingerprintSources[0].inputs}],
},null,2)+'\n');
writeChanged(join(root,'rust/target/resource-boundary-check/file-operation-route.json'),JSON.stringify({
 format:'nkdk-operation-routes/1',routes:[fileOperation.route],factRoutes:fileOperation.factRoutes,
},null,2)+'\n');
const selectedRoute=join(root,'rust/target/resource-boundary-check/selected-file-routes.json');
if(selectedOwners)writeChanged(selectedRoute,JSON.stringify({format:'nkdk-operation-routes/1',
 routes:selectedOperations.map(row=>row.route),factRoutes:selectedOperations.flatMap(row=>row.factRoutes)})+'\n');
const env={...process.env,...(selectedOwners?{NKDK_RECORD_FILE_ROUTES:selectedRoute}:{}),NKDK_MIGRATION_CATALOG:paths.catalog,
 NKDK_CHILD_NAME_ROUTE:childRoute,
 NKDK_MIGRATION_EXPORTS:entries.join(','),CARGO_TARGET_DIR:join(root,'rust/target/migration-contracts'),
 CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0',CARGO_PROFILE_TEST_DEBUG:'0'};
const args=['--manifest-path','../tools/rules-migration/runtime/Cargo.toml','--offline','--locked','-j','1','--features','resource-boundary','--test','resource_boundary'];
for(const command of ['test','clippy'])execFileSync('cargo',[command,...args,
 ...(command==='clippy'?['--','-D','warnings']:[])],{cwd:join(root,'rust'),env,stdio:'inherit'});
