import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {candidateCatalog,dependencyFiles,yaml} from '../../../../tools/rules-migration/src/candidate-catalog.mjs';
import {runtimeExports} from '../../../../tools/rules-migration/src/family-check.mjs';
import {writeFocused} from '../../../../tools/rules-migration/src/focused-output.mjs';
import {appearanceStringCases} from './cases.mjs';
import {appearanceCollectionCases,lexiconLookupCases,workingAppearanceCases} from './collection-cases.mjs';

const {catalog}=candidateCatalog();
const collection=process.argv.includes('--collection');
const declarations=['./declaration.yaml'].flatMap(path=>yaml.load(readFileSync(new URL(path,import.meta.url),'utf8')).declarations);
for(const declaration of declarations)catalog.set(declaration.id,{format:'nkdk-declarations/1',...declaration});
const {modules,cases:allCases,factSources:declaredFactSources}=(collection?appearanceCollectionCases:appearanceStringCases)(catalog);
const working=process.argv.includes('--working-catalog');
const lexicons=working || process.argv.includes('--lexicons');
const factSources=lexicons?declaredFactSources.filter(source=>source.entry!=='migration.dcs-enumeration-lexeme').concat({
  entry:'metadata.system-enumeration-index-source',
  yaml:readFileSync('rust/data/system-enumeration-lexemes.generated.yaml','utf8'),
}):declaredFactSources;
if(lexicons) {
  modules.push(catalog.get('metadata.system-enumeration-index-source'));
  const lookups=lexiconLookupCases(catalog);
  modules.push(...lookups.modules);allCases.push(...lookups.cases);
}
if(working) {
  allCases.splice(0,allCases.length,...workingAppearanceCases(allCases));
  for(const source of factSources)if(source.entry==='probe.style-item-type-facts') {
    const ownerName=source.xml.match(/<Name>([^<]+)<\/Name>/)?.[1];
    if(!ownerName)throw new Error('Missing immutable style source name');
    source.entry='metadata.style-item-type-facts';source.inputs={ownerName};
  }
}
const entryArgument=process.argv.indexOf('--entry');
const entry=entryArgument<0?undefined:process.argv[entryArgument+1];
if(entryArgument>=0 && (!entry || entry.startsWith('--')))throw new Error('--entry requires a declaration ID');
const cases=entry?allCases.filter(item=>item.entry===entry):allCases;
if(!cases.length)throw new Error(`No cases for ${entry}`);
const sources=[...modules,...dependencyFiles(modules,catalog)];
const files=Object.fromEntries(sources.map(module=>[`${module.id}.yaml`,yaml.dump(module,{noRefs:true})]));
// Compile each placement separately: adding a boundary must not multiply all
// nested record bodies in one rustc process. No cases are skipped by default.
const groups=[...new Set(cases.map(item=>item.entry))].map(id=>cases.filter(item=>item.entry===id));
let passed=0;
for(const group of groups) {
  const paths=writeFocused(resolve(collection?'rust/target/appearance-collection-proposal':'rust/target/appearance-string-proposal'),files,{cases:group,factSources});
  const result=spawnSync('cargo',['run','--offline','--locked','--manifest-path','../tools/rules-migration/runtime/Cargo.toml',
    '--target-dir','target/migration-contracts','-j','1',...(working?['--features','working-catalog']:[]),'--',paths.cases],{
    cwd:resolve('rust'),stdio:'inherit',env:{...process.env,RUSTUP_TOOLCHAIN:'1.98.1',
      NKDK_MIGRATION_CATALOG:paths.catalog,NKDK_MIGRATION_EXPORTS:runtimeExports(group,factSources).join(','),
      CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0',CARGO_PROFILE_TEST_DEBUG:'0'},
  });
  if(result.error)throw result.error;
  if(result.status!==0){process.exitCode=result.status??1;break;}
  passed+=group.length;
}
if(passed===cases.length)console.log(`Passed all ${passed} contracts across ${groups.length} isolated placements`);
