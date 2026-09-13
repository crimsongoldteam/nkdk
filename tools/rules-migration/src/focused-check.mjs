import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {yaml} from './candidate-catalog.mjs';
import {selectContracts} from './focused-catalog.mjs';
import {writeFocused} from './focused-output.mjs';
import {loadSources} from './source-snapshot.mjs';

const started=performance.now();
const root=fileURLToPath(new URL('../../../',import.meta.url));
process.chdir(root);
const args=process.argv.slice(2);
if(args.length!==2 || args[0]!=='--batch')throw new Error('Usage: migration:check:focused --batch <batch.json>');
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const batch=read(args[1]);
if(typeof batch.id!=='string' || !/^[a-z0-9-]+$/.test(batch.id))throw new Error('Unsafe batch identifier');
const original=read('tests/migration/rules-contract-cases.json');
const candidates=read('tests/migration/rules-candidates/manifest.json');
loadSources(candidates.sourceHashes);
for(const item of [...candidates.declarationHashes,...original.sources]) {
  if(createHash('sha256').update(readFileSync(item.path)).digest('hex')!==item.sha256)throw new Error(`Stale source: ${item.path}; refresh migration:candidates and migration:contracts`);
}
const generated=read('tests/migration/rules-contract-catalog/manifest.json').generatedFiles;
const modules=Object.values(generated).map(text=>yaml.load(text));
const catalog=new Map(modules.map(m=>[m.id,m]));
if(catalog.size!==modules.length)throw new Error('Duplicate declaration in contract catalog');
const selected=selectContracts(original,catalog,batch.cases);
if(batch.expectedPropertyCount!==undefined && selected.propertyCount!==batch.expectedPropertyCount)throw new Error(`Changed batch property count: ${selected.propertyCount}`);
const files={};
for(const module of selected.modules) {
  const name=module.id+'.yaml', contents=generated[name];
  if(contents===undefined || readFileSync('tests/migration/rules-contract-catalog/'+name,'utf8')!==contents)throw new Error(`Modified or missing contract: ${name}`);
  files[name]=contents;
}
const directory=resolve('rust/target/migration-focused',batch.id);
const paths=writeFocused(directory,files,selected.manifest);
const env={...process.env,NKDK_MIGRATION_CATALOG:paths.catalog,CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0',CARGO_PROFILE_TEST_DEBUG:'0'};
const common=['--offline','--locked','--manifest-path','../tools/rules-migration/runtime/Cargo.toml','--target-dir','target/migration-contracts','-j','1'];
const result={preparationSeconds:(performance.now()-started)/1000,batch:batch.id,cases:selected.manifest.cases.length,properties:selected.propertyCount,declarations:selected.modules.length,fullContractDeclarations:modules.length,newlyConnectedProperties:0,steps:[]};
console.log(`${result.properties} properties; ${result.cases} cases; ${result.declarations}/${result.fullContractDeclarations} contract declarations`);
for(const [step,command] of [['run',['run',...common,'--',paths.cases]],['clippy',['clippy',...common,'--all-targets','--','-D','warnings']]]) {
 const start=performance.now();
 const execution=spawnSync('cargo',command,{cwd:join(root,'rust'),env,encoding:'utf8',maxBuffer:64*1024*1024});
 writeFileSync(join(directory,step+'.log'),(execution.stdout??'')+(execution.stderr??''));
 const seconds=(performance.now()-start)/1000;
 result.steps.push({step,seconds,exitCode:execution.status});
 result.totalSeconds=(performance.now()-started)/1000;
 writeFileSync(join(directory,'result.json'),JSON.stringify(result,null,2)+'\n');
 console.log(`${step}: ${seconds.toFixed(2)} s, exit ${execution.status}; ${join(directory,step+'.log')}`);
 if(execution.error || execution.status!==0)throw execution.error??new Error(`Focused ${step} failed; see log`);
}
