import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectExecutableFamily,includeIndexTypes,runtimeExports} from '../src/family-check.mjs';

test('metadata DCS values transfer immutable fixtures across all nine profiles',async()=>{
  const {candidateCatalog}=await import('../src/candidate-catalog.mjs');
  const {dcsMetadataValueCases}=await import('../src/dcs-metadata-value-cases.mjs');
  const result=dcsMetadataValueCases(candidateCatalog().catalog);
  assert.equal(result.cases.length,21);
  assert.equal(new Set(result.cases.map(row=>row.profile)).size,9);
  assert(result.factSources.every(row=>row.entry.startsWith('metadata.')));
  assert(result.cases.every(row=>row.source.length>=2));
  assert(result.cases.some(row=>row.id==='dcs-metadata-value-emptyLocalString'));
  assert(result.cases.some(row=>row.id==='dcs-metadata-value-primitiveTypeRef'));
  assert(result.cases.find(row=>row.id==='dcs-metadata-value-invalid-boolean').xml.includes('>oops</dcscor:value>'));
  assert.equal(result.cases.find(row=>row.id==='dcs-metadata-value-extra-choice-parameter').xml.match(/<dcscor:item>/g).length,2);
  assert.equal(result.cases.find(row=>row.id==='dcs-metadata-value-emptyLocalString').annotation,'value: !xml/raw');
  assert(result.modules.filter(row=>row.kind==='fragment').every(row=>
    row.representations.xml.fields.every(field=>field.path[0]==='Root')));
});

test('DCS parameter acceptance uses production fact sources and covers all source fields',async()=>{
  const {candidateCatalog}=await import('../src/candidate-catalog.mjs');
  const {dcsParameterCase}=await import('../src/dcs-parameter-case.mjs');
  const result=dcsParameterCase(candidateCatalog().catalog);
  assert(result.factSources.every(row=>row.entry.startsWith('metadata.')));
  const row=result.modules.find(module=>module.value?.kind==='record' && module.value.fields.some(field=>field.name==='valueType'));
  assert.equal(row.value.fields.length,12);
  assert.equal(row.id,'common.dcs-parameter');
  const list=result.modules.find(module=>module.value?.kind==='sequence' && module.representations.yaml.kind==='record-mapping');
  assert.equal(list.imports.item,row.id,'Named collection uses the same published record');
  assert.equal(list.representations.yaml.key,'name');
  assert(result.cases.every(row=>row.source?.length>=2));
  const boundaries=result.cases.find(row=>row.id==='dcs-parameter-optional-source-fields');
  assert(boundaries,'properties absent from the real e2e must also be exercised');
  assert.match(boundaries.xml,/<dcssch:functionalOptionsParameter>Опция<\/dcssch:functionalOptionsParameter>/);
  assert.match(boundaries.xml,/<dcssch:denyIncompleteValues>true<\/dcssch:denyIncompleteValues>/);
  assert.match(boundaries.yaml,/ПараметрФункциональныхОпций: Опция/);
  assert.match(boundaries.yaml,/ЗапрещатьНезаполненныеЗначения: Истина/);
  const extra=result.cases.find(row=>row.id==='dcs-parameter-choice-parameters-extra-item');
  assert(extra,'singleton projection must preserve extra items as an anomaly');
  assert.match(extra.xml,/>ВторойПараметр</);
  assert(extra.retainedYAML.includes('    Заголовок: Параметр1'));
  assert.equal(extra.annotation,'          - !xml/raw');
  assert(extra.retainedYAML.includes('              Параметр: 123'));
});

