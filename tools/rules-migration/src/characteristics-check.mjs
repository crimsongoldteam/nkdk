import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {candidateCatalog,dependencyFiles,yaml} from './candidate-catalog.mjs';
import {characteristicsCases} from './characteristics-cases.mjs';
import {writeFocused} from './focused-output.mjs';
import {runtimeExportsFromCaseFile} from './runtime-exports.mjs';

const {catalog}=candidateCatalog();
const {modules,cases}=characteristicsCases(catalog);
const all=[...modules,...dependencyFiles(modules,catalog)];
const files=Object.fromEntries(all.map(module=>[`${module.id}.yaml`,yaml.dump(module,{noRefs:true})]));
const paths=writeFocused(resolve('rust/target/characteristics-check'),files,{cases});
const result=spawnSync('cargo',['run','--offline','--locked','--manifest-path','../tools/rules-migration/runtime/Cargo.toml',
  '--target-dir','target/migration-contracts','-j','1','--',paths.cases],{
  cwd:join(process.cwd(),'rust'),stdio:'inherit',env:{...process.env,NKDK_MIGRATION_CATALOG:paths.catalog,
    NKDK_MIGRATION_EXPORTS:runtimeExportsFromCaseFile(paths.cases),
    CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0',CARGO_PROFILE_TEST_DEBUG:'0'}});
if(result.error)throw result.error;
process.exitCode=result.status??1;
