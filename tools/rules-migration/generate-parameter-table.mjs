// Static migration step; the compiled converter never reads rules.ts.
import {readFileSync,writeFileSync} from 'node:fs';
import {candidateCatalog,yaml} from './src/candidate-catalog.mjs';
import {declaredSettingsParameterTable} from './src/dcs-value-profile.mjs';
import {loadSources} from './src/source-snapshot.mjs';

const arguments_=process.argv.slice(2);
const check=arguments_.at(-1)==='--check';
if(check)arguments_.pop();
const [symbol,id,item,path]=arguments_;
if(arguments_.length!==4 || !symbol || !id?.startsWith('common.') || !item?.startsWith('common.') ||
   !/^rust\/declarations\/common\/[a-z0-9-]+\.generated\.yaml$/.test(path??''))
  throw new Error('Usage: generate-parameter-table <source-symbol> <common-id> <item-id> <rust/declarations/common/name.generated.yaml> [--check]');
const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
loadSources(extraction.sourceHashes);
const {catalog}=candidateCatalog();
if(!catalog.has(item))throw new Error(`Unknown item declaration: ${item}`);
const selected=declaredSettingsParameterTable(extraction.entries.find(row=>row.symbol===symbol),catalog);
if(!selected)throw new Error(`Incomplete or unsupported static parameter table: ${symbol}`);
const declaration={...selected.declaration,id,imports:{item}};
const bytes=`# Generated from ${symbol}; checked against the static source table by emit.test.mjs.\n`+
  yaml.dump(declaration,{noRefs:true,lineWidth:140});
if(check) {
  if(readFileSync(path,'utf8')!==bytes)throw new Error(`Stale generated parameter table: ${path}`);
} else writeFileSync(path,bytes);
