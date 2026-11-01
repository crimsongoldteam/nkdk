import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {createRequire} from 'node:module';
import {candidateCatalog} from '../src/candidate-catalog.mjs';
import {rootSourceFromRule} from '../src/owner-root-source.mjs';
import * as ownerSource from '../src/owner-root-source.mjs';

test('owner fact source obtains its XML root from the source rule',()=>{
 const catalog=candidateCatalog().catalog;
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 const rule=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
 const source=rootSourceFromRule(catalog,'migration.test-enumeration-root',rule);
 assert.equal(source.id,'migration.test-enumeration-root');
 assert.deepEqual(source.representations.xml.fields[0].path.slice(0,2),
   ['md:MetaDataObject','md:Enum']);
 const renamed=structuredClone(rule);
 renamed.properties.find(property=>property.name==='xmlRoot').parameters.container='RenamedEnum';
 const renamedSource=rootSourceFromRule(catalog,'migration.test-renamed-root',renamed);
 assert.deepEqual(renamedSource.representations.xml.fields[0].path.slice(0,2),
   ['md:MetaDataObject','md:RenamedEnum']);
 renamed.properties.find(property=>property.name==='xmlRoot').parameters.rootAttributes._xmlns='urn:other';
 assert.throws(()=>rootSourceFromRule(catalog,'migration.test-invalid-root',renamed),/Unsupported owner root/);
});

test('owner placement comes from literal source registration and never guesses through overrides',()=>{
 assert.equal(typeof ownerSource.sourceOwnerPlacement,'function');
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 const expected=[
  ['MetadataBusinessProcessRules','BusinessProcesses','БизнесПроцесс'],
  ['MetadataCatalogRules','Catalogs','Справочник'],
  ['MetadataChartOfAccountsRules','ChartsOfAccounts','ПланСчетов'],
  ['MetadataChartOfCalculationTypesRules','ChartsOfCalculationTypes','ПланВидовРасчета'],
  ['MetadataChartOfCharacteristicTypesRules','ChartsOfCharacteristicTypes','ПланВидовХарактеристик'],
  ['MetadataDocumentRules','Documents','Документ'],
  ['MetadataExchangePlanRules','ExchangePlans','ПланОбмена'],
  ['MetadataTaskRules','Tasks','Задача'],
 ];
 for(const [symbol,xmlDir,yamlDir] of expected){
  const source=extraction.entries.find(entry=>entry.symbol===symbol);
  assert.deepEqual(ownerSource.sourceOwnerPlacement(source),{xmlDir,yamlDir});
 }
 const source={symbol:'RenamedRules',path:'in-memory.ts'};
 const text='export const RenamedRules = {...unknown, xmlDir: "Different", itemTypePrefix: "Иное"} satisfies SomeRule';
 assert.deepEqual(ownerSource.sourceOwnerPlacement(source,text),{xmlDir:'Different',yamlDir:'Иное'});
 for(const text of [
  'export const RenamedRules = {xmlDir: "First", itemTypePrefix: "Иное", ...unknown}',
  'export const RenamedRules = {xmlDir: makeDirectory(), itemTypePrefix: "Иное"}',
  'export const RenamedRules = {xmlDir: "../outside", itemTypePrefix: "Иное"}',
  'export const OtherRules = {xmlDir: "First", itemTypePrefix: "Иное"}',
 ])assert.throws(()=>ownerSource.sourceOwnerPlacement(source,text),/Unsupported owner placement/);
});

test('literal root attributes transfer without silently dropping unknown expressions',()=>{
 assert.equal(typeof ownerSource.sourceRootAttributes,'function');
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 const roots=extraction.entries.flatMap(owner=>(owner.properties??[])
   .filter(property=>property.parameters?.type==='XMLRoot')
   .map(property=>({owner,property})));
 assert.equal(roots.length,62);
 for(const {owner,property} of roots){
  if(property.status!=='static-parameters'){
   assert.throws(()=>ownerSource.sourceRootAttributes(owner),/Unsupported root attributes/);
   continue;
  }
  const expected=Object.entries(property.parameters.rootAttributes)
    .filter(([name])=>name!=='_xmlns'&&!name.startsWith('_xmlns:'))
    .map(([name,text])=>({name:name.slice(1),value:{text}}));
  assert.deepEqual(ownerSource.sourceRootAttributes(owner),expected,owner.symbol);
 }
 const owner={symbol:'NeutralRules',properties:[{status:'static-parameters',
  parameters:{type:'XMLRoot',rootAttributes:{_xmlns:'urn:test','_xmlns:xsi':'urn:xsi',
   _version:'2.20','_xsi:type':'AnyType'}}}]};
 assert.deepEqual(ownerSource.sourceRootAttributes(owner),[
  {name:'version',value:{text:'2.20'}},{name:'xsi:type',value:{text:'AnyType'}}]);
 for(const attributes of [{version:'2.20'},{_version:20},
   {'_xmlns:xsi':false},{'_xsi:type':'MissingNamespace'},{'_bad name':'x'},{$unresolved:{kind:'expression'}}]){
  const changed=structuredClone(owner);changed.properties[0].parameters.rootAttributes=attributes;
  assert.throws(()=>ownerSource.sourceRootAttributes(changed),/Unsupported root attributes/);
 }
 const similar=structuredClone(owner);
 similar.properties[0].parameters.rootAttributes={_xmlns:'urn:test',_xmlnsBad:'ordinary','_xml:lang':'ru'};
 assert.deepEqual(ownerSource.sourceRootAttributes(similar),[
  {name:'xmlnsBad',value:{text:'ordinary'}},{name:'xml:lang',value:{text:'ru'}}]);
 assert.throws(()=>ownerSource.sourceRootAttributes({...owner,properties:[]}),/Unsupported.*root/);
 assert.throws(()=>ownerSource.sourceRootAttributes({...owner,properties:[...owner.properties,...owner.properties]}),/Unsupported.*root/);
});

