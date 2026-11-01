import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {candidateCatalog} from '../src/candidate-catalog.mjs';
import {internalInfoAttachment} from '../src/internal-info-attachment.mjs';
import {readyAttachment} from '../src/ready-attachment.mjs';
import {internalInfoCases} from '../src/internal-info-cases.mjs';
import {externalOwnerInternalCases} from '../src/external-owner-internal-case.mjs';
import {attachPropertyStates,propertyStateDeclarations} from '../src/property-state-attachment.mjs';

test('journal PropertyState names are derived from the source registry',()=>{
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const source=entries.find(entry=>entry.symbol==='MetadataDocumentJournalRules');
  const generated=propertyStateDeclarations(source,'journal');
  const names=generated.find(item=>item.id==='journal.property-state-name');
  const expected=['Synonym','DefaultForm','ListPresentation','ExtendedListPresentation',
    'Explanation','ManagerModule'];
  assert.deepEqual(names.value.variants.map(item=>item.name),expected);
  const catalog=candidateCatalog().catalog;
  assert.deepEqual(catalog.get(names.id).value,names.value);
  assert.deepEqual(catalog.get(names.id).representations,names.representations);
  const journal=internalInfoAttachment(source).module;
  journal.id='fragment.journal-internal-info';
  attachPropertyStates(journal,source,'journal');
  const membership=journal.contributions.find(item=>item.index==='metadata.property-state-membership');
  assert.equal(membership.duplicates,'coalesce-equal');
  assert.deepEqual(membership.key.record,{owner:{input:'owner'},
    property:{get:{of:{var:'row'},field:'name'}},mode:{get:{of:{var:'row'},field:'mode'}}});
  assert.deepEqual(membership.forEach,{in:{field:'states'},as:'row'});
  assert.deepEqual(catalog.get(journal.id),journal);
});

test('every extracted InternalInfo owner has a declarative attachment',()=>{
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const owners=entries.filter(entry=>entry.properties?.some(property=>property.type==='InternalInfo'));
  assert.equal(owners.length,45,'review changes to the source inventory');
  for(const owner of owners) {
    const result=internalInfoAttachment(owner);
    assert.equal(result.status,'candidate',`${owner.symbol}: ${result.reason}`);
  }
});

test('internal types derive from source parameters without owner-specific defaults',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/internal-info-operation.mjs','--check'],{stdio:'pipe'});
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const {catalog}=candidateCatalog();
  for(const [symbol,previous] of [['MetadataDocumentRules','fragment.document-internal-info'],['MetadataDocumentJournalRules','fragment.journal-internal-info'],['MetadataEnumerationRules',null],['MetadataDefinedTypeRules',null]]) {
    const owner=entries.find(e=>e.symbol===symbol);
    const actual=internalInfoAttachment(owner);
    assert.equal(actual.status,'candidate');
    const property=owner.properties.find(p=>p.type==='InternalInfo');
    const attachment=readyAttachment(property,catalog,[],owner);
    assert.equal(attachment.status,'ready');
    assert.equal(attachment.fragment,actual.module.id);
    assert.deepEqual(attachment.modules,[actual.module]);
    assert.equal(actual.module.presence[0].yaml.default.sequence.length,property.parameters.items.length);
    if(symbol==='MetadataDefinedTypeRules') {
      const generated=catalog.get('fragment.defined-type-internal-info');
      assert.deepEqual(generated?.presence,actual.module.presence);
      assert.deepEqual(generated?.representations,actual.module.representations);
    }
    if(previous) {
      const old=catalog.get(previous);
      // The journal fragment also owns PropertyState; InternalInfo contributes only types.
      assert.deepEqual(actual.module.presence,old.presence.filter(item=>item.target.field==='types'));
      assert.deepEqual(actual.module.representations,{
        xml:{kind:'record',fields:old.representations.xml.fields.filter(item=>item.field==='types')},
        yaml:{kind:'mapping',fields:old.representations.yaml.fields.filter(item=>item.field==='types')},
      });
      assert.deepEqual(actual.module.inputs,old.inputs);
    }
    const renamed=structuredClone(owner);
    renamed.properties.find(p=>p.type==='XMLRoot').parameters.container='OtherRoot';
    renamed.properties.find(p=>p.type==='InternalInfo').parameters.items=[{name:'DifferentType',category:'OtherCategory'}];
    const changed=internalInfoAttachment(renamed);
    assert.equal(changed.status,'candidate');
    assert.equal(changed.module.representations.xml.fields[0].path[1],'md:OtherRoot');
    assert.equal(changed.module.presence[0].yaml.default.sequence[0].record.category.literal,'OtherCategory');
    renamed.properties.find(p=>p.type==='InternalInfo').parameters.extra=true;
    assert.equal(internalInfoAttachment(renamed).status,'blocked');
  }
});

