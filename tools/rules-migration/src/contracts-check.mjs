import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {yaml} from './candidate-catalog.mjs';
import {partitionContracts} from './contract-shards.mjs';
import {writeFocused} from './focused-output.mjs';
import {runtimeExportsFromCaseFile} from './runtime-exports.mjs';

const root=fileURLToPath(new URL('../../../',import.meta.url));
function run(command,args,cwd=root,env=process.env) {
 const result=spawnSync(command,args,{cwd,env,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
run(process.execPath,['tools/rules-migration/src/contracts-cli.mjs']);
const manifest=JSON.parse(readFileSync(resolve(root,'tests/migration/rules-contract-cases.json'),'utf8'));
const generated=JSON.parse(readFileSync(resolve(root,'tests/migration/rules-contract-catalog/manifest.json'),'utf8')).generatedFiles;
const catalog=new Map(Object.values(generated).map(text=>{const module=yaml.load(text);return [module.id,module];}));
const shards=partitionContracts(manifest,catalog,100,185000,module=>Buffer.byteLength(generated[`${module.id}.yaml`]));
console.log(`Checking ${manifest.cases.length} contracts in ${shards.length} bounded Rust builds`);
for(const [index,shard] of shards.entries()) {
 const files=Object.fromEntries(shard.modules.map(module=>[`${module.id}.yaml`,generated[`${module.id}.yaml`]]));
 const paths=writeFocused(resolve(root,'rust/target/migration-contract-shards',String(index+1)),files,shard.manifest);
 console.log(`Shard ${index+1}/${shards.length}: ${shard.manifest.cases.length} cases, ${shard.modules.length} declarations, ${shard.modules.reduce((sum,module)=>sum+Buffer.byteLength(files[`${module.id}.yaml`]),0)} source bytes`);
 run('cargo',['run','--offline','--locked','--manifest-path','../tools/rules-migration/runtime/Cargo.toml','--target-dir','target/migration-contracts','-j','1','--',paths.cases],
   resolve(root,'rust'),{...process.env,NKDK_MIGRATION_CATALOG:paths.catalog,
     NKDK_MIGRATION_EXPORTS:runtimeExportsFromCaseFile(paths.cases),
     CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0'});
}
