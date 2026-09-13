import {readFileSync,writeFileSync} from 'node:fs';
import {collectionLinks} from './collection-links.mjs';
import {loadSources} from './source-snapshot.mjs';
const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
const graph=collectionLinks(loadSources(extraction.sourceHashes),extraction.entries);
const result={version:1,sourceHashes:extraction.sourceHashes,...graph};
writeFileSync('tests/migration/collection-links.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({registrations:graph.registrations.length,unresolved:graph.unresolved.length,edges:graph.edges.length,linked:graph.edges.filter(e=>e.status==='linked-structure').length}));
