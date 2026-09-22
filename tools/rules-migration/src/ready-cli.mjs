import {isDeepStrictEqual} from 'node:util';
import {fileResourceCases} from './file-resource-cases.mjs';
import {readyOwnerCases} from './ready-owner-cases.mjs';
import {verifyOwnerAttachment} from './owner-attachment.mjs';
import {verifyCollectionOwnerAttachment} from './owner-collection-attachment.mjs';
import {readyCases} from './ready-cases.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {candidateCatalog,dependencyFiles,yaml} from './candidate-catalog.mjs';
import {loadSources,checkSnapshot} from './source-snapshot.mjs';
import {writeCandidates} from './candidate-output.mjs';
import {readyAttachment} from './ready-attachment.mjs';

const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
const sources=loadSources(extraction.sourceHashes);
const profilesText=readFileSync('tools/rules-migration/profiles/ready-attachments.json','utf8');
const profiles=JSON.parse(profilesText);
const ownerProfilesText=readFileSync('tools/rules-migration/profiles/owner-attachments.json','utf8');
const ownerProfiles=JSON.parse(ownerProfilesText);
const {catalog,sourceHashes}=candidateCatalog();
const collectionGraph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
checkSnapshot(sources,collectionGraph.sourceHashes);
const modules=new Map(),entries=[];
for(const entry of extraction.entries)for(const property of entry.properties) {
  const mapped=readyAttachment(property,catalog,profiles,entry);
  if(!mapped)continue;
  for(const module of mapped.modules??[])catalog.set(module.id,module);
  const row={path:entry.path,symbol:entry.symbol,property:property.name,source:property.source,...mapped};
  if(entry.comparison.status!=='keys-match') {
    row.status='blocked';row.reason=`owner-${entry.comparison.status}`;
  }
  if(row.status==='ready') {
    const suffix=Object.values(mapped.compose.bind??{}).some(value=>!Object.hasOwn(value,'input'))?'.'+createHash('sha256').update(JSON.stringify(mapped.compose)).digest('hex').slice(0,12):'';
    const id=`candidate.attachment.${mapped.fragment}${suffix}`;
    const roots=[...new Set((mapped.modules??[]).flatMap(module=>(module.representations?.xml?.fields??[]).map(field=>field.path?.[0]).filter(Boolean)))];
    if(roots.length>1)throw new Error('Attachment probe needs a single declared XML root');
    const probePath=roots.length?[roots[0],'Probe','Name']:['Probe','Name'];
    const declaration={format:'nkdk-declarations/1',kind:'object',id,imports:mapped.imports,compose:[mapped.compose],inputs:mapped.inputs,
      ...(roots.length?{namespaces:mapped.modules[0].namespaces}:{}),
      value:{kind:'record',fields:[{name:'probe',type:{kind:'scalar',scalar:'text'}}]},representations:{xml:{kind:'record',fields:[{field:'probe',path:probePath}]},yaml:{kind:'mapping',fields:[{field:'probe',key:'Проверка'}]}}};
    modules.set(id,declaration);
    row.candidate=id;
    row.remaining=[...(mapped.sourceRoot?['owner-source-root-binding']:[]),'owner-context-and-resource-binding','independent-owner-contract'];
  }
  const owners=ownerProfiles.filter(profile=>profile.symbol===entry.symbol && profile.property===property.name);
  if(owners.length>1)throw new Error(`Ambiguous owner profile: ${entry.symbol}.${property.name}`);
  if(owners.length && row.status==='ready') {
    if(owners[0].fragment!==mapped.fragment)throw new Error('Owner fragment does not match source profile');
    for(const [name,value] of Object.entries(owners[0].fixedBindings??{}))if(!isDeepStrictEqual(value,mapped.compose.bind?.[name]))throw new Error(`Owner fixed binding differs from source: ${name}`);
    row.ownerAttachment=verifyOwnerAttachment(owners[0],catalog);
    row.remaining=row.ownerAttachment.status==='bound'?['owner-behavior-check']: [row.ownerAttachment.reason];
  }
  entries.push(row);
}
const provider={format:'nkdk-declarations/1',kind:'object',id:'candidate.attachment.identities',
  value:{kind:'record',fields:['owner','name','id'].map(name=>({name,type:{kind:'scalar',scalar:'text'}}))},
  representations:{xml:{kind:'record',fields:['owner','name','id'].map(field=>({field,path:['Identity',field]}))},yaml:{kind:'mapping',fields:['owner','name','id'].map(field=>({field,key:field}))}},
  contributions:[{index:'migration.attachment-identities',key:{record:{owner:{field:'owner'},name:{field:'name'}}},value:{field:'id'}}]};
