import { spawnSync } from 'node:child_process';
const root=new URL('../../../',import.meta.url);
function run(command,args,cwd=root,env=process.env) {
 const result=spawnSync(command,args,{cwd,env,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
run(process.execPath,['tools/rules-migration/src/contracts-cli.mjs']);
run('cargo',['run','--offline','--locked','--manifest-path','../tools/rules-migration/runtime/Cargo.toml','--target-dir','target/migration-contracts','-j','1','--','../tests/migration/rules-contract-cases.json'],new URL('rust/',root),{...process.env,CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0'});