test('nested owner name callbacks are recognized by their expression, without a source hash',()=>{
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  for(const symbol of ['MetadataExternalDataSourceTableRules','MetadataExternalDataSourceDimensionTableRules',
    'MetadataExternalDataSourceCubeRules','MetadataExternalDataSourceCubeCollectionRules',
    'MetadataIntegrationServiceChannelRules','RecalculationRules','MetadataTabularSectionRules']) {
    const owner=entries.find(entry=>entry.symbol===symbol);
    const actual=internalInfoAttachment(owner);
    assert.equal(actual.status,'candidate',`${symbol}: ${actual.reason}`);
    assert.ok(actual.module.inputs.name);
    assert.equal(actual.module.presence[0].yaml.default.sequence.length,
      owner.properties.find(property=>property.type==='InternalInfo').parameters.items?.length??0);
    const changed=structuredClone(owner);
    changed.properties.find(property=>property.type==='InternalInfo').parameters.getName.$unresolved.expression='({ metadata }) => metadata.name + "Other"';
    assert.equal(internalInfoAttachment(changed).status,'blocked');
  }
});

test('nested tabular sections derive internal types from the source rule',()=>{
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  for(const symbol of ['MetadataDocumentTabularSectionRules',
    'MetadataChartOfAccountsTabularSectionRules','MetadataChartOfCalculationTypesTabularSectionRules',
    'MetadataChartOfCharacteristicTypesTabularSectionRules']) {
    const owner=entries.find(entry=>entry.symbol===symbol);
    const result=internalInfoAttachment(owner);
    assert.equal(result.status,'candidate',`${symbol}: ${result.reason}`);
    assert.deepEqual(result.module.representations.xml.fields[0].path,['md:TabularSection','md:InternalInfo']);
    assert.deepEqual(result.module.presence[0].yaml.default.sequence.map(item=>item.record.category.literal),
      ['TabularSection','TabularSectionRow']);
    const changed=structuredClone(owner);
    changed.properties.find(item=>item.type==='InternalInfo').parameters.getName.$unresolved.expression='({ metadata }) => metadata.name + "Other"';
    assert.equal(internalInfoAttachment(changed).status,'blocked');
  }
});

test('InternalInfo branches come from the configuration and exchange-plan rules',()=>{
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  for(const [symbol,expected] of [
    ['MetadataConfigurationRules','containedObjects'],
    ['MetadataConfigurationExtensionRules','containedObjects'],
    ['MetadataExchangePlanRules','thisNode'],
  ]) {
    const owner=entries.find(entry=>entry.symbol===symbol);
    const actual=internalInfoAttachment(owner);
    assert.equal(actual.status,'candidate',`${symbol}: ${actual.reason}`);
    assert(actual.module.value.fields.some(field=>field.name===expected));
    assert(actual.module.representations.xml.fields.some(field=>field.field===expected));
    assert(actual.module.presence.some(item=>item.target.field===expected && item.yaml.default));
    if(expected==='thisNode')assert.deepEqual(actual.module.representations.xml.fields.map(field=>field.field),
      ['thisNode','types']);
  }
});

