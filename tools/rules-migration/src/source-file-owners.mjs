import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {yaml} from './candidate-catalog.mjs';
import {fileEnvelopeOperation} from './file-envelope-operation.mjs';
import {attachExternalFileOwner} from './file-root-envelope.mjs';
import {renameOwnerFields} from './owner-fragment.mjs';
import {sourceOwnerFieldOrder,canonicalOwnerYamlOrder} from './source-owner-assembly.mjs';
import {ownerIndexRequirements} from './owner-index-requirements.mjs';

// Migration profiles select already accepted file declarations. This adapter
// only assembles their context and preserves the original owner's contracts.
export function sourceFileOwners(assembly,source,catalog,{claimed=[],profiles,component}={}) {
 const extraction=JSON.parse(readFileSync(new URL('../../../tests/migration/rules-extraction.json',import.meta.url)));
 const registered=extraction.entries.find(row=>row.symbol===source.symbol&&row.path===source.path);
 profiles??=JSON.parse(readFileSync(new URL('../profiles/source-file-owners.json',import.meta.url)))
  .map(path=>yaml.load(readFileSync(new URL('../profiles/'+path,import.meta.url),'utf8')));
 const selected=profiles.filter(profile=>profile.attachment?.source.symbol===source.symbol&&
  profile.attachment.source.path===source.path&& !claimed.includes(profile.attachment.property)&&
  source.properties.some(row=>row.name===profile.attachment.property));
 const seen=new Set();
 for(const profile of selected) {
  const property=profile.attachment.property;
  if(seen.has(property))throw new Error('Ambiguous source file owner profile: '+property);
  seen.add(property);
  const original=source.properties.find(row=>row.name===property);
  if(!isDeepStrictEqual(original,registered?.properties.find(row=>row.name===property))) {
   assembly.coverage.blockers.push({properties:[property],reason:'unreviewed-source-file-owner'});continue;
  }
  const file=fileEnvelopeOperation(profile,extraction,catalog);
  const fields=file.attachment.value.fields;
  if(fields.length!==1)throw new Error('Source file attachment requires one collection field');
  const attachment=renameOwnerFields(file.attachment,{[fields[0].name]:property});
  attachment.id=assembly.owner.id+'.'+property;
  const local=new Map([...catalog,...assembly.modules.map(row=>[row.id,row]),[attachment.id,attachment]]);
  const host=structuredClone(profile.attachment.host);
  if(component)host.identity.component=component;
  const owner=attachExternalFileOwner(assembly.owner,file.owner,attachment,source,host,local);
  owner.xmlOrder=sourceOwnerFieldOrder(owner,source,local);
  owner.yamlOrder=canonicalOwnerYamlOrder(owner,local);
  assembly.indexRequirements=ownerIndexRequirements(owner,local,{
   [owner.id]:assembly.indexRequirements?.bindings??{},
  });
  assembly.modules=assembly.modules.filter(row=>row.id!==owner.id);
  assembly.modules.push(attachment,owner);assembly.owner=owner;
  assembly.coverage.pending=assembly.coverage.pending.filter(row=>row.name!==property);
  const assembled=new Set([...assembly.coverage.assembled,property]);
  assembly.coverage.assembled=source.properties.filter(row=>assembled.has(row.name)).map(row=>row.name);
  assembly.coverage.blockers.push({properties:[property],reason:'file-extension-profile-required'});
  assembly.coverage.complete=false;
 }
 return assembly;
}
