import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {internalInfoAttachment} from './internal-info-attachment.mjs';
import {loadSources} from './source-snapshot.mjs';
import {attachPropertyStates,propertyStateDeclarations} from './property-state-attachment.mjs';

const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
loadSources(extraction.sourceHashes);
for(const [symbol,id,path] of [
  ['MetadataEnumerationRules','fragment.enumeration-internal-info','rust/declarations/fragments/enumeration-internal-info.generated.yaml'],
  ['MetadataDefinedTypeRules','fragment.defined-type-internal-info','rust/declarations/fragments/defined-type-internal-info.generated.yaml'],
  ['MetadataDocumentJournalRules','fragment.journal-internal-info','rust/declarations/fragments/journal-internal-info.yaml'],
]) {
  const owner=extraction.entries.find(entry=>entry.symbol===symbol);
  if(!owner)throw new Error(`Missing source owner: ${symbol}`);
  const result=internalInfoAttachment(owner);
  if(result.status!=='candidate')throw new Error(`${symbol}: ${result.reason}`);
  result.module.id=id;
  let declaration=result.module;
  if(symbol==='MetadataEnumerationRules') {
    declaration={format:'nkdk-declarations/1',kind:'catalog',
      declarations:[...attachPropertyStates(result.module,owner,'enumeration'),result.module]};
  } else if(symbol==='MetadataDocumentJournalRules') {
    attachPropertyStates(result.module,owner,'journal');
  }
  const content='# Generated from rules.ts by tools/rules-migration/src/internal-info-operation.mjs\n'+yaml.dump(declaration,{noRefs:true});
  if(process.argv.includes('--check')) {
    if(readFileSync(path,'utf8')!==content)throw new Error(`Stale generated internal-info attachment: ${symbol}`);
  } else if(!existsSync(path) || readFileSync(path,'utf8')!==content)writeFileSync(path,content);
}
const journal=extraction.entries.find(entry=>entry.symbol==='MetadataDocumentJournalRules');
if(!journal)throw new Error('Missing document journal source');
const journalPath='rust/declarations/objects/journal-property-states.yaml';
const journalContent='# Generated from rules.ts by tools/rules-migration/src/internal-info-operation.mjs\n'+
  yaml.dump({format:'nkdk-declarations/1',kind:'catalog',
    declarations:propertyStateDeclarations(journal,'journal')},{noRefs:true});
if(process.argv.includes('--check')) {
  if(readFileSync(journalPath,'utf8')!==journalContent)
    throw new Error(`Stale generated journal PropertyState: ${journalPath}`);
} else if(!existsSync(journalPath) || readFileSync(journalPath,'utf8')!==journalContent) {
  writeFileSync(journalPath,journalContent);
}
