import {sourceFileOwners} from './source-file-owners.mjs';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {candidateCatalog,yaml} from './candidate-catalog.mjs';
import {loadSources} from './source-snapshot.mjs';
import {assembleSourceOwner} from './source-owner-assembly.mjs';
import {sourceOwnerAttachments} from './source-owner-attachments.mjs';
import {sourceOwnerCollections} from './source-owner-collections.mjs';
import {ownerBaseState,baseReferenceSource} from './owner-base-state.mjs';
import {ownerStateScalars} from './owner-state-scalars.mjs';
import {ownerStateRecords} from './owner-state-records.mjs';

export function characteristicOwnerOperation(extraction,catalog,graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'))) {
 const source=extraction.entries.find(row=>row.symbol==='MetadataChartOfCharacteristicTypesRules');
 if(!source)throw new Error('Missing characteristic owner registration');
 const prefix='candidate.characteristic-assembled',attachments=[];
 const services=sourceOwnerAttachments(source,prefix,{catalog});
 if(services.blockers.length)throw new Error('Unresolved characteristic source attachments: '+JSON.stringify(services.blockers));
 attachments.push(...services.attachments);
 const input=catalog.get('fragment.input-by-string.chartofcharacteristictypes');
 if(!input)throw new Error('Missing accepted input-by-string declaration');
 const scalars=ownerStateScalars(input,source,catalog);
 const baseState=ownerBaseState(scalars.module,source,{id:prefix+'.input-base-state',catalog});
 const records=ownerStateRecords(baseState,source,catalog,{id:prefix+'.input-state',fields:[{name:'type',plainForm:'sequence'}]});
 const inputState=records.module;
 attachments.push({alias:'input',properties:['inputByString','codeLength','descriptionLength','extendedConfigurationObject',...scalars.properties,...records.properties],module:inputState});
 const edges=graph.edges.filter(edge=>edge.owner.symbol===source.symbol && edge.property==='tabularSections');
 if(edges.length!==1)throw new Error('Missing characteristic tabular-section registration');
 const collections=sourceOwnerCollections(source,extraction,catalog,graph,{
  id:prefix,properties:['attributes','tabularSections'],
  composedItems:{tabularSections:`migration.${edges[0].item.symbol.replace(/Rules$/,'')}`},
 });
 attachments.push(...collections.attachments);
 const collectionCatalog=new Map([...catalog,...collections.modules.map(module=>[module.id,module]),
  ...records.declarations.map(module=>[module.id,module])]);
 const assembly=assembleSourceOwner(source,collectionCatalog,{id:prefix,attachments});
 assembly.owner.inputs.input_baseIds.index='metadata.base-identities';
 assembly.modules.push(baseReferenceSource(inputState,prefix+'.base-identity'),...records.declarations);
 assembly.modules.push(...collections.modules.filter(module=>!assembly.modules.some(row=>row.id===module.id)));
 assembly.coverage.blockers.push(...collections.blockers);
 assembly.coverage.collectionRequirements=collections.requirements;

 sourceFileOwners(assembly,source,catalog,{profiles:[yaml.load(readFileSync(
  'tools/rules-migration/profiles/predefined-characteristic-envelope.yaml','utf8'))]});
 return assembly;
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 loadSources(extraction.sourceHashes);
 const path='rust/declarations/candidates/characteristic-owner.generated.yaml';
 const {catalog}=candidateCatalog({excludePaths:[path]});
 const result=characteristicOwnerOperation(extraction,catalog);
 // Existing fragments are referenced by ID, never copied into the output catalog.
 const modules=result.modules.filter(module=>!catalog.has(module.id));
 const outputs=[
  [path,'# Generated from rules.ts by characteristic-owner-operation.mjs; pending acceptance\n'+
   yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:modules},{noRefs:true})],
  ['tests/migration/characteristic-owner-coverage.json',JSON.stringify(result.coverage,null,2)+'\n'],
 ];
 for(const [output,content]of outputs)if(process.argv.includes('--check') &&
  (!existsSync(output)||readFileSync(output,'utf8')!==content))throw new Error('Stale characteristic assembly: '+output);
 if(!process.argv.includes('--check'))for(const [output,content]of outputs)
  if(!existsSync(output)||readFileSync(output,'utf8')!==content)writeFileSync(output,content);
}
