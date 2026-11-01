import {sourceResourceAttachments} from './source-resource-facts.mjs';
import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {sourceStandardAttributesFragment} from './standard-attributes-operation.mjs';
import {renameOwnerFields} from './owner-fragment.mjs';
import {readyAttachment} from './ready-attachment.mjs';
import {internalInfoAttachment} from './internal-info-attachment.mjs';
import {childNamesFragment} from './child-names-operation.mjs';
import {ownerCommandsFragment} from './owner-commands-operation.mjs';
import {sourceChildFileResources} from './source-child-file-resources.mjs';

const providers={
 internal:{typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids',
  thisNodes:'metadata.internal-this-nodes',containedIds:'metadata.internal-contained-ids'},
 commands:{roots:'metadata.roots',identities:'metadata.own-identities',baseIds:'metadata.base-identities'},
};

// Migration adapters select checked source builders. Conversion is owned by
// their existing declarations; no field is claimed after a failed check.
export function sourceOwnerAttachments(source,id,{claimed=[],catalog}={}) {
 const available={...source,properties:source.properties.filter(row=>!claimed.includes(row.name))};
 const files=catalog?sourceResourceAttachments(source,id,catalog,{claimed}):{attachments:[],blockers:[]};
 const attachments=[...files.attachments],blockers=[...files.blockers];
 for(const [alias,types,build] of [
  ['internal',['InternalInfo'],()=>internalInfoAttachment(available)],
  ['children',['ChildFormNames','ChildTemplateNames'],()=>childNamesFragment(available,id+'.children')],
  ['commands',['MetadataCommands'],()=>ownerCommandsFragment(available,id+'.commands')],
 ]) {
  const properties=available.properties.filter(row=>types.includes(row.parameters?.type)).map(row=>row.name);
  if(!properties.length)continue;
  const result=build();
  if(result.status!=='candidate' || result.remaining?.length) {
   blockers.push({properties,reason:result.reason??'incomplete-source-attachment',remaining:result.remaining??[]});
   continue;
  }
  if(alias==='children' && catalog) {
   const resources=available.properties.filter(property=>properties.includes(property.name))
    .flatMap(property=>sourceChildFileResources(property,catalog)?.resources??[]);
   if(resources.length)result.module.resources=resources;
  }
  const indexProviders=Object.fromEntries(Object.entries(result.module.inputs??{})
   .filter(([,input])=>input.type?.kind==='index').map(([name])=>{
    const index=providers[alias]?.[name];
    if(!index)throw new Error(`Unregistered source attachment provider: ${alias}.${name}`);
    return [name,index];
   }));
  attachments.push({alias,properties,module:result.module,...(Object.keys(indexProviders).length?{indexProviders}:{})});
 }
 if(catalog) {
  const profiles=JSON.parse(readFileSync(new URL('../profiles/ready-attachments.json',import.meta.url),'utf8'));
  for(const property of available.properties.filter(row=>['Module','Help','AdditionalIndex'].includes(row.parameters?.type))) {
   const result=readyAttachment(property,catalog,profiles,available);
   if(result?.status!=='ready') {
    blockers.push({properties:[property.name],reason:result?.reason??'missing-source-attachment'});
    continue;
   }
   const module=catalog.get(result.fragment);
   // Fixed bindings require a composed adapter, not deletion of the binding.
   if(module?.kind!=='fragment' || result.sourceRoot || Object.entries(result.compose.bind??{})
     .some(([name,binding])=>JSON.stringify(binding)!==JSON.stringify({input:name}))) {
    blockers.push({properties:[property.name],reason:'source-attachment-binding-required'});
    continue;
   }
   const indexProviders={};
   for(const [name,input] of Object.entries(module.inputs??{}))if(input.type?.kind==='index') {
    if(property.parameters.type!=='AdditionalIndex' || name!=='identities')
     throw new Error(`Unregistered resource attachment provider: ${property.name}.${name}`);
    indexProviders[name]='metadata.additional-index-ids';
   }
   attachments.push({alias:property.parameters.type==='AdditionalIndex'?'indexes':property.name,
    properties:[property.name],module,...(Object.keys(indexProviders).length?{indexProviders}:{})});
  }
 }
 if(catalog && available.properties.some(row=>row.parameters?.type==='StandardAttributeDescriptions')) {
  const property=available.properties.find(row=>row.parameters?.type==='StandardAttributeDescriptions');
  const snapshot=JSON.parse(readFileSync(new URL('../../../tests/migration/rules-extraction.json',import.meta.url),'utf8'));
  const original=snapshot.entries.find(row=>row.symbol===source.symbol&&row.path===source.path)
   ?.properties.find(row=>row.name===property.name);
  const owner=catalog.get('metadata.standard-attribute-owner');
  if(!isDeepStrictEqual(property,original) || property.name!=='standardAttributes')
   blockers.push({properties:[property.name],reason:'unreviewed-standard-attachment'});
  else if(!owner)blockers.push({properties:[property.name],reason:'missing-standard-attachment'});
  else attachments.push({alias:'standard',properties:[property.name],
   module:renameOwnerFields(sourceStandardAttributesFragment(owner,available,id+'.standard'),{items:property.name}),
   indexProviders:{roots:'metadata.roots',forms:'metadata.forms'}});
 }
 return {attachments,blockers};
}
