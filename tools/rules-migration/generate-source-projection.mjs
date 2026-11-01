import {readFileSync,writeFileSync} from 'node:fs';
import {candidateCatalog,yaml} from './src/candidate-catalog.mjs';
import {loadSources} from './src/source-snapshot.mjs';
import {sourceProjection} from './src/source-projection.mjs';
const arguments_=process.argv.slice(2),check=arguments_.at(-1)==='--check';
if(check)arguments_.pop();
if(arguments_.length!==1)throw new Error('Usage: generate-source-projection <profile.json> [--check]');
const profile=JSON.parse(readFileSync(arguments_[0],'utf8'));
if(Object.keys(profile).some(key=>!['symbol','properties','id','output','namespaces','root'].includes(key)) ||
   !/^rust\/declarations\/(?:common|probes|objects)\/[a-z0-9-]+\.generated\.yaml$/.test(profile.output??''))
  throw new Error('Invalid source projection profile');
const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
loadSources(extraction.sourceHashes);
const {catalog}=candidateCatalog();
const result=sourceProjection(extraction.entries.find(row=>row.symbol===profile.symbol),catalog,profile);
const bytes=`# Generated projection of ${profile.symbol}; unselected properties remain outside its contract.\n`+
 yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:result.modules},{noRefs:true,lineWidth:140});
if(check) {if(readFileSync(profile.output,'utf8')!==bytes)throw new Error(`Stale source projection: ${profile.output}`);}
else writeFileSync(profile.output,bytes);