test('calculated field family transfers all nine properties and both independent e2e expectations',async()=>{
  const {candidateCatalog}=await import('../src/candidate-catalog.mjs');
  const {generateExecutableFamily}=await import('../src/family-check.mjs');
  const result=generateExecutableFamily('calculated-fields',candidateCatalog().catalog);
  const list=result.modules.find(module=>module.value?.kind==='sequence' && module.representations.xml.kind==='element-sequence');
  assert.equal(list.imports.item,'common.calculated-field');
  assert(!result.modules.some(module=>module.id.startsWith('candidate.collection.item.')));
  assert.equal(result.modules.find(row=>row.id==='common.calculated-field')?.yamlOrder.length,9);
  assert.deepEqual(result.cases.slice(0,2).map(row=>row.id),['calculated-fields-real-0','calculated-fields-real-1']);
  assert.match(result.cases[1].yaml,/Ссылка/);
  assert(result.cases.some(row=>row.id==='calculated-fields-neighbours-and-repeat'));
  assert(result.cases.some(row=>row.id==='calculated-fields-invalid-boolean'));
  assert(result.cases.every(row=>row.source?.length>=2));
  assert(result.factSources.every(row=>row.entry.startsWith('metadata.')),'working families use production index sources');
});

test('family check selects only declared acceptance families',()=>{
  const families=[{id:'enum-values',role:'accept-first'},{id:'document-attributes',role:'accept-next'},{id:'form-attribute',role:'requirements'}];
  assert.equal(selectExecutableFamily(families,['--','--family','document-attributes']),'document-attributes');
  assert.equal(selectExecutableFamily(families,['--family','enum-values']),'enum-values');
  assert.equal(selectExecutableFamily(families,['--family','document-attributes','--case','e2e-document-attribute-metadata-path']),'document-attributes');
  assert.throws(()=>selectExecutableFamily(families,['--family','document-attributes','--case','']),/Usage: test:migration-family/);
  assert.throws(()=>selectExecutableFamily(families,['--family','form-attribute']),/not executable/);
  assert.throws(()=>selectExecutableFamily(families,['--family','unknown']),/not executable/);
  assert.throws(()=>selectExecutableFamily(families,[]),/Usage: test:migration-family/);
});

test('focused family includes only missing index type providers',()=>{
 const consumer={id:'consumer',inputs:{base:{index:'base'},roots:{index:'roots'}}};
 const roots={id:'roots-source',contributions:[{index:'roots'}]};
 const baseFragment={id:'base-fragment',contributions:[{index:'base'}]};
 const base={id:'base-source',imports:{facts:'base-fragment'},compose:[{use:'facts'}]};
 const unused={id:'unused-source',contributions:[{index:'unused'}]};
 const catalog=new Map([consumer,roots,baseFragment,base,unused].map(module=>[module.id,module]));
 assert.deepEqual(includeIndexTypes([consumer,roots],catalog,['base-source','unused-source']).map(module=>module.id),
   ['consumer','roots-source','base-source']);
});

test('runtime compilation exports cases and fact sources without compiling unused object roots',()=>{
  assert.deepEqual(runtimeExports([{entry:'case.a'},{entry:'case.b'}],
    [{entry:'facts.a'},{entry:'case.a'}]),['case.a','case.b','facts.a']);
});


