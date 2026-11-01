import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runtimeExportsFromCaseFile} from './runtime-exports.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const generated=spawnSync(process.execPath,['tools/rules-migration/src/ready-cli.mjs'],{cwd:root,stdio:'inherit'});
if(generated.status!==0)process.exit(generated.status??1);
const result=spawnSync('cargo',['run','--offline','--locked','--manifest-path','../tools/rules-migration/runtime/Cargo.toml','--target-dir','target/migration-contracts','-j','1','--','../tests/migration/ready-attachment-cases.json'],{
 cwd:root+'rust',stdio:'inherit',env:{...process.env,NKDK_MIGRATION_CATALOG:root+'tests/migration/ready-attachments',
   NKDK_MIGRATION_EXPORTS:runtimeExportsFromCaseFile(root+'tests/migration/ready-attachment-cases.json'),
   CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0',CARGO_PROFILE_TEST_DEBUG:'0'}});
if(result.status!==0)process.exit(result.status??1);
if(process.argv.includes('--owners')) {
  // Keep workspace feature resolution identical to the full test run.
  // Select the integration targets together instead of rebuilding per package.
  const owners=spawnSync('cargo',['test','--offline','--locked','--manifest-path','Cargo.toml','--workspace','--test','path_lexicons','--test','resources','-j','1'],{
    cwd:root+'rust',stdio:'inherit',env:{...process.env,CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0',CARGO_PROFILE_TEST_DEBUG:'0'}});
  if(owners.error)throw owners.error;
  process.exit(owners.status??1);
}
