import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {loadSources} from './source-snapshot.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {bindObjectRootEnvelope} from './file-root-envelope.mjs';

const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
loadSources(extraction.sourceHashes);
const source=extraction.entries.find(entry=>entry.symbol==='MetadataDocumentJournalRules');
if(!source?.shapeComplete)throw new Error('Complete document journal rules.ts is required');
const assembly={
 xmlRoot:['XMLRoot','root'],internalInfo:['InternalInfo','internal'],uuid:['uuid','root'],
 name:['string','base'],synonym:['I8nText','base'],comment:['string','base'],
 defaultForm:['MetadataItemLink','links'],auxiliaryForm:['MetadataItemLink','links'],
 useStandardCommands:['boolean','base'],registeredDocuments:['MetadataItemLinks','base'],
 includeHelpInContents:['boolean','base'],standardAttributes:['StandardAttributeDescriptions','standardAttributes'],
 listPresentation:['I8nText','base'],extendedListPresentation:['I8nText','base'],
 explanation:['I8nText','base'],objectBelonging:['SystemEnumeration','base'],
 extendedConfigurationObject:['string','base'],columns:['MetadataDocumentJournalColumns','columns'],
 forms:['ChildFormNames','children'],templates:['ChildTemplateNames','children'],
 commands:['MetadataCommands','commands'],additionalIndexes:['AdditionalIndex','indexes'],
 managerModule:['Module','managerModule'],help:['Help','help'],
};
const pending=source.properties.filter(property=>
  !assembly[property.name] || assembly[property.name][0]!==property.type).map(property=>property.name);
const missing=Object.keys(assembly).filter(name=>
  !source.properties.some(property=>property.name===name));
if(pending.length || missing.length)
  throw new Error(`Document journal property contract changed: ${JSON.stringify({pending,missing})}`);
const probe=yaml.load(readFileSync('rust/declarations/probes/journal-identity-and-children.yaml','utf8'));
if(probe.id!=='migration.journal-identity-and-children' || probe.kind!=='object')
  throw new Error('Document journal assembled probe has changed');
const uuid=source.properties.find(property=>property.name==='uuid');
if(probe.representations.xml.content.fields[0].path.join('/')!==sourceOwnerXmlRoute(source).join('/') ||
   probe.representations.xml.content.fields[0].attribute!==uuid.parameters.xml.slice(1))
  throw new Error('Document journal XML root differs from rules.ts');
for(const property of source.properties) {
 const fragment=assembly[property.name][1];
 if(fragment!=='root' && !probe.imports[fragment])
   throw new Error(`Missing assembled journal fragment for ${property.name}`);
}
if(source.xmlOrder?.status!=='static' ||
  source.xmlOrder.keys.some(name=>!assembly[name]) ||
  new Set(source.xmlOrder.keys).size!==source.xmlOrder.keys.length)
  throw new Error('Document journal XML order changed');
const value=bindObjectRootEnvelope(probe,source);
value.id='metadata.journal';
const coverage={assembled:source.properties.map(property=>property.name),pending:[]};
const standard=source.properties.find(property=>property.name==='standardAttributes')?.parameters?.standartAttributeNames;
const caseFile=JSON.parse(readFileSync('tests/migration/rules-contract-cases.json','utf8'))
 .cases.find(row=>row.id==='standard-attribute-family-document-journal');
if(!standard || !caseFile ||
  Object.keys(standard).sort().join()!==[...caseFile.inputs.canonicalNames].sort().join())
 throw new Error('Journal standard attribute profile differs from rules.ts');
const snapshot=(entry,field,defaultValue)=>({snapshot:{entry,field,
 ...(defaultValue===undefined?{}:{default:defaultValue})}});
const own='migration.journal-own-identity';
const ownerIdentity=snapshot(own,'uuid');
const childSource=(kind,directions,created)=>({
 entry:`migration.journal-${kind}-${directions.includes('yaml-to-xml')?'identity':'base'}-source`,
 factDirections:directions,newOwner:{template:{[kind]:created}},
 inputs:{component:'component',ownerIdentity},
});
const route={format:'nkdk-operation-routes/1',
 routes:[{xmlDir:'DocumentJournals',yamlDir:'ЖурналДокументов',yamlFile:'Свойства.yaml',
  ownerFacts:false,
  owners:{cf:value.id,cfe:value.id},
  inputs:{
   owner:ownerIdentity,name:'name',ownerPath:{concat:[{literal:'DocumentJournal.'},'name']},
   forms:snapshot('migration.journal-child-names','Формы',[]),
   templates:snapshot('migration.journal-child-names','Шаблоны',[]),
   commandNames:{snapshot:{entry:'migration.journal-commands-identity-source',
    field:'commands',each:'name',default:[]}},
   helpPages:snapshot('migration.journal-help-pages-source','pages',[]),
   defaultLanguage:'defaultLanguage',
   registeredLanguages:'registeredLanguages',component:'component',
   componentKind:{byComponent:{cf:{literal:'configuration'},cfe:{literal:'extension'}}},
   owners:{literal:[]},canonicalNames:{literal:caseFile.inputs.canonicalNames},
   elidableNames:{byComponent:{cf:{literal:caseFile.inputs.elidableNames},cfe:{literal:[]}}},
   profiles:{literal:caseFile.inputs.profiles},
  },
  sources:[
   {entry:own,inputs:{component:'component',parent:'parent',ownerName:'name'}},
   {entry:'migration.journal-base-identity',only:['cfe'],
    newOwner:{template:{base:[{base:{externalSnapshot:{component:'cf',
     entry:own,field:'uuid'}}}]}},
    inputs:{component:'component',parent:'parent',ownerName:'name'}},
   childSource('columns',['xml-to-yaml','yaml-to-xml'],[]),
   childSource('commands',['xml-to-yaml','yaml-to-xml'],[]),
   {entry:'migration.journal-generated-types',
    inputs:{component:'component',parent:'parent',ownerName:'name'}},
   {entry:'migration.journal-child-names',
    inputs:{forms:{literal:[]},templates:{literal:[]}}},
   {entry:'migration.journal-help-pages-source',
    factDirections:[],resourceNames:{directory:['Ext','Help'],field:'pages',extensions:['html','htm']},
    newOwner:{template:{pages:[]}},inputs:{}},
   {entry:'migration.journal-additional-index-identity-source',
    resourceFile:['Ext','AdditionalIndexes.xml'],missingResource:{indexes:[]},
    newOwner:{template:{indexes:[]}},inputs:{owner:ownerIdentity}},
  ]}],
 factRoutes:[
  {xmlDir:'Documents',entry:'migration.document-root-source'},
  {xmlDir:'CommandGroups',entry:'migration.command-group-root-source'},
  {xmlDir:'CommandGroups',entry:'migration.adopted-command-group-root-source',only:['cfe']},
 ]};
for(const [path,content] of [
 ['rust/declarations/objects/journal.generated.yaml',
  `# Generated from ${source.path} by tools/rules-migration/src/journal-owner-operation.mjs\n`+
   yaml.dump(value,{noRefs:true})],
 ['tests/migration/journal-owner-coverage.json',JSON.stringify(coverage,null,2)+'\n'],
 ['rust/operations/journal.routes.generated.yaml',
  '# Generated from rules.ts by tools/rules-migration/src/journal-owner-operation.mjs\n'+
  yaml.dump(route,{noRefs:true})],
]) {
 if(process.argv.includes('--check')) {
  if(readFileSync(path,'utf8')!==content)throw new Error(`Stale generated file: ${path}`);
 } else if(!existsSync(path) || readFileSync(path,'utf8')!==content) writeFileSync(path,content);
}