test('appearance profile acceptance retains the real ten ordinary rows and separates string normalization',async()=>{
  const {candidateCatalog}=await import('../src/candidate-catalog.mjs');
  const {appearanceFieldsCases}=await import('../src/appearance-fields-cases.mjs');
  const {catalog}=candidateCatalog();
  const result=appearanceFieldsCases(catalog);
  const table=result.modules[0].representations.yaml.itemInputs.valueProfile.table;
  assert.equal(Object.keys(table.values).length,12);
  const cases=result.cases.filter(row=>row.id.startsWith('appearance-profile-')&&row.noRaw&&row.id!=='appearance-profile-known-empty');
  assert.equal(cases.length,10);
  for(const row of cases) {
    assert.ok(row.xml.includes('<dcscor:parameter>'));
    assert.ok(row.yaml.startsWith('Оформление:\n'));
    assert.ok(row.source.some(source=>source.path.startsWith('e2e/fixtures/xml/')));
  }
  const whole=result.cases.find(row=>row.id==='appearance-profiles-together');
  assert.equal((whole.xml.match(/<dcscor:item /g)??[]).length,10);
  assert.ok(!whole.yaml.includes('\n  Текст:')&&!whole.yaml.includes('\n  Формат:'));
  assert.ok(result.cases.some(row=>row.id==='appearance-profiles-duplicate'&&row.annotation));
  assert.ok(result.cases.some(row=>row.id==='appearance-profile-invalid-boolean'&&row.xml.includes('oops')));
  const {readFileSync}=await import('node:fs');
  const {yaml}=await import('../src/candidate-catalog.mjs');
  const rows=yaml.load(readFileSync('rust/data/system-enumeration-lexemes.generated.yaml','utf8')).Словари;
  assert.equal(rows.length,3503);
  assert.equal(rows.filter(row=>row.Основное==='Истина').length,3501);
  assert.deepEqual(rows.filter(row=>row.Основное==='Ложь'),[
    {Имя:'CheckBoxType',Код:'Switch',Представление:'Выключатель',Основное:'Ложь'},
    {Имя:'RadioButtonType',Код:'RadioButton',Представление:'Переключатель',Основное:'Ложь'},
  ]);
  const source=catalog.get('metadata.system-enumeration-index-source');
  assert.deepEqual(source.contributions.map(row=>row.index),['dcs.enumeration-labels','dcs.enumeration-codes']);
  assert.deepEqual(source.contributions[1].when,{get:{of:{var:'row'},field:'canonical'}});
  const {workingAppearanceCases}=await import('../../../tests/migration/proposals/appearance-strings/collection-cases.mjs');
  const published=workingAppearanceCases(result.cases);
  const [empty]=workingAppearanceCases([{...whole,yaml:'{}'}]);
  assert.deepEqual(yaml.load(empty.yaml),{Вид:'ПолеНабораДанныхСхемыКомпоновкиДанных'});
  const colour=published.find(row=>row.id==='working-appearance-profile-ЦветТекста');
  assert.ok(colour,'The existing colour fixture must reach the published projection');
  assert.equal(colour.xmlQNamePaths[0][0],'Field');
  assert.equal(colour.xmlQNamePaths[0][1],'{http://v8.1c.ru/8.1/data-composition-system/schema}appearance');

});


test('typed DCS values transfer all literal fixtures without executing legacy converters',async()=>{
  const {candidateCatalog}=await import('../src/candidate-catalog.mjs');
  const {dcsMetadataTypedValueCases}=await import('../src/dcs-metadata-typed-value-cases.mjs');
  const result=dcsMetadataTypedValueCases(candidateCatalog().catalog);
  const literalCases=result.cases.filter(row=>row.id.startsWith('dcs-metadata-typed-value-'));
  assert.equal(literalCases.length,11);
  assert(literalCases.every(row=>row.noRaw && row.source.length===1));
  assert(result.cases.some(row=>row.yaml.includes("''")));
  assert(literalCases.every(row=>row.xml.includes('<value xsi:type=')));
  const sequence=result.cases.find(row=>row.id==='dcs-typed-sequence');
  assert.equal(sequence.xml.match(/<value xsi:type=/g).length,3);
  assert(sequence.noRaw && sequence.yaml.includes('Сосед: kept'));
  const absent=result.cases.find(row=>row.id==='dcs-typed-absent-values');
  assert(!absent.xml.includes('<value') && absent.noRaw);
  assert.equal(absent.yaml,'Сосед: kept');
  assert(result.cases.find(row=>row.id==='dcs-typed-nil-position').acceptedYAML[0].includes('{}'));
  assert(result.cases.find(row=>row.id==='dcs-typed-missing-position-export').reverseYAML.includes('{}'));
  assert.equal(result.cases.filter(row=>row.id.startsWith('dcs-typed-undefined-')).length,2);
  const owner=result.modules.find(row=>row.id==='probe.dcs-typed-values');
  assert.equal(owner.imports.value,'common.dcs-typed-values');
  assert.deepEqual(owner.representations.xml.fields.find(row=>row.field==='value').path,['Root','Values','value']);
});


