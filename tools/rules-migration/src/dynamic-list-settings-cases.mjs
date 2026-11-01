import {readFileSync} from 'node:fs';
import {emitCandidates} from './emit.mjs';
import {propertyContract} from './property-contract.mjs';
import {loadSources} from './source-snapshot.mjs';
import {sourceProjection} from './source-projection.mjs';
import {dynamicListCollectionComposition} from './dynamic-list-collection-composition.mjs';

export function dynamicListSettingsCases(catalog) {
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 loadSources(extraction.sourceHashes);
 const owner=extraction.entries.find(row=>row.symbol==='DynamicListRules');
 const emitted=emitCandidates([{...owner,properties:owner.properties.filter(row=>['keyFields','order'].includes(row.name))}],catalog,undefined,catalog.get('common.dcs-order').namespaces);
 const projection=emitted.entries[0].projections[0];
 if(!projection)throw new Error('DynamicList keyFields declaration is not connected');
 const local=new Map([...catalog,...emitted.modules.map(row=>[row.id,row])]);
 const module=propertyContract(projection,'keyFields',local,'Settings').module;
 const fixture='packages/rules/metadata/forms/commonObjects/dynamicList/__fixtures__/keyField.xml';
 const value=readFileSync(fixture,'utf8').match(/<KeyField>[^<]*<\/KeyField>/g);
 if(value?.length!==1)throw new Error('Changed independent keyField fixture');
 const row=(id,body,yaml)=>({id,entry:module.id,xml:`<Settings>${body}</Settings>`,yaml,noRaw:true});
 const cases=[
  {...row('dynamic-list-key-single',value[0],'ПоляКлюча: Ссылка'),source:[{path:fixture},{path:fixture.replace('keyField.xml','data.ts')},{path:owner.path}]},
  row('dynamic-list-key-many','<KeyField>Второй</KeyField><KeyField>Первый</KeyField><KeyField>Второй</KeyField>','ПоляКлюча:\n  - Второй\n  - Первый\n  - Второй'),
  row('dynamic-list-key-text','<KeyField>001</KeyField>',"ПоляКлюча: '001'"),
  row('dynamic-list-key-empty','<KeyField/>',"ПоляКлюча: ''"),
  row('dynamic-list-key-absent','',''),
  {id:'dynamic-list-key-attribute',entry:module.id,xml:'<Settings><KeyField extra="keep">Ссылка</KeyField></Settings>',annotation:'ПоляКлюча: !xml/raw',retainedYAML:['  $значение: Ссылка','      _extra: keep']},
 ];
 const order=propertyContract(emitted.entries[0].projections.find(row=>row.fields.includes('order')),'order',local,'Settings').module;
 const orderFixture=fixture.replace('keyField.xml','full.xml');
 const orderXML=readFileSync(orderFixture,'utf8').match(/<dcsset:order>[\s\S]*?<\/dcsset:order>/g);
 if(orderXML?.length!==1)throw new Error('Changed independent order fixture');
 const orderRoot=body=>`<Settings xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><ListSettings>${body}</ListSettings></Settings>`;
 const inputs={defaultLanguage:'ru',registeredLanguages:['ru','en']};
 // The approved tagged scalar choice preserves xsi:type=xs:string (spec: scalar choice tags).
 cases.push({id:'dynamic-list-order-full',entry:order.id,xml:orderRoot(orderXML[0]),
  yaml:'Порядок:\n  Элементы:\n    - Поле: Наименование\n  ПредставлениеПользовательскойНастройки: !xml/string Представление порядка',
  inputs,noRaw:true,source:[{path:orderFixture},{path:fixture.replace('keyField.xml','data.ts')},{path:owner.path}]},
  {id:'dynamic-list-order-absent',entry:order.id,xml:'<Settings/>',yaml:'',inputs,noRaw:true});
 const scalarFields=['autoFillAvailableFields','autoSaveUserSettings','customQuery','dynamicDataRead','getInvisibleFieldPresentations'];
 const scalarOwner=sourceProjection(owner,catalog,{properties:scalarFields,id:'working.dynamic-list-scalar-owner',root:'Settings',
  namespaces:{form:'http://v8.1c.ru/8.3/xcf/logform',xsi:'http://www.w3.org/2001/XMLSchema-instance'},defaultXmlNamespace:'form'});
 // Immutable XML and TS expectations are independent of the generated routes.
 const xmlFields=['AutoFillAvailableFields','ManualQuery','DynamicDataRead','AutoSaveUserSettings','GetInvisibleFieldPresentations'];
 const original=readFileSync(orderFixture,'utf8');
 const scalarXML=xmlFields.map(name=>{
  const value=original.match(new RegExp('<'+name+'>[^<]*</'+name+'>','g'));
  if(value?.length!==1)throw new Error('Changed DynamicList scalar fixture: '+name);
  return value[0];
 }).join('');
 const scalarRoot=body=>'<Settings xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="DynamicList">'+body+'</Settings>';
 const expected='АвтоЗаполнениеДоступныхПолей: Ложь\nАвтоматическоеСохранениеПользовательскихНастроек: Ложь\nДинамическоеСчитываниеДанных: Ложь\nПолучениеПредставленийДляНевидимыхПолей: Ложь';
 const evidence=[{path:orderFixture},{path:fixture.replace('keyField.xml','data.ts')},{path:owner.path}];
 cases.push({id:'dynamic-list-owner-scalar-fixture',entry:scalarOwner.value.id,xml:scalarRoot(scalarXML),yaml:expected,noRaw:true,source:evidence},
  {id:'dynamic-list-owner-reordered',entry:scalarOwner.value.id,xml:scalarRoot(scalarXML.replace('<ManualQuery>false</ManualQuery><DynamicDataRead>false</DynamicDataRead>','<DynamicDataRead>false</DynamicDataRead><ManualQuery>false</ManualQuery>')),annotation:'!xml/raw',semanticYAML:expected,source:evidence},
  {id:'dynamic-list-owner-scalar-defaults',entry:scalarOwner.value.id,xml:scalarRoot('<ManualQuery>true</ManualQuery><DynamicDataRead>true</DynamicDataRead>'),yaml:'ПроизвольныйЗапрос: Истина',noRaw:true,source:evidence},
  {id:'dynamic-list-owner-explicit-implicit',entry:scalarOwner.value.id,xml:scalarRoot(scalarXML.replaceAll('false','true')),
   annotation:'АвтоЗаполнениеДоступныхПолей: !xml/raw',retainedYAML:['ПроизвольныйЗапрос: Истина','АвтоматическоеСохранениеПользовательскихНастроек: !xml/raw','ПолучениеПредставленийДляНевидимыхПолей: !xml/raw','  $значение: Истина','  $xml: "true"'],source:evidence},
  {id:'dynamic-list-owner-invalid-neighbour',entry:scalarOwner.value.id,xml:scalarRoot(scalarXML.replace('<AutoFillAvailableFields>false','<AutoFillAvailableFields>oops')),
   annotation:'AutoFillAvailableFields: !xml/raw',retainedYAML:['ДинамическоеСчитываниеДанных: Ложь','ПолучениеПредставленийДляНевидимыхПолей: Ложь','    \"#text\": oops'],source:evidence});
 const tableGenerated=emitCandidates([{...owner,properties:owner.properties.filter(row=>row.name==='mainTable')}],catalog);
 const tableProjection=tableGenerated.entries[0].projections[0];
 const tableCatalog=new Map([...catalog,...tableGenerated.modules.map(row=>[row.id,row])]);
 if(!tableProjection)throw new Error('MainTable remains blocked');
 const table=propertyContract(tableProjection,'mainTable',tableCatalog,'Settings').module;
 const tableCases=[
  ['Catalog.Справочник1','Справочник.Справочник1'],
  ['InformationRegister.Регистр.SliceLast','РегистрСведений.Регистр.СрезПоследних'],
  ['AccumulationRegister.Остатки.BalanceAndTurnovers','РегистрНакопления.Остатки.ОстаткиИОбороты'],
  ['AccountingRegister.Хозрасчетный.RecordsWithExtDimensions','РегистрБухгалтерии.Хозрасчетный.ДвиженияССубконто'],
  ['CalculationRegister.Начисления.BaseБаза','РегистрРасчета.Начисления.БазаБаза'],
  ['BusinessProcess.Согласование.Points','БизнесПроцесс.Согласование.Точки'],
  ['Task.ЗадачаИсполнителя.TasksByExecutive','Задача.ЗадачаИсполнителя.ЗадачиПоИсполнителю'],
  ['Catalog.Товары.TabularSection.Состав','Справочник.Товары.ТабличнаяЧасть.Состав'],
  ['ExternalDataSource.Источник.Cube.Куб.DimensionTable.Измерение','ВнешнийИсточникДанных.Источник.Куб.Куб.ТаблицаИзмерения.Измерение'],
  ['Catalog.Table.TabularSection.SliceLast','Справочник.Table.ТабличнаяЧасть.SliceLast'],
 ];
 const tableEvidence=[{path:'packages/rules/metadata/commonObjects/metadataTargets/parse.test.ts'},{path:owner.path}];
 tableCases.forEach(([xml,yaml],index)=>cases.push({id:'dynamic-list-table-'+index,entry:table.id,xml:'<Settings><MainTable>'+xml+'</MainTable></Settings>',yaml:'ОсновнаяТаблица: '+yaml,noRaw:true,source:index===0?evidence:tableEvidence}));
 const tableOwner=sourceProjection(owner,catalog,{properties:['mainTable','customQuery'],id:'working.dynamic-list-table-owner',root:'Settings',
  namespaces:{form:'http://v8.1c.ru/8.3/xcf/logform',xsi:'http://www.w3.org/2001/XMLSchema-instance'},defaultXmlNamespace:'form'});
 for(const [suffix,value,annotation] of [
  ['unfinished','Catalog.Товары.TabularSection'],
  ['unknown','Catalog.Товары.Unknown.Состав'],
  ['wrong-order','Catalog.Товары.TabularSection.Состав.Cube.Куб','ОсновнаяТаблица: !xml/invalid Справочник.Товары.ТабличнаяЧасть.Состав.Куб.Куб'],
  ['after-terminal','InformationRegister.Регистр.SliceLast.TabularSection.Состав','ОсновнаяТаблица: !xml/invalid РегистрСведений.Регистр.СрезПоследних.ТабличнаяЧасть.Состав'],
  ['wrong-root','Style.Стиль','ОсновнаяТаблица: !xml/invalid Стиль.Стиль'],
  ['empty',''],
 ])cases.push({id:'dynamic-list-table-'+suffix,entry:tableOwner.value.id,
  xml:scalarRoot('<ManualQuery>true</ManualQuery><MainTable>'+value+'</MainTable>'),
  annotation:annotation??'MainTable: !xml/raw',retainedYAML:['ПроизвольныйЗапрос: Истина'],source:tableEvidence});
 cases.push({id:'dynamic-list-table-absent',entry:table.id,xml:'<Settings/>',yaml:'',noRaw:true,source:tableEvidence});
 const yamlOwner=sourceProjection(owner,catalog,{properties:['customQuery','currentUserSettingsKey'],id:'working.dynamic-list-yaml-only-owner',root:'Settings',
  namespaces:{form:'http://v8.1c.ru/8.3/xcf/logform',xsi:'http://www.w3.org/2001/XMLSchema-instance'},defaultXmlNamespace:'form'});
 const yamlOnlyXML=scalarRoot('<ManualQuery>true</ManualQuery>');
 for(const [suffix,reverseYAML] of [['absent','ПроизвольныйЗапрос: Истина'],
  ['value','ПроизвольныйЗапрос: Истина\nКлючТекущихПользовательскихНастроек: Пользователь1'],
  ['empty',"ПроизвольныйЗапрос: Истина\nКлючТекущихПользовательскихНастроек: ''"]])
  cases.push({id:'dynamic-list-yaml-only-'+suffix,entry:yamlOwner.value.id,xml:yamlOnlyXML,
   yaml:'ПроизвольныйЗапрос: Истина',reverseYAML,noRaw:true,source:[{path:owner.path}],
   adaptation:'currentUserSettingsKey belongs to YAML only: both XML directions are disabled in source rules.ts'});
 const queryOwner=sourceProjection(owner,catalog,{properties:['queryText','customQuery'],id:'working.dynamic-list-query-owner',root:'Settings',
  namespaces:{form:'http://v8.1c.ru/8.3/xcf/logform',xsi:'http://www.w3.org/2001/XMLSchema-instance'},defaultXmlNamespace:'form'});
 const formPath='e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml';
 const form=readFileSync(formPath,'utf8');
 for(const name of ['ПроизвольныйЗапрос','ПроизвольныйЗапросМинимум']) {
  const attribute=form.match(new RegExp('<Attribute name="'+name+'"[\\s\\S]*?</Attribute>'))?.[0];
  const query=attribute?.match(/<QueryText>[\s\S]*?<\/QueryText>/)?.[0];
  if(!query)throw new Error('Independent QueryText fixture changed: '+name);
  const file='e2e/fixtures/nkdk/cf/ОбщаяФорма/ДинамическийСписок/ДинамическийСписок/'+name+'.query';
  cases.push({id:'dynamic-list-query-'+name,entry:queryOwner.value.id,inputs:{parentName:name},
   xml:scalarRoot('<ManualQuery>true</ManualQuery>'+query),yaml:'ПроизвольныйЗапрос: Истина',noRaw:true,
   yamlDocuments:[{path:['ДинамическийСписок',name+'.query'],text:readFileSync(file,'utf8')}],source:[{path:formPath},{path:file},{path:owner.path}],
   adaptation:'Source QueryText subtree with its actual parent attribute name; unrelated attributes tested in other contracts'});
 }
 for(const [suffix,element,documents] of [['absent','',[]],['empty','<QueryText/>',[{path:['ДинамическийСписок','Пустой.query'],text:''}]]]) {
  cases.push({id:'dynamic-list-query-'+suffix,entry:queryOwner.value.id,inputs:{parentName:'Пустой'},
   xml:scalarRoot('<ManualQuery>true</ManualQuery>'+element),yaml:'ПроизвольныйЗапрос: Истина',noRaw:true,yamlDocuments:documents});
 }
 const combined=dynamicListCollectionComposition(owner,catalog,cases.find(row=>row.id==='dynamic-list-query-ПроизвольныйЗапрос'));
 cases.push(...combined.cases);
 const excluded=owner.properties.filter(row=>row.parameters.runtimeOnly===true);
 if(excluded.some(row=>Object.keys(row.parameters).some(key=>!['type','yaml','runtimeOnly'].includes(key))))
  throw new Error('Unreviewed DynamicList runtime-only property');
 cases.forEach(row=>row.adaptation=[row.adaptation,'Source runtime-only properties excluded from serialization: '+excluded.map(row=>row.name).join(', ')].filter(Boolean).join('; '));
 return {modules:[module,order,...scalarOwner.modules,table,...tableOwner.modules,...yamlOwner.modules,...queryOwner.modules,...combined.modules],cases,factSources:combined.factSources,ownerRequirements:combined.ownerRequirements};
}
