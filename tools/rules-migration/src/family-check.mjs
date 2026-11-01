import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {candidateCatalog,dependencyFiles,yaml} from './candidate-catalog.mjs';
import {documentAttributeOperation} from './document-attributes-operation.mjs';
import {tabularSectionFamilyOperation} from './tabular-section-family-operation.mjs';
import {settingsParameterCases} from './settings-parameter-cases.mjs';
import {appearanceFieldsCases} from './appearance-fields-cases.mjs';
import {dcsParameterCase} from './dcs-parameter-case.mjs';
import {dcsMetadataValueCases} from './dcs-metadata-value-cases.mjs';
import {dcsMetadataTypedValueCases} from './dcs-metadata-typed-value-cases.mjs';
import {conditionalAppearanceCases} from './conditional-appearance-cases.mjs';
import {runSharedContracts} from './shared-family-check.mjs';
import {filterTreeCases} from './filter-tree-cases.mjs';
import {filterComparisonCases} from './filter-comparison-cases.mjs';
import {dataSetFieldCases} from './data-set-field-cases.mjs';
import {calculatedFieldsCases} from './calculated-fields-cases.mjs';
import {dynamicListSettingsCases} from './dynamic-list-settings-cases.mjs';
import {formParametersCases} from './form-parameters-cases.mjs';
import {scalarFallbackCases} from './scalar-fallback-cases.mjs';
import {groupedRecordCases} from './grouped-record-cases.mjs';
import {elementIdentityCases} from './element-identity-cases.mjs';
import {elementAssemblyCases} from './element-assembly-cases.mjs';
import {internalInfoCases} from './internal-info-cases.mjs';
import {choiceFormCases} from './choice-form-cases.mjs';
import {enumValueCases} from './enum-value-cases.mjs';
import {inputByStringOperation} from './input-by-string-operation.mjs';
import {numericOwnerOperation} from './numeric-owner-operation.mjs';
import {providedIndexes,selectContracts} from './focused-catalog.mjs';
import {writeFocused} from './focused-output.mjs';
import {formattedRecordCases} from './formatted-record-cases.mjs';
import {recordDefaultCases} from './record-default-cases.mjs';
import {runtimeExports} from './runtime-exports.mjs';
export {runtimeExports} from './runtime-exports.mjs';

export function selectExecutableFamily(families,args) {
  const actual=args[0]==='--'?args.slice(1):args;
  if((actual.length!==2 && actual.length!==4) || actual[0]!=='--family' ||
    (actual.length===4 && (actual[2]!=='--case' || !actual[3])))
    throw new Error('Usage: test:migration-family --family <id> [--case <id>]');
  const selected=families.find(family=>family.id===actual[1]);
  if(!selected || !selected.role.startsWith('accept-'))throw new Error(`Family is not executable: ${actual[1]}`);
  return selected.id;
}

export function includeIndexTypes(modules,catalog,providerIds) {
  const result=[...modules];
  for(;;) {
    const declarations=[...result,...dependencyFiles(result,catalog)];
    const provided=new Set(declarations.flatMap(module=>providedIndexes(catalog,module.id)));
    const required=new Set(declarations.flatMap(module=>Object.values(module.inputs??{})
      .map(input=>input.index).filter(Boolean)));
    const missing=[...required].filter(index=>!provided.has(index));
    if(!missing.length)return result;
    const provider=providerIds.map(id=>catalog.get(id)).find(module=>module &&
      missing.some(index=>providedIndexes(catalog,module.id).includes(index)) &&
      !result.some(item=>item.id===module.id));
    if(!provider)throw new Error(`Missing index type provider: ${missing.join(', ')}`);
    result.push(provider);
  }
}

export function generateExecutableFamily(family,catalog) {
  const generator={
    'enum-values':enumValueCases,
    'document-attributes':documentAttributeOperation,
    'tabular-sections':tabularSectionFamilyOperation,
    'internal-info':internalInfoCases,
    'choice-form':choiceFormCases,
    'input-by-string':inputByStringOperation,
    'numeric-owners':numericOwnerOperation,
    'form-parameters':formParametersCases,
    'scalar-fallbacks':scalarFallbackCases,
    'dynamic-list-settings':dynamicListSettingsCases,
    'dynamic-list-parameters':dcsParameterCase,
    'dcs-metadata-values':dcsMetadataValueCases,
    'dcs-metadata-typed-values':dcsMetadataTypedValueCases,
    'calculated-fields':calculatedFieldsCases,
    'data-set-fields':dataSetFieldCases,
    'filter-comparisons':filterComparisonCases,
    'filter-trees':filterTreeCases,
    'conditional-appearance':conditionalAppearanceCases,
    'appearance-field-profiles':appearanceFieldsCases,
    'settings-parameter-values':settingsParameterCases,
    'element-identity':elementIdentityCases,
    'element-assemblies':elementAssemblyCases,
    'formatted-records':formattedRecordCases,
    'record-defaults':recordDefaultCases,
    'grouped-records':groupedRecordCases,
  }[family];
  if(!generator)throw new Error(`Family has no generator: ${family}`);
  return generator(catalog);
}