test('data set fields assemble all source properties and preserve independent kind fixtures',async()=>{
  const {candidateCatalog}=await import('../src/candidate-catalog.mjs');
  const {dataSetFieldCases}=await import('../src/data-set-field-cases.mjs');
  const result=dataSetFieldCases(candidateCatalog().catalog);
  const entry=result.modules.find(row=>row.id==='working.dcs-data-set-field');
  assert.equal(entry.yamlOrder.length,15);
  assert.equal(result.modules.find(row=>row.id==='common.data-composition-schema-data-set-field')?.yamlOrder.length,15);
  assert(!Object.hasOwn(entry.inputs,'ownerKind'));
  assert.equal(result.cases.length,13);
  assert(result.cases.some(row=>row.id==='data-set-field-registered-form-collection'));
  const registered=result.cases.find(row=>row.id==='data-set-field-registered-form-collection');
  assert(!Object.hasOwn(result.modules.find(row=>row.id===registered.entry).inputs,'ownerKind'),'Collection predicates use their own sibling kind, as ordinary records do');
  const registeredList=result.modules.find(module=>module.value?.kind==='sequence' && module.representations.xml.kind==='element-sequence');
  assert.equal(registeredList.imports.item,'common.data-composition-schema-data-set-field');
  assert(result.cases.every(row=>row.source.length>=2));
  const augmented=result.cases.find(row=>row.id==='data-set-field-all-source-properties');
  assert(augmented.xml.includes('<dcssch:attributeUseRestriction>'));
  assert(augmented.yaml.includes('НаборДанныхПроверкиИерархии: hierarchyCheckDataSet'));
  assert(result.cases.find(row=>row.id==='data-set-field-folder').yaml.includes('ПапкаПолей'));
  assert(result.cases.find(row=>row.id==='data-set-field-nested').yaml.includes('ВложенныйНабор'));
});

test('filter comparison transfers every serializable property and accounts for runtime-only state',async()=>{
  const {candidateCatalog}=await import('../src/candidate-catalog.mjs');
  const {filterComparisonCases}=await import('../src/filter-comparison-cases.mjs');
  const result=filterComparisonCases(candidateCatalog().catalog);
  const owner=result.modules.find(module=>module.kind==='object');
  assert.equal(owner.yamlOrder.length,9);
  assert(!owner.yamlOrder.includes('parent'));
  assert(result.cases.every(row=>row.adaptation.includes('parent')));
  assert.equal(result.cases.length,6);
  assert(result.cases.some(row=>row.acceptedYAML && row.yaml.includes('!xml/raw')));
  assert.equal(owner.representations.xml.attributes[0].value.qname,'dcsset:FilterItemComparison');
  const {filterTreeCases}=await import('../src/filter-tree-cases.mjs');
  const tree=filterTreeCases(candidateCatalog().catalog);
  assert.equal(tree.cases.length,11);
  assert.equal(tree.modules.find(row=>row.id==='common.filter-group').yamlOrder.length,8);
  assert.equal(tree.modules.find(row=>row.id==='working.filter-owner').yamlOrder.length,5);
  assert.equal(tree.modules.find(row=>row.id==='common.filter-node').representations.yaml.fallback,'comparison');
  assert(tree.cases.some(row=>row.id==='filter-tree-invalid-neighbour'));

});

test('conditional appearance assembles all source fields and reuses the recursive filter',async()=>{
  const {candidateCatalog}=await import('../src/candidate-catalog.mjs');
  const {conditionalAppearanceCases}=await import('../src/conditional-appearance-cases.mjs');
  const generated=conditionalAppearanceCases(candidateCatalog().catalog);
  assert(generated.cases.some(row=>row.id==='conditional-item-minimal'));
  assert(generated.cases.some(row=>row.id==='conditional-owner-source'));
  const item=generated.modules.find(row=>row.id==='common.conditional-appearance-item');
  assert.equal(item.yamlOrder.length,18);
  assert.equal(generated.modules.find(row=>row.id==='working.conditional-appearance').yamlOrder.length,4);
  assert(generated.modules.some(row=>row.id==='common.filter'));
  assert.equal(generated.modules.find(row=>row.id==='common.conditional-appearance')?.yamlOrder.length,4);
  assert(generated.modules.filter(row=>row.kind!=='object').every(row=>Object.values(row.inputs??{}).every(input=>!input.index)), 'Prepared indexes belong to the owning object');
});

