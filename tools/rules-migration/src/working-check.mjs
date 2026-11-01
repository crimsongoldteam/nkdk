import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2);
if(args.length!==2 || args[0]!=='--manifest')throw new Error('Expected --manifest <path>');
const root=fileURLToPath(new URL('../../../',import.meta.url));
const manifest=resolve(root,args[1]);
const result=spawnSync('cargo',['run','--offline','--locked','--manifest-path','../tools/rules-migration/runtime/Cargo.toml',
 '--features','working-catalog','--target-dir',resolve(root,process.env.CARGO_TARGET_DIR??'rust/target'),'-j','1','--',manifest],{
 cwd:resolve(root,'rust'),stdio:'inherit',env:{...process.env,
 CARGO_BUILD_JOBS:'1',CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0'},
});
if(result.error)throw result.error;
process.exitCode=result.status??1;
