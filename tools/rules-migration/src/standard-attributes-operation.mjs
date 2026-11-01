import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {yaml} from './candidate-catalog.mjs';
import {loadSources,checkSnapshot} from './source-snapshot.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';

export function sourceStandardAttributesFragment(owner,source,id) {
 const property=source?.properties.find(item=>item.name==='standardAttributes');
 const params=property?.parameters;
 if(!source?.itemType?.startsWith('Metadata') || params?.type!=='StandardAttributeDescriptions' ||
    params.yaml!=='СтандартныеРеквизиты' || JSON.stringify(params.xmlParents)!=='["Properties"]' ||
    (params.xml!==undefined && params.xml!=='StandardAttributes') ||
    typeof id!=='string' || !id || owner?.id!=='metadata.standard-attribute-owner')
   throw new Error(`Changed standard attribute attachment: ${source?.symbol??'unknown'}`);
 const route=sourceOwnerXmlRoute(source);
 const mounted=structuredClone(owner);
 mounted.kind='fragment';
 mounted.id=id;
 mounted.namespaces={...mounted.namespaces,md:'http://v8.1c.ru/8.3/MDClasses'};
 mounted.representations.xml.fields[0].path=[
   ...route,...params.xmlParents.map(part=>`md:${part}`),
   ...(params.xml?[`md:${params.xml}`]:['md:StandardAttributes']),
 ];
 mounted.presence=[...(mounted.presence??[]),{
  target:{field:'items'},
  xml:{missing:{denotes:{absent:true}},canonical:[{when:{not:{present:{field:'items'}}},form:'missing'},{form:'ordinary'}]},
  yaml:{missing:{denotes:{absent:true}}},
 }];
 return mounted;
}

export function journalStandardAttributesFragment(owner,extraction) {
 return sourceStandardAttributesFragment(owner,
   extraction.entries.find(entry=>entry.symbol==='MetadataDocumentJournalRules'),
   'fragment.journal-standard-attributes');
}

export function tabularStandardAttributesFragment(owner,extraction) {
 return sourceStandardAttributesFragment(owner,
   extraction.entries.find(entry=>entry.symbol==='MetadataDocumentTabularSectionRules'),
   'fragment.document-tabular-section-standard-attributes');
}

export function standardAttributesProbe(fragment,id) {
 return {
  format:'nkdk-declarations/1',kind:'object',id,
  imports:{attributes:fragment.id,...Object.fromEntries(Object.entries(fragment.imports).filter(([alias])=>alias!=='items'))},
  inputs:structuredClone(fragment.inputs),
  compose:[{use:'attributes',bind:Object.fromEntries(Object.keys(fragment.inputs).map(name=>[name,{input:name}]))}],
  value:{kind:'record',fields:[]},
  representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}},
 };
}

export function journalStandardAttributesProbe(fragment) {
 return standardAttributesProbe(fragment,'migration.journal-standard-attributes');
}

export function candidateStandardAttributes(candidateManifest,contractManifest) {
 const entry=candidateManifest.entries.find(row=>row.symbol==='StandardAttributeDescriptionRules');
 if(!entry || entry.properties.length!==27)throw new Error('Changed standard attribute source contract');
 const fragments=entry.projections.filter(row=>row.fields.length===1).map(row=>[row.fragments[0],`fragment.standard-attribute.${row.fields[0]}`]);
 if(fragments.length!==25 || new Set(fragments.map(([id])=>id)).size!==25)throw new Error('Incomplete standard attribute fragments');
 const idMap=new Map(fragments);
 const files=contractManifest.generatedFiles;
 const root='contract.generic-standard-complete-owner';
 const mainNames=new Map([
  ['contract.generic-standard-complete-name-and-fill','metadata.standard-attribute-name-and-fill'],
  ['contract.generic-standard-complete-item','metadata.standard-attribute-item'],
  ['contract.generic-standard-complete-list','metadata.standard-attribute-list'],
  [root,'metadata.standard-attribute-owner'],
 ]);
 const pending=[root],included=new Set();
 while(pending.length){
  const sourceId=pending.pop();
  if(included.has(sourceId) || sourceId.startsWith('common.') || sourceId.startsWith('system.'))continue;
  const text=files[`${sourceId}.yaml`];
  if(!text)throw new Error(`Missing tested standard attribute declaration: ${sourceId}`);
  included.add(sourceId);
  const module=yaml.load(text);
  for(const dependency of Object.values(module.imports??{}))pending.push(dependency);
 }
 for(const sourceId of included)if(!idMap.has(sourceId)){
  // Accepted contracts may reference an earlier candidate hash. Their declared
  // source field, unlike that hash, remains the stable promotion identity.
  const original=yaml.load(files[`${sourceId}.yaml`]);
  const field=original.value?.fields?.length===1?original.value.fields[0].name:undefined;
  const sourceField=sourceId.startsWith('candidate.fragment.') && original.kind==='fragment' &&
    entry.projections.some(row=>row.fields.length===1 && row.fields[0]===field);
  const targetId=sourceField?`fragment.standard-attribute.${field}`:
    mainNames.get(sourceId)??`metadata.standard-attribute-support.${sourceId.replace(/^contract\./,'')}`;
  idMap.set(sourceId,targetId);
 }
 const declarations=[...included].sort().map(sourceId=>{
   const targetId=idMap.get(sourceId);
   const text=files[`${sourceId}.yaml`];
   const module=yaml.load(text);
   module.id=targetId;
   module.imports=Object.fromEntries(Object.entries(module.imports??{}).map(([alias,id])=>[alias,idMap.get(id)??id]));
   return module;
 });
 if(new Set(declarations.map(module=>module.id)).size!==declarations.length)throw new Error('Repeated standard attribute declaration');
 return declarations;
}