test('shared family runner preserves the ordinary harness and line based export names',async()=>{
  const {sharedFamilyRunner}=await import('../src/shared-family-check.mjs');
  const {resolve}=await import('node:path');
  const runner=sharedFamilyRunner(resolve('rust/target/test-shared-family'),['one','two']);
  assert.equal(runner.exportsText,'one\ntwo\n');
  assert.equal(runner.manifest.match(/\[workspace\]/g).length,1);
  assert.match(runner.manifest,/tools\/rules-migration\/runtime\/src\/main.rs/);
  assert.match(runner.manifest,/debug=0/);
});


test('DynamicList scalar properties share the real owner type and preserve invalid neighbours',async()=>{
  const {candidateCatalog,dependencyFiles}=await import('../src/candidate-catalog.mjs');
  const {dynamicListSettingsCases}=await import('../src/dynamic-list-settings-cases.mjs');
  const exclusions=['rust/declarations/probes/dynamic-list-settings-working.generated.yaml',
    'rust/declarations/common/dynamic-list-settings-family.generated.yaml'];
  const result=dynamicListSettingsCases(candidateCatalog({excludePaths:exclusions}).catalog);
  const full=result.cases.find(row=>row.id==='dynamic-list-owner-scalar-fixture');
  assert(full,'The real owner boundary must be exercised, not only isolated properties');
  const owner=result.modules.find(row=>row.id===full.entry);
  assert.equal(owner.yamlOrder.length,5);
  assert.equal(owner.representations.xml.attributes[0].value.qname,'form:DynamicList');
  assert.match(full.xml,/xsi:type="DynamicList"/);
  assert.match(full.yaml,/АвтоЗаполнениеДоступныхПолей: Ложь/);
  const bad=result.cases.find(row=>row.id==='dynamic-list-owner-invalid-neighbour');
  assert.equal(bad.annotation,'AutoFillAvailableFields: !xml/raw');
  assert(bad.retainedYAML.includes('ДинамическоеСчитываниеДанных: Ложь'));
  const collections=result.cases.find(row=>row.id==='dynamic-list-collections-together');
  assert(collections);
  assert.equal((collections.xml.match(/<Field\b/g)??[]).length,10);
  assert.equal((collections.xml.match(/<CalculatedField\b/g)??[]).length,1);
  assert.equal((collections.xml.match(/<Parameter\b/g)??[]).length,7);
  assert(collections.yamlDocuments[0].text.includes('ВЫБРАТЬ'));
  assert.deepEqual(result.ownerRequirements.map(row=>row.property).sort(),[
    'calculatedFields','conditionalAppearance','dataParameters','fields','filter','group','order','parameters']);
  assert(result.ownerRequirements.every(row=>row.indexAddressing==='yamlPath'));

  const complete=result.cases.find(row=>row.id==='dynamic-list-complete-value');
  assert(complete,'All serializable source properties must be checked together');
  const completeOwner=result.modules.find(row=>row.id===complete.entry);
  assert.equal(completeOwner.yamlOrder.length,21);
  assert(!completeOwner.yamlOrder.includes('settingsComposer'));
  assert(completeOwner.yamlOrder.includes('currentUserSettingsKey'));
  for(const xml of ['<MainTable>','<ListSettings>','<dcsset:filter>','<dcsset:conditionalAppearance>'])
    assert(complete.xml.includes(xml),xml);
  for(const key of ['ОсновнаяТаблица: Справочник.СправочникПолный','Отбор:','Группировка:',
    'УсловноеОформление:','ПараметрыДанных:'])assert(complete.retainedYAML.includes(key),key);
  assert.equal(complete.yamlDocuments[0].text,collections.yamlDocuments[0].text);
  const common=result.modules.find(row=>row.id==='common.dynamic-list');
  assert(common,'The complete value must be available under the ordinary common name');
  assert.equal(common.kind,'value');
  assert.equal(common.yamlOrder.length,21);
  assert.equal(common.representations.xml.attributes[0].value.qname,'form:DynamicList');
  const {mapProperty}=await import('../src/mappings.mjs');
  const sourceAttribute=JSON.parse((await import('node:fs')).readFileSync('tests/migration/rules-extraction.json'))
    .entries.find(row=>row.symbol==='FormAttributeRules');
  const property=sourceAttribute.properties.find(row=>row.name==='dynamicList');
  const mapped=mapProperty(property,new Map([...candidateCatalog().catalog,...result.modules.map(row=>[row.id,row])]),
    {form:'http://v8.1c.ru/8.3/xcf/logform'});
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.dynamic-list');
  assert.deepEqual(mapped.type.bind.parentName,{input:'parentName'});
  const ownedEdits=result.cases.filter(row=>row.id.startsWith('dynamic-list-common-owner'));
  assert(ownedEdits.filter(row=>!row.annotation).every(row=>row.reverseYAML?.startsWith('ДинамическийСписок:\n')), 'Real owner exports need the independent full e2e YAML');
  assert.equal(ownedEdits.find(row=>row.annotation).reverseYAML, undefined, 'Invalid XML must not reuse the ordinary export oracle');
  assert.equal(ownedEdits.length,3);
  assert(ownedEdits.every(row=>row.yamlEdits?.length===(row.id.endsWith('-minimum')?1:9)), 'Owner contracts must check edited YAML with independent XML expectations');
  assert.deepEqual(ownedEdits.find(row=>row.id==='dynamic-list-common-owner').yamlEdits.filter(edit=>edit.property).map(edit=>edit.property).sort(), result.ownerRequirements.map(row=>row.property).sort());
  assert.deepEqual(ownedEdits.find(row=>row.id==='dynamic-list-common-owner').yamlEdits.at(-1).xml,
    [{from:'<AutoFillAvailableFields>false</AutoFillAvailableFields>',to:'',count:1}]);
  assert(result.cases.some(row=>row.id==='dynamic-list-complete-value-minimum'));
  assert(result.cases.some(row=>row.id==='dynamic-list-complete-value-invalid-neighbour'));
  const fresh=candidateCatalog({excludePaths:exclusions}).catalog;
  const isolated=new Map([...fresh,...result.modules.map(row=>[row.id,row])]);
  assert.doesNotThrow(()=>dependencyFiles(result.modules,isolated),
    'A source projection must publish generated dependencies independently of its mutable input catalog');
  const derived=result.modules.filter(row=>row.id.startsWith('candidate.dcs-settings-parameter-value-collection.'));
  assert.equal(derived.length,1);
  assert(!Object.hasOwn(derived[0].namespaces,'form'),'Owner placement must not rewrite a shared value');
  const {sourceProjection}=await import('../src/source-projection.mjs');
  const source=JSON.parse((await import('node:fs')).readFileSync('tests/migration/rules-extraction.json'))
    .entries.find(row=>row.symbol==='DynamicListRules');
  const originalIds=[...fresh.keys()];
  for(const suffix of ['first','second']) {
    const projected=sourceProjection(source,fresh,{properties:['dataParameters'],
      id:'working.independent-parameter-owner-'+suffix,root:'Settings',
      namespaces:{...completeOwner.namespaces,
        dcscor:'http://v8.1c.ru/8.1/data-composition-system/core',
        dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings'},
      defaultXmlNamespace:'form',deferOwnerContributions:true});
    assert(projected.modules.some(row=>row.id===derived[0].id),
      'Every independent projection must carry its generated common dependencies');
    assert.deepEqual([...fresh.keys()],originalIds,'The input catalog must remain unchanged');
  }

});