function run() {
  const root=fileURLToPath(new URL('../../../',import.meta.url));
  process.chdir(root);
  const families=JSON.parse(readFileSync('tests/migration/unified-families.json','utf8'));
  const args=process.argv.slice(2);
  const family=selectExecutableFamily(families,args);
  const caseId=args[0]==='--'?args[4]:args[3];
  const {catalog}=candidateCatalog(family==='tabular-sections'?{
    excludePaths:['rust/declarations/candidates/tabular-sections.generated.yaml'],
  }:{});
  let {modules,cases,factSources}=generateExecutableFamily(family,catalog);
  if(caseId) {
    const combined=new Map([...catalog,...modules.map(module=>[module.id,module])]);
    const selected=selectContracts({cases,factSources},combined,[caseId]);
    modules=selected.modules;cases=selected.manifest.cases;factSources=selected.manifest.factSources;
    modules=includeIndexTypes(modules,combined,families.find(item=>item.id===family).compilerRoots??[]);
  }
  for(const id of caseId?[]:families.find(item=>item.id===family).compilerRoots??[]) {
    const root=catalog.get(id);
    if(!root)throw new Error(`Missing family compiler root: ${id}`);
    if(!modules.some(module=>module.id===id))modules.push(root);
  }
  for(const source of factSources)if(!modules.some(module=>module.id===source.entry)) {
    const provider=catalog.get(source.entry);
    if(!provider)throw new Error(`Missing family fact source: ${source.entry}`);
    modules.push(provider);
  }
  const declarations=[...modules,...dependencyFiles(modules,catalog)];
  const shared=families.find(item=>item.id===family).backend==='shared-aot';
  if(!shared && !caseId && cases.length>1) {
    console.log(`${family}: ${cases.length} cases, ${declarations.length} declarations; checking cases separately to bound rustc memory`);
    for(const item of cases) {
      const result=spawnSync(process.execPath,[fileURLToPath(import.meta.url),'--family',family,'--case',item.id],{
        cwd:root,stdio:'inherit',env:process.env,
      });
      if(result.error)throw result.error;
      if(result.status!==0) {process.exitCode=result.status??1;return;}
    }
    console.log(`Passed ${cases.length} candidate contracts`);
    return;
  }
  const files=Object.fromEntries(declarations.map(module=>[`${module.id}.yaml`,yaml.dump(module,{noRefs:true})]));
  const exportNames=runtimeExports(cases,factSources);
  const exports=exportNames.join(',');
  const catalogKey=createHash('sha256')
    .update(JSON.stringify({files:Object.entries(files).sort(([a],[b])=>a.localeCompare(b)),exports}))
    .digest('hex').slice(0,32);
  const familyPath=join(root,'rust/target/migration-family',family);
  const paths=writeFocused(join(familyPath,...(caseId?[caseId]:[])),files,{cases,factSources},
    {catalogDirectory:join(familyPath,'catalogs',catalogKey)});
  console.log(`${family}: ${cases.length} cases, ${declarations.length} declarations`);
  if(shared) {
    process.exitCode=runSharedContracts(root,join(familyPath,...(caseId?[caseId]:[])),paths,exportNames);
    return;
  }
  const result=spawnSync('cargo',['run','--offline','--locked','--manifest-path','../tools/rules-migration/runtime/Cargo.toml',
    '--target-dir','target/migration-contracts','-j','1','--',paths.cases],{
    cwd:join(root,'rust'),stdio:'inherit',env:{...process.env,NKDK_MIGRATION_CATALOG:paths.catalog,
      NKDK_MIGRATION_EXPORTS:exports,
      CARGO_BUILD_JOBS:'1',CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0',CARGO_PROFILE_TEST_DEBUG:'0'},
  });
  if(result.error)throw result.error;
  process.exitCode=result.status??1;
}

if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1])run();