test('computed root attributes become literal declarations for a fixed owner context',()=>{
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 const source=extraction.entries.find(entry=>entry.symbol==='PredefinedRules');
 assert.throws(()=>ownerSource.sourceRootAttributes(source),/Unsupported root attributes/);
 for(const [itemType,type] of [
  ['MetadataChartOfAccounts','ChartOfAccountsPredefinedItems'],
  ['MetadataChartOfCharacteristicTypes','PlanOfCharacteristicKindPredefinedItems'],
  ['MetadataChartOfCalculationTypes','CalculationTypePredefinedItems'],
  ['MetadataCatalog','CatalogPredefinedItems'],
 ])assert.deepEqual(ownerSource.sourceRootAttributes(source,{ownerMetadataItem:{itemType}}),[
  {name:'xsi:type',value:{text:type}},{name:'version',value:{text:'2.20'}}]);
 const changed=structuredClone(source);
 changed.properties[0].parameters.rootAttributes.$unresolved.expression='() => ({_version:"wrong"})';
 assert.throws(()=>ownerSource.sourceRootAttributes(changed,{ownerMetadataItem:{itemType:'MetadataCatalog'}}),/callback/);
});

test('XML envelopes preserve file roots, namespaces and literal attributes from all source rules',()=>{
 assert.equal(typeof ownerSource.sourceRootEnvelope,'function');
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 const owners=extraction.entries.filter(owner=>owner.properties?.some(property=>property.type==='XMLRoot'));
 for(const owner of owners){
  const root=owner.properties.find(property=>property.type==='XMLRoot');
  const context={ownerMetadataItem:{itemType:'MetadataCatalog'}};
  const envelope=ownerSource.sourceRootEnvelope(owner,context);
  assert.deepEqual(envelope.path,root.parameters.isFileRoot ? [`md:${root.parameters.container}`] : ['md:MetaDataObject',`md:${root.parameters.container}`]);
  assert(envelope.namespaces.md);
  assert.deepEqual(envelope.attributes,ownerSource.sourceRootAttributes(owner,context));
 }
 const source=owners.find(owner=>owner.symbol==='ClientApplicationInterfaceRules');
 const changed=structuredClone(source);
 changed.properties.find(property=>property.type==='XMLRoot').parameters.isFileRoot='true';
 assert.throws(()=>ownerSource.sourceRootEnvelope(changed),/Unsupported.*root/);
 const conflict=structuredClone(source);
 conflict.properties.find(property=>property.type==='XMLRoot').parameters.rootAttributes['_xmlns:md']='urn:conflict';
 assert.throws(()=>ownerSource.sourceRootEnvelope(conflict),/Unsupported.*root/);
});

test('source XML envelopes match unchanged e2e metadata and external-file roots',()=>{
 const {XMLParser}=createRequire(new URL('../../../packages/runtime/package.json',import.meta.url))('fast-xml-parser');
 const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'_',parseAttributeValue:false});
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 const rows=[
  ['MetadataDocumentRules','cf/Documents/ДокументВсеСвойства.xml',['MetaDataObject','Document']],
  ['PredefinedRules','cf/Catalogs/СправочникВладелец/Ext/Predefined.xml',['PredefinedData'],'MetadataCatalog'],
  ['PredefinedRules','cf/ChartsOfAccounts/ПланСчетовВсеСвойства/Ext/Predefined.xml',['PredefinedData'],'MetadataChartOfAccounts'],
  ['PredefinedRules','cf/ChartsOfCharacteristicTypes/ВидыСубконто/Ext/Predefined.xml',['PredefinedData'],'MetadataChartOfCharacteristicTypes'],
  ['PredefinedRules','cf/ChartsOfCalculationTypes/ПланРасчетаВсеСвойства/Ext/Predefined.xml',['PredefinedData'],'MetadataChartOfCalculationTypes'],
  ['AdditionalIndexRules','cf/Documents/ДокументВсеСвойства/Ext/AdditionalIndexes.xml',['AdditionalIndexes']],
  ['ClientApplicationInterfaceRules','cf/Ext/ClientApplicationInterface.xml',['ClientApplicationInterface']],
  ['AccumulationRegisterAggregatesRules','cf/AccumulationRegisters/РегистрНакопленияВсеСвойстваОбороты/Ext/Aggregates.xml',['AccumulationRegisterAggregates']],
  ['ExchangePlanContentRules','cf/ExchangePlans/ПланОбменаВсеСвойства/Ext/Content.xml',['ExchangePlanContent']],
  ['RootCommandInterfaceRules','cf/Ext/MainSectionCommandInterface.xml',['CommandInterface']],
 ];
 for(const [symbol,path,expectedPath,itemType] of rows){
  const source=extraction.entries.find(row=>row.symbol===symbol);
  const envelope=ownerSource.sourceRootEnvelope(source,itemType?{ownerMetadataItem:{itemType}}:undefined);
  assert.deepEqual(envelope.path,expectedPath.map(part=>'md:'+part),path);
  const document=parser.parse(readFileSync('e2e/fixtures/xml/'+path,'utf8'));
  const outer=document[expectedPath[0]];
  assert(outer,path);
  assert.equal(outer._xmlns,envelope.namespaces.md,path);
  for(const {name,value} of envelope.attributes)assert.equal(outer['_'+name],value.text,path+': '+name);
  let body=document;
  for(const part of expectedPath)body=body[part];
  assert(body,path);
 }
});