function main() {
 const candidates=JSON.parse(readFileSync('tests/migration/rules-candidates/manifest.json','utf8'));
 const contracts=JSON.parse(readFileSync('tests/migration/rules-contract-catalog/manifest.json','utf8'));
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 const choiceSource=extraction.entries.find(entry=>entry.symbol==='StandardAttributeDescriptionRules')
  ?.properties.find(property=>property.name==='choiceForm');
 if(choiceSource?.status!=='static-parameters' ||
    choiceSource.parameters?.type!=='MetadataItemLink' ||
    choiceSource.parameters?.defaultValueXMLRaw!=='' ||
    choiceSource.parameters?.yaml!=='ФормаВыбора')
   throw new Error('Changed source choice-form rule');
 const declarations=candidateStandardAttributes(candidates,contracts);
 const choiceForm=declarations.find(module=>module.id==='fragment.standard-attribute.choiceForm');
 const item=declarations.find(module=>module.id==='metadata.standard-attribute-item');
 const choicePresence=choiceForm?.presence?.find(rule=>rule.target?.field==='choiceForm');
 const choicePart=item?.compose?.find(part=>item.imports?.[part.use]===choiceForm?.id);
 if(!choicePresence?.yaml?.empty?.some(form=>form.form==='null') ||
    !item?.inputs?.componentKind || !choicePart)
   throw new Error('Changed standard attribute choice-form contract');
 choiceForm.inputs.componentKind={type:{kind:'scalar',scalar:'text'}};
 choicePart.bind.componentKind={input:'componentKind'};
 choicePresence.yaml.nullWhen={and:[
  {eq:[{input:'componentKind'},{literal:'extension'}]},
  {not:{present:{field:'choiceForm'}}},
 ]};
 const list=declarations.find(module=>module.id==='metadata.standard-attribute-list');
 const self=list?.presence?.find(rule=>rule.target==='self');
 if(!self || JSON.stringify(self.xml?.missing)!=='{"denotes":{"absent":true}}')
   throw new Error('Changed standard attribute list presence');
 // A missing collection is absent. The explicit empty tag already records a
 // present collection whose canonical rows were all shortened in YAML.
 self.yaml={missing:{denotes:{absent:true}}};
 checkSnapshot(loadSources(extraction.sourceHashes),extraction.sourceHashes);
 const journal=journalStandardAttributesFragment(
   declarations.find(module=>module.id==='metadata.standard-attribute-owner'),extraction);
 const tabular=tabularStandardAttributesFragment(
   declarations.find(module=>module.id==='metadata.standard-attribute-owner'),extraction);
 const enumeration=sourceStandardAttributesFragment(
   declarations.find(module=>module.id==='metadata.standard-attribute-owner'),
   extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules'),
   'fragment.enumeration-standard-attributes');
 const document=sourceStandardAttributesFragment(
   declarations.find(module=>module.id==='metadata.standard-attribute-owner'),
   extraction.entries.find(entry=>entry.symbol==='MetadataDocumentRules'),
   'fragment.document-standard-attributes');
 declarations.push(journal,journalStandardAttributesProbe(journal),tabular,enumeration,document);
 const sourceHash=createHash('sha256').update(JSON.stringify(declarations)).digest('hex');
 const output=`# Generated by tools/rules-migration/src/standard-attributes-operation.mjs; source ${sourceHash}\n`+
  yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations},{noRefs:true});
 const path='rust/declarations/candidates/standard-attributes.generated.yaml';
 if(process.argv.includes('--check')){
   if(readFileSync(path,'utf8')!==output)throw new Error(`Stale generated standard attribute declarations: ${path}`);
 }else if(!existsSync(path) || readFileSync(path,'utf8')!==output){
   writeFileSync(path,output);
 }
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