const externalCases=readyCases();
const joined=readyOwnerCases(entries,catalog,externalCases);
const collectionOwnerAttachments=ownerProfiles.filter(profile=>!entries.some(row=>row.symbol===profile.symbol&&row.property===profile.property))
  .map(profile=>({symbol:profile.symbol,property:profile.property,
    ...verifyCollectionOwnerAttachment(profile,collectionGraph,catalog)}));
for(const row of collectionOwnerAttachments)if(row.status!=='bound')throw new Error(`Collection owner attachment rejected: ${row.symbol}.${row.property}: ${row.reason}`);
const selected=[...modules.values(),provider],dependencies=dependencyFiles(selected,catalog);
for(const module of joined.modules)if(!selected.some(row=>row.id===module.id) && !dependencies.some(row=>row.id===module.id))selected.push(module);
const files=Object.fromEntries([...selected,...dependencies].map(module=>[`${module.id}.yaml`,yaml.dump(module,{noRefs:true,lineWidth:120})]));
const manifest={version:1,status:'attachment-candidates-only',sourceHashes:extraction.sourceHashes,declarationHashes:sourceHashes,collectionOwnerAttachments,
  ownerProfileHash:createHash('sha256').update(ownerProfilesText).digest('hex'),
  profileHash:createHash('sha256').update(profilesText).digest('hex'),entries,
  summary:{readyOccurrences:entries.filter(row=>row.status==='ready').length,blockedOccurrences:entries.filter(row=>row.status==='blocked').length,
    boundOwnerOccurrences:entries.filter(row=>row.ownerAttachment?.status==='bound').length,
    boundCollectionOwnerOccurrences:collectionOwnerAttachments.length,
    joinedPropertyCandidates:new Set(joined.cases.map(row=>row.entry)).size,joinedCases:joined.cases.length,
    candidates:modules.size,testProviders:1,dependencies:dependencies.length,totalCompiledDeclarations:selected.length+dependencies.length,newProductionConnections:0}};
writeCandidates('tests/migration/ready-attachments',files,manifest);
writeFileSync('docs/superpowers/reports/2026-09-13-ready-attachments.md',`# Подключение готовых деклараций\n\nГотовность кандидата не означает подключение к рабочему владельцу.\n\n${JSON.stringify(manifest.summary)}\n\n| Владелец | Свойство | Результат | Осталось |\n|---|---|---|---|\n${entries.map(row=>`| ${row.symbol} | ${row.property} | ${row.status} | ${row.reason ? row.reason+(row.differences ? ': '+row.differences.map(keys=>keys.join(',')).join(' / ') : '') : row.remaining.join(', ')} |`).join('\n')}\n${collectionOwnerAttachments.map(row=>`| ${row.symbol} | ${row.property} | ${row.status} | owner-behavior-check |`).join('\n')}\n`);
writeFileSync('tests/migration/ready-attachment-cases.json',JSON.stringify({...externalCases,cases:[...externalCases.cases,...joined.cases,...fileResourceCases(extraction,entries)],factSources:[...externalCases.factSources,...joined.factSources]},null,2)+'\n');
console.log(JSON.stringify(manifest.summary));

for(const profile of ownerProfiles) {
  const matches=entries.filter(row=>row.symbol===profile.symbol && row.property===profile.property);
  if(matches.length===0 && collectionOwnerAttachments.some(row=>row.symbol===profile.symbol&&row.property===profile.property))continue;
  if(matches.length!==1 || matches[0].ownerAttachment?.status!=='bound')throw new Error(`Owner attachment rejected: ${profile.symbol}.${profile.property}`);
}
