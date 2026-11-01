import {isDeepStrictEqual} from 'node:util';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {candidateCatalog,yaml} from './candidate-catalog.mjs';
import {loadSources} from './source-snapshot.mjs';
import {recordOwnerOperation} from './record-owner-operation.mjs';
import {recordOwnerFileRoute} from './record-owner-file-route.mjs';

export function recordOwnerFileOperation(extraction,catalog,profile) {
 const source=extraction.entries.find(row=>row.symbol===profile.symbol);
 const assembly=recordOwnerOperation(extraction,catalog,profile);
 const operation=recordOwnerFileRoute(source,assembly,catalog,profile);
 // These gates describe absent wiring. The complete route supplies it; other
 // unresolved source contracts remain blockers, independently of test results.
 const blockers=assembly.coverage.blockers.filter(row=>
  !['owner-state-assembly-required','resource-state-fact-routing-required'].includes(row.reason));
 const readers=new Map(operation.factSources.map(module=>[module.id,module]));
 const modules=assembly.modules.map(module=>readers.get(module.id)??module);
 for(const module of operation.contextModules)if(!modules.some(row=>row.id===module.id))modules.push(module);
 for(const reader of operation.factSources)if(!modules.some(row=>row.id===reader.id))modules.push(reader);
 return {...assembly,...operation,modules,
  coverage:{...assembly.coverage,blockers,complete:blockers.length===0}};
}

const defaultDeclarations='rust/declarations/objects/record-file-owners.generated.yaml';

export function partitionFileDeclarations(operations,profiles,catalog) {
 const files=new Map(),seen=new Map();
 for(const [index,operation] of operations.entries()) {
  const path=profiles[index].declarationFile??defaultDeclarations;
  if(!files.has(path))files.set(path,[]);
  for(const module of operation.modules) {
   if(catalog.has(module.id))continue;
   const previous=seen.get(module.id);
   if(previous) {
    if(!isDeepStrictEqual(previous,module))throw new Error('Conflicting shared declaration: '+module.id);
   } else {
    seen.set(module.id,module);
    files.get(path).push(module);
   }
  }
 }
 return files;
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const profiles=yaml.load(readFileSync('tools/rules-migration/profiles/record-file-owners.yaml','utf8'));
 const declarations=[...new Set(profiles.map(profile=>profile.declarationFile??defaultDeclarations))];
 const routes='rust/operations/record-file-owners.routes.generated.yaml';
 const coverage='tests/migration/record-file-owner-coverage.json';
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 loadSources(extraction.sourceHashes);
 const {catalog}=candidateCatalog({excludePaths:declarations});
 const operations=profiles.map(profile=>recordOwnerFileOperation(extraction,catalog,profile));
 const files=partitionFileDeclarations(operations,profiles,catalog);
 const output=[
  ...[...files].map(([path,modules])=>[path,'# Generated complete file declarations from rules.ts\n'+
   yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:modules},{noRefs:true})]),
  [routes,yaml.dump({format:'nkdk-operation-routes/1',routes:operations.map(row=>row.route),
   factRoutes:operations.flatMap(row=>row.factRoutes)},{noRefs:true})],
  [coverage,JSON.stringify(operations.map((row,index)=>({symbol:profiles[index].symbol,
   ...row.coverage,entry:row.owner.id,indexRequirements:row.indexRequirements,
   factSources:row.factSources.map(source=>source.id),route:routes,
   verificationRequired:['full-file-fixtures','application-catalog']})),null,2)+'\n'],
 ];
 for(const [path,content] of output) {
  if(process.argv.includes('--check')) {
   if(!existsSync(path) || readFileSync(path,'utf8')!==content)
    throw new Error('Stale record file operation: '+path);
  } else if(!existsSync(path) || readFileSync(path,'utf8')!==content)writeFileSync(path,content);
 }
}
