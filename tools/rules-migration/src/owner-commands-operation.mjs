import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {yaml} from './candidate-catalog.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {loadSources} from './source-snapshot.mjs';

const fragmentTemplate='rust/declarations/fragments/document-commands.yaml';
const probeTemplate='rust/declarations/probes/document-commands.yaml';

export function ownerCommandsFragment(source,id) {
 const fail=reason=>({status:'blocked',reason});
 const properties=source?.properties?.filter(property=>property.name==='commands')??[];
 if(properties.length!==1 || typeof id!=='string' || !id)return fail('commands-owner-required');
 const property=properties[0],p=property.parameters;
 if(property.status!=='static-parameters' || p?.type!=='MetadataCommands' ||
   p.ownerFactRole!=='commands' || p.xml!=='Command' ||
   JSON.stringify(p.xmlParents)!=='["ChildObjects"]' ||
   typeof p.yaml!=='string' || !p.yaml ||
   JSON.stringify(p.operationTarget)!==JSON.stringify({kind:'namedCollectionTarget',targetKind:'command',
    migrationSegment:'Команда',requiresMigration:false}) ||
   Object.keys(p).some(key=>!['type','ownerFactRole','yaml','xmlParents','xml','operationTarget'].includes(key)))
  return fail('commands-profile');
 let route;
 try{route=sourceOwnerXmlRoute(source)}catch{return fail('commands-root-required')}
 const module=yaml.load(readFileSync(fragmentTemplate,'utf8'));
 module.id=id;
 module.representations.xml.fields[0].path=[...route,'md:ChildObjects'];
 module.representations.yaml.fields[0].key=p.yaml;
 return {status:'candidate',module};
}

function main() {
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 loadSources(extraction.sourceHashes);
 const owner=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
 const result=ownerCommandsFragment(owner,'fragment.enumeration-commands');
 if(result.status!=='candidate')throw new Error(`Enumeration commands: ${result.reason}`);
 const probe=yaml.load(readFileSync(probeTemplate,'utf8'));
 probe.id='migration.enumeration-commands';
 probe.imports.commands=result.module.id;
 const path='rust/declarations/fragments/enumeration-commands.generated.yaml';
 const content='# Generated from rules.ts by tools/rules-migration/src/owner-commands-operation.mjs\n'+
  yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:[result.module,probe]},{noRefs:true});
 if(process.argv.includes('--check')) {
  if(readFileSync(path,'utf8')!==content)throw new Error(`Stale command declaration: ${path}`);
 }else if(!existsSync(path) || readFileSync(path,'utf8')!==content)writeFileSync(path,content);
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
