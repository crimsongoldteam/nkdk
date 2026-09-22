import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {candidateCatalog,dependencyFiles,yaml} from './candidate-catalog.mjs';
import {documentAttributeOperation} from './document-attributes-operation.mjs';
import {enumValueCases} from './enum-value-cases.mjs';
import {writeFocused} from './focused-output.mjs';

export function selectExecutableFamily(families,args) {
  const actual=args[0]==='--'?args.slice(1):args;
  if(actual.length!==2 || actual[0]!=='--family')throw new Error('Usage: test:migration-family --family <id>');
  const selected=families.find(family=>family.id===actual[1]);
  if(!selected || !selected.role.startsWith('accept-'))throw new Error(`Family is not executable: ${actual[1]}`);
  return selected.id;
}

function run() {
  const root=fileURLToPath(new URL('../../../',import.meta.url));
  process.chdir(root);
  const family=selectExecutableFamily(JSON.parse(readFileSync('tests/migration/unified-families.json','utf8')),process.argv.slice(2));
  const generator=family==='enum-values'?enumValueCases:documentAttributeOperation;
  const {catalog}=candidateCatalog();
  const {modules,cases,factSources}=generator(catalog);
  const declarations=[...modules,...dependencyFiles(modules,catalog)];
  const files=Object.fromEntries(declarations.map(module=>[`${module.id}.yaml`,yaml.dump(module,{noRefs:true})]));
  const paths=writeFocused(join(root,'rust/target/migration-family',family),files,{cases,factSources});
  console.log(`${family}: ${cases.length} cases, ${declarations.length} declarations`);
  const result=spawnSync('cargo',['run','--offline','--locked','--manifest-path','../tools/rules-migration/runtime/Cargo.toml',
    '--target-dir','target/migration-contracts','-j','1','--',paths.cases],{
    cwd:join(root,'rust'),stdio:'inherit',env:{...process.env,NKDK_MIGRATION_CATALOG:paths.catalog,
      CARGO_BUILD_JOBS:'1',CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0',CARGO_PROFILE_TEST_DEBUG:'0'},
  });
  if(result.error)throw result.error;
  process.exitCode=result.status??1;
}

if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1])run();