test('independent InternalInfo branches keep both fact contributions when combined',()=>{
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const exchange=structuredClone(entries.find(entry=>entry.symbol==='MetadataExchangePlanRules'));
  const configuration=entries.find(entry=>entry.symbol==='MetadataConfigurationRules');
  exchange.properties.find(property=>property.type==='InternalInfo').parameters.containedObjectClassIds=
    configuration.properties.find(property=>property.type==='InternalInfo').parameters.containedObjectClassIds;
  const result=internalInfoAttachment(exchange);
  assert.equal(result.status,'candidate',result.reason);
  assert.deepEqual(result.module.contributions.map(item=>item.index),
    ['metadata.internal-this-nodes','metadata.internal-contained-ids']);
});

test('InternalInfo branches have real configuration and exchange-plan cases',()=>{
  const {catalog}=candidateCatalog();
  const result=internalInfoCases(catalog);
  for(const id of ['configuration-cf','configuration-cfe','exchange-plan-cf','exchange-plan-cfe']) {
    const item=result.cases.find(item=>item.id===`source-internal-info-${id}`);
    assert(item,`Missing ${id}`);
    assert.match(item.xml,/<(?:\w+:)?InternalInfo>/);
    assert.equal(item.yaml,'');
    assert(item.factSourceEntries.length>0);
  }
});

test('repeated generated types retain their XML occurrence order',()=>{
  const result=internalInfoCases(candidateCatalog().catalog);
  const item=result.cases.find(row=>row.id==='source-internal-info-exchange-plan-repeated');
  assert(item);
  assert.equal((item.xml.match(/<xr:GeneratedType\b/g)??[]).length,6);
  assert.match(item.yaml,/^ВнутренниеТипы:\n  - Имя: ExchangePlanObject\./);
  assert.equal((item.yaml.match(/Имя: ExchangePlanObject\./g)??[]).length,2);
  assert.equal(item.factSourceEntries.length,1);
});

test('unknown GeneratedType attribute preserves the readable sibling rows',()=>{
  const generated=internalInfoCases(candidateCatalog().catalog);
  const item=generated.cases.find(row=>row.id==='source-internal-info-exchange-plan-extra-attribute');
  assert.ok(item);
  assert.equal((item.xml.match(/<xr:GeneratedType extra="fixture-attribute"/g)??[]).length,1);
  assert.equal(item.factSourceEntries.length,1);
  assert.ok(item.annotation?.includes('!xml/raw'));
  assert.ok(item.retainedYAML?.includes('      Категория: Ref'));
});

test('additional and reordered contained objects remain readable and reversible',()=>{
  const generated=internalInfoCases(candidateCatalog().catalog);
  const item=generated.cases.find(row=>row.id==='source-internal-info-configuration-extra-contained');
  assert.ok(item);
  assert.equal((item.xml.match(/<xr:ContainedObject>/g)??[]).length,8);
  assert.deepEqual(item.retainedYAML,['ВнутренниеОбъекты:','  - Класс: 00000000-0000-0000-0000-000000000123']);
  assert.equal(item.noRaw,true);
  const reordered=generated.cases.find(row=>row.id==='source-internal-info-configuration-reordered-contained');
  assert.ok(reordered);
  const classIds=xml=>[...xml.matchAll(/<xr:ClassId>([^<]+)<\/xr:ClassId>/g)].map(([,id])=>id);
  const original=generated.cases.find(row=>row.id==='source-internal-info-configuration-cf');
  assert.deepEqual(classIds(reordered.xml).slice(0,2),classIds(original.xml).slice(0,2).reverse());
  assert.equal(reordered.noRaw,true);
});

