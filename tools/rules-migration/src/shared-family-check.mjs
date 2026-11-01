import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {writeChanged} from './focused-output.mjs';
import {preparedRunnerManifest} from './shared-aot-runner.mjs';

// The ordinary contract runner is reused; only its compiled catalogue differs.
export function sharedFamilyRunner(directory,exports) {
  const output=join(directory,'aot');
  const runner=join(directory,'runner');
  return {output,runner,exportsText:exports.join('\n')+'\n',
    manifest:preparedRunnerManifest(runner,output)+'\n[profile.dev]\ndebug=0\nincremental=false\n'};
}

export function runSharedContracts(root,directory,paths,exports) {
  const prepared=sharedFamilyRunner(directory,exports);
  const target=join(root,'rust/target/migration-contracts');
  const exportsPath=join(directory,'exports.txt');
  writeChanged(exportsPath,prepared.exportsText);
  const env={...process.env,CARGO_TARGET_DIR:target,CARGO_BUILD_JOBS:'1'};
  const prepare=spawnSync(process.execPath,[join(root,'tools/rules-migration/src/shared-aot-cli.mjs'),
    '--catalog',paths.catalog,'--exports',exportsPath,'--output',prepared.output],{cwd:root,stdio:'inherit',env});
  if(prepare.error)throw prepare.error;
  if(prepare.status!==0)return prepare.status??1;
  mkdirSync(prepared.runner,{recursive:true});
  writeChanged(join(prepared.runner,'Cargo.toml'),prepared.manifest);
  const execute=spawnSync('cargo',['+1.98.1','run','--offline','--manifest-path',
    join(prepared.runner,'Cargo.toml'),'--target-dir',target,'-j1','--',paths.cases],{cwd:root,stdio:'inherit',env});
  if(execute.error)throw execute.error;
  return execute.status??1;
}
