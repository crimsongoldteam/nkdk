import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {yaml,candidateCatalog} from './candidate-catalog.mjs';
import {bindFileRootEnvelope,bindExternalFileAttachment,bindExternalFileOwner,attachExternalFileOwner} from './file-root-envelope.mjs';
import {loadSources} from './source-snapshot.mjs';

export function fileEnvelopeOperation(profile,extraction,catalog) {
 if(profile?.format!=='nkdk-file-envelope/1')throw new Error('Unsupported file envelope profile');
 const matches=extraction.entries.filter(row=>row.path===profile.source?.path && row.symbol===profile.source?.symbol);
 if(matches.length!==1)throw new Error('Ambiguous source file envelope registration');
 const result=bindFileRootEnvelope(profile.value,profile.owner,matches[0],profile.context);
 if(profile.attachment){
  const attachment=profile.attachment;
  const owners=extraction.entries.filter(row=>row.path===attachment.source?.path && row.symbol===attachment.source?.symbol);
  const properties=owners.length===1?owners[0].properties.filter(row=>row.name===attachment.property):[];
  if(properties.length!==1)throw new Error('Ambiguous external file attachment registration');
  result.attachment=bindExternalFileAttachment(result.owner,properties[0],attachment.id);
  if(attachment.host)result.host=bindExternalFileOwner(result.owner,result.attachment,owners[0],attachment.host);
  if(attachment.target){
   catalog??=candidateCatalog().catalog;
   const target=catalog.get(attachment.target.declaration);
   if(!target || !attachment.host || typeof attachment.target.id!=='string' ||
    !attachment.target.id || attachment.target.id===target.id)throw new Error('Missing or conflicting external file owner target or context');
   result.connected=attachExternalFileOwner(target,result.owner,result.attachment,owners[0],attachment.host,catalog);
   result.connected.id=attachment.target.id;
  }
 }
 return result;
}

if(process.argv[1]?.endsWith('file-envelope-operation.mjs')) {
 const path=process.argv[2];
 if(!path || path.startsWith('--'))throw new Error('Expected file envelope profile path');
 const profile=yaml.load(readFileSync(path,'utf8'));
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 loadSources(extraction.sourceHashes);
 const result=fileEnvelopeOperation(profile,extraction);
 const outputs=Object.entries(result).map(([key,module])=>{
  const output=profile.outputs?.[key];
  if(typeof output!=='string' || !output)throw new Error('Missing file envelope output');
  const sources=['attachment','host','connected'].includes(key)?[profile.source.path,profile.attachment.source.path]:[profile.source.path];
  const content='# Generated from '+sources.join(' and ')+' by file-envelope-operation.mjs\n'+yaml.dump(module,{noRefs:true});
  let previous;
  try {previous=readFileSync(output,'utf8');}
  catch(error) {if(error.code!=='ENOENT')throw error;}
  if(process.argv.includes('--check') && previous!==content)
   throw new Error('Stale file envelope declaration: '+output);
  return {output,content,previous};
 });
 if(new Set(outputs.map(({output})=>resolve(output))).size!==outputs.length)
  throw new Error('Duplicate file envelope output');
 if(!process.argv.includes('--check'))
  for(const {output,content,previous} of outputs)if(previous!==content)writeFileSync(output,content);
}
