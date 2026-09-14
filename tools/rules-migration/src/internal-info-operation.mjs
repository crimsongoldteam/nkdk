import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {internalInfoAttachment} from './internal-info-attachment.mjs';
import {loadSources} from './source-snapshot.mjs';

const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
loadSources(extraction.sourceHashes);
const owner=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
const result=internalInfoAttachment(owner);
if(result.status!=='candidate')throw new Error(result.reason);
result.module.id='fragment.enumeration-internal-info';
const path='rust/declarations/fragments/enumeration-internal-info.generated.yaml';
const content='# Generated from rules.ts by tools/rules-migration/src/internal-info-operation.mjs\n'+yaml.dump(result.module,{noRefs:true});
if(process.argv.includes('--check')) {
  if(readFileSync(path,'utf8')!==content)throw new Error('Stale generated internal-info attachment');
} else if(!existsSync(path) || readFileSync(path,'utf8')!==content)writeFileSync(path,content);
