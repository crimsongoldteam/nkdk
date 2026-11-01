import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {elementLinks} from './element-links.mjs';
import {loadSources} from './source-snapshot.mjs';

const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
const graph=elementLinks(loadSources(extraction.sourceHashes),extraction.entries);
const result={version:1,sourceSnapshotHash:createHash('sha256')
  .update(JSON.stringify(extraction.sourceHashes)).digest('hex'),...graph};
const path='tests/migration/form-element-links.json',text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')) {
  if(readFileSync(path,'utf8')!==text)throw new Error('Stale form element registration graph');
} else writeFileSync(path,text);
console.log(JSON.stringify({registrations:graph.registrations.length,unresolved:graph.unresolved.length,
  edges:graph.edges.length,linked:graph.edges.filter(edge=>edge.status==='linked-structure').length,
  constantOutputs:graph.registrations.filter(row=>Object.hasOwn(row,'constantOutput')).length}));
