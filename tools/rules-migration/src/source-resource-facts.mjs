import {readFileSync,writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadSources} from './source-snapshot.mjs';
import {stateCapabilitiesFor} from './state-contributions.mjs';

// Resource paths are registration data, not handwritten conversion callbacks.
export function sourceResourceFacts(source,{blockers}={}) {
 const capabilities=stateCapabilitiesFor(source);
 const properties=source.properties.filter(row=>capabilities[row.name]?.representation==='section' && Object.hasOwn(row.parameters??{},'nkdkPath'));
 if(!properties.length)return [];
 const extraction=JSON.parse(readFileSync(new URL('../../../tests/migration/rules-extraction.json',import.meta.url)));
 const registered=extraction.entries.find(row=>row.symbol===source.symbol&&row.path===source.path);
 const paths=properties.flatMap(property=>{
  if(!isDeepStrictEqual(property,registered?.properties.find(row=>row.name===property.name)))
   throw new Error('Unreviewed external resource registration: '+property.name);
  const paths={};
  for(const key of ['xmlPath','nkdkPath']) {
   const value=property.parameters?.[key];
   if(typeof value!=='string' || !value || value.split('/').some(part=>
    !part || ['.','..'].includes(part) || /[\\\0:]/.test(part))) {
    if(!blockers)throw new Error('Unresolved external resource path: '+property.name+'.'+key);
    blockers.push({properties:[property.name],reason:'unresolved-resource-path',parameter:key});
    return [];
   }
   paths[key]=value.split('/');
  }
  return [{name:property.name,xml:paths.xmlPath,yaml:paths.nkdkPath}];
 });
 if(!paths.length)return [];
 return [{entry:'migration.resource-presence-source',inputs:{},factDirections:[],
  newOwner:{template:{files:[]}},resourcePresence:{field:'files',paths}}];
}

// File-only source rules compose the accepted zero-field resource declaration.
// Paths share the reviewed discovery registration; no XML/YAML scalar is added.
export function sourceResourceAttachments(source,id,catalog,{claimed=[]}={}) {
 const selected=source.properties.filter(row=>['ExternalFile','Template'].includes(row.type) && !claimed.includes(row.name));
 if(!selected.length)return {attachments:[],blockers:[]};
 const valid=[],blockers=[];
 for(const property of selected) {
  const p=property.parameters;
  const fileOnly=property.type==='Template';
  const allowed=new Set(['type','xmlPath','nkdkPath',...(fileOnly?['toXML','fromXML']:['syncExternalOnly','toYAML','fromYAML'])]);
  if((fileOnly ? p.toXML!==false || p.fromXML!==false :
    p.syncExternalOnly!==true || p.toYAML!==false || p.fromYAML!==false) ||
   Object.keys(p).some(key=>!allowed.has(key))) {
   blockers.push({properties:[property.name],reason:'external-file-contract-unreviewed'});continue;
  }
  valid.push(property);
 }
 const sources=sourceResourceFacts({...source,properties:valid},{blockers});
 const paths=sources.flatMap(profile=>profile.resourcePresence.paths);
 if(!paths.length)return {attachments:[],blockers};
 if(catalog.get('common.external-file')?.kind!=='fragment')
  throw new Error('Missing accepted external file fragment');
 const module={format:'nkdk-declarations/1',kind:'fragment',id:id+'.external-files',
  imports:{file:'common.external-file'},inputs:{},
  value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}},
  compose:paths.map(path=>({use:'file',bind:{
   sourcePath:{sequence:path.xml.map(literal=>({literal}))},
   targetPath:{sequence:path.yaml.map(literal=>({literal}))},
  }})),
 };
 return {attachments:[{alias:'externalFiles',properties:paths.map(path=>path.name),module}],blockers};
}

// Opt-in content facts keep the same reviewed paths and bind to identity facts,
// never to a directory name. The caller supplies its explicit shared byte budget.
export function sourceResourceFingerprints(source,{identitySource,maxBytes,blockers}={}) {
 if(typeof identitySource!=='string' || !identitySource.trim())
  throw new Error('Resource fingerprints require an identity source');
 if(!Number.isSafeInteger(maxBytes) || maxBytes<0)
  throw new Error('Resource fingerprints require a bounded fingerprint budget');
 return sourceResourceFacts(source,{blockers}).map(profile=>({...profile,
  entry:'migration.resource-fingerprint-source',
  inputs:{component:'component',owner:{snapshot:{entry:identitySource,field:'uuid'}}},
  factDirections:['xml-to-yaml','yaml-to-xml'],
  resourcePresence:{...profile.resourcePresence,fingerprint:{maxBytes}},
 }));
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 loadSources(extraction.sourceHashes);
 const owners=[],blockers=[];
 for(const source of extraction.entries) {
  const localBlockers=[];
  const sources=sourceResourceFacts(source,{blockers:localBlockers});
  if(sources.length)owners.push({symbol:source.symbol,path:source.path,sources});
  if(localBlockers.length)blockers.push({symbol:source.symbol,path:source.path,properties:localBlockers});
 }
 const path='tests/migration/resource-facts-profiles.json',text=JSON.stringify({version:1,owners,blockers},null,2)+'\n';
 if(process.argv.includes('--check')) {
  if(readFileSync(path,'utf8')!==text)throw new Error('Stale resource fact profiles');
 } else writeFileSync(path,text);
 console.log(owners.length+' resource owners; '+owners.reduce((sum,row)=>sum+row.sources[0].resourcePresence.paths.length,0)+' paired paths; '+blockers.length+' blocked owners');
}