test('external table and dimension table verify generated types against e2e XML',()=>{
  const {catalog}=candidateCatalog();
  const generated=internalInfoCases(catalog);
  for(const [symbol,name] of [
    ['MetadataExternalDataSourceTableRules','ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства'],
    ['MetadataExternalDataSourceDimensionTableRules','ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства'],
  ]) {
    const actual=generated.cases.find(row=>row.id==='source-internal-info-'+symbol);
    assert.ok(actual,symbol);
    assert.equal(actual.inputs.name,name);
    assert.ok(actual.source.some(row=>row.path.startsWith('e2e/fixtures/xml/cf/')));
    assert.deepEqual(actual.factBindings,{typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids'});
  }
});

test('nested owners keep their qualified generated-type names',()=>{
  const generated=internalInfoCases(candidateCatalog().catalog);
  for(const [symbol,name,count] of [
    ['MetadataIntegrationServiceChannelRules','СервисИнтеграцииВсеСвойства.КаналСервисаИнтеграцииВсеСвойства',1],
    ['RecalculationRules','РегистрРасчетаВсеСвойства.ПерерасчетВсеСвойства',3],
    ['MetadataDocumentTabularSectionRules','ДокументВсеСвойства.ТабличнаяЧасть',2],
  ]) {
    const item=generated.cases.find(row=>row.id==='source-internal-info-'+symbol);
    assert.ok(item,symbol);
    assert.equal(item.inputs.name,name);
    assert.match(item.xml,new RegExp('\\.'+name.replaceAll('.','\\.')));
    assert.equal((item.xml.match(/<xr:GeneratedType\b/g)??[]).length,count);
  }
});

test('root owners with different generated-type counts use the same declaration',()=>{
  const generated=internalInfoCases(candidateCatalog().catalog);
  for(const [symbol,count] of [
    ['MetadataCatalogRules',5],
    ['MetadataConstantRules',3],
    ['MetadataAccountingRegisterRules',7],
    ['MetadataInformationRegisterRules',7],
    ['MetadataReportRules',2],
    ['MetadataChartOfCalculationTypesRules',11],
    ['MetadataChartOfCharacteristicTypesRules',6],
  ]) {
    const item=generated.cases.find(row=>row.id==='source-internal-info-'+symbol);
    assert.ok(item,symbol);
    assert.equal((item.xml.match(/<(?:\w+:)?GeneratedType\b/g)??[]).length,count,symbol);
    assert.deepEqual(item.factBindings,{typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids'});
    assert.ok(item.source.some(row=>row.path.startsWith('e2e/fixtures/xml/cf/')));
  }
});

test('remaining root GeneratedType owners use e2e XML and the source item count',()=>{
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
  const generated=internalInfoCases(candidateCatalog().catalog);
  for(const symbol of [
    'MetadataAccumulationRegisterRules','MetadataBusinessProcessRules',
    'MetadataCalculationRegisterRules','MetadataChartOfAccountsRules',
    'MetadataDataProcessorRules','MetadataDefinedTypeRules',
    'MetadataExternalDataSourceRules','MetadataFilterCriterionRules',
    'MetadataIntegrationServiceRules','MetadataSequenceRules',
    'MetadataSettingsStorageRules','MetadataTaskRules','MetadataWSReferenceRules',
  ]) {
    const item=generated.cases.find(row=>row.id==='source-internal-info-'+symbol);
    assert.ok(item,symbol);
    const owner=extraction.entries.find(row=>row.symbol===symbol);
    const expected=owner.properties.find(row=>row.type==='InternalInfo').parameters.items.length;
    assert.equal((item.xml.match(/<(?:\w+:)?GeneratedType\b/g)??[]).length,expected,symbol);
    assert.ok(item.source.some(row=>row.path.startsWith('e2e/fixtures/xml/cf/')));
  }
});

test('tabular-section GeneratedType owners retain qualified names from e2e XML',()=>{
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
  const generated=internalInfoCases(candidateCatalog().catalog);
  for(const symbol of [
    'MetadataBusinessProcessTabularSectionRules','MetadataCatalogTabularSectionRules',
    'MetadataChartOfAccountsTabularSectionRules',
    'MetadataChartOfCalculationTypesTabularSectionRules',
    'MetadataChartOfCharacteristicTypesTabularSectionRules',
    'MetadataDataProcessorTabularSectionRules',
    'MetadataExchangePlanTabularSectionRules','MetadataReportTabularSectionRules',
    'MetadataTaskTabularSectionRules',
  ]) {
    const item=generated.cases.find(row=>row.id==='source-internal-info-'+symbol);
    assert.ok(item,symbol);
    const owner=extraction.entries.find(row=>row.symbol===symbol);
    const expected=owner.properties.find(row=>row.type==='InternalInfo').parameters.items.length;
    assert.equal((item.xml.match(/<(?:\w+:)?GeneratedType\b/g)??[]).length,expected,symbol);
    assert.match(item.inputs.name,/\./,symbol);
  }
});

test('external-source cube and collection variants use their own declarations',()=>{
  const generated=internalInfoCases(candidateCatalog().catalog);
  for(const [symbol,count] of [
    ['MetadataExternalDataSourceCubeRules',7],
    ['MetadataExternalDataSourceCubeCollectionRules',7],
    ['MetadataExternalDataSourceTableCollectionRules',8],
    ['MetadataExternalDataSourceDimensionTableCollectionRules',4],
  ]) {
    const item=generated.cases.find(row=>row.id==='source-internal-info-'+symbol);
    assert.ok(item,symbol);
    assert.equal((item.xml.match(/<(?:\w+:)?GeneratedType\b/g)??[]).length,count,symbol);
    assert.match(item.inputs.name,/\./,symbol);
    if(symbol.endsWith('CollectionRules')) {
      const operation=generated.modules.find(module=>module.id===item.entry);
      const fragment=generated.modules.find(module=>module.id===operation?.imports?.part);
      const root=fragment.representations.xml.fields[0].path[0].split(':')[1];
      assert.match(item.xml,new RegExp(`^<(?:\\w+:)?${root}\\b`),symbol);
    }
  }
});

test('each InternalInfo scenario prepares facts only from its own selected source',()=>{
  const generated=internalInfoCases(candidateCatalog().catalog);
  for(const item of generated.cases) {
    if(!item.factBindings) {
      assert.equal(item.factSourceEntries,undefined,item.id);
      continue;
    }
    const composedFiles=item.id==='source-catalog-mounted-file-services';
    assert.equal(item.factSourceEntries?.length,composedFiles?2:1,item.id);
    if(composedFiles)assert.equal(item.factSourceEntries[1],'test.catalog-file-services.index-source');
    for(const id of item.factSourceEntries)
      assert.ok(generated.factSources.some(source=>source.id===id),item.id);
  }
});

test('every InternalInfo source application has an e2e-backed candidate route',()=>{
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
  const applications=extraction.entries.filter(entry=>entry.properties?.some(row=>row.type==='InternalInfo'));
  const generated=internalInfoCases(candidateCatalog().catalog);
  const declared=new Set(generated.modules.map(module=>module.id));
  for(const owner of applications) {
    const fragment=internalInfoAttachment(owner).module;
    assert.ok(declared.has(fragment.id),owner.symbol);
  }
  const base=generated.cases.find(row=>row.id==='source-internal-info-MetadataTabularSectionRules');
  assert.equal(base.factBindings,undefined);
});

test('external owner projections compose InternalInfo and properties without a specialized Rust handler',()=>{
  const joined=externalOwnerInternalCases(candidateCatalog().catalog);
  assert.deepEqual(joined.cases.map(row=>row.id),['joined-internal-Table','joined-internal-DimensionTable']);
  for(const row of joined.cases) {
    assert.match(row.xml,/InternalInfo/);
    assert.match(row.xml,/Properties/);
    assert.ok(row.yaml.length>0);
    assert.equal(row.factBindings.typeIds,'metadata.internal-type-ids');
    assert.equal(row.factBindings.valueIds,'metadata.internal-value-ids');
    const owner=joined.modules.find(module=>module.id===row.entry);
    assert.equal(owner.compose.length,6);
    assert.ok(owner.imports.internal.startsWith('candidate.internal-info.'));
  }
});
