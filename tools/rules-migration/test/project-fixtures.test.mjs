import {execFileSync} from 'node:child_process';
import {test} from 'node:test';
import assert from 'node:assert/strict';

test('selected e2e property carries owner facts from the same XML source', () => {
  const request={
    xml:'e2e/fixtures/xml/cf/Catalogs/СправочникПолный.xml',
    propertySelector:".//{http://v8.1c.ru/8.3/xcf/readable}StandardAttribute[@name='Code']/{http://v8.1c.ru/8.3/xcf/readable}FillValue",
    root:'{http://v8.1c.ru/8.3/xcf/readable}FillValue',
    context:[
      {name:'codeType',selector:'.//{http://v8.1c.ru/8.3/MDClasses}Properties/{http://v8.1c.ru/8.3/MDClasses}CodeType'},
      {name:'codeLength',selector:'.//{http://v8.1c.ru/8.3/MDClasses}Properties/{http://v8.1c.ru/8.3/MDClasses}CodeLength'},
      {name:'owners',selector:'.//{http://v8.1c.ru/8.3/MDClasses}Properties/{http://v8.1c.ru/8.3/MDClasses}Owners/{http://v8.1c.ru/8.3/xcf/readable}Item',many:true},
    ],
  };
  const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([request]),encoding:'utf8',
  }));
  assert.deepEqual(result.context,{
    codeType:'Number',codeLength:'11',owners:['Catalog.СправочникВладелец'],
  });
});

test('nested collection fixture selects unchanged XML and its matching YAML block',()=>{
  const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства.xml',
      yaml:'e2e/fixtures/nkdk/cf/Документ/ДокументВсеСвойства/Свойства.yaml',
      xmlItems:[{type:'TabularSection',name:'ТабличнаяЧасть'}],
      yamlPath:['ТабличныеЧасти','ТабличнаяЧасть'],
      collection:{item:'Attribute',yaml:'Реквизиты',preserveNamespace:true}}]),encoding:'utf8'}));
  assert(result.xml.includes('РеквизитТабличнойЧасти'));
  assert(result.xml.includes('xmlns:xs="http://www.w3.org/2001/XMLSchema"'));
  assert(result.yaml.startsWith('Реквизиты:\n'));
  assert(result.yaml.includes('РеквизитТабличнойЧасти:'));
});

test('nested generated types keep their owning tabular section and parent name',()=>{
  const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства.xml',
      xmlItems:[{type:'TabularSection',name:'ТабличнаяЧасть'}],internalTypes:true}]),encoding:'utf8'}));
  assert.match(result.xml,/<(?:\w+:)?TabularSection\b/);
  assert(result.xml.includes('DocumentTabularSectionRow.ДокументВсеСвойства.ТабличнаяЧасть'));
  assert.equal(result.parentName,'ДокументВсеСвойства');
  assert.equal(result.name,'ТабличнаяЧасть');
});

test('whole nested item keeps the XML element and its YAML mapping',()=>{
  const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства.xml',
      yaml:'e2e/fixtures/nkdk/cf/Документ/ДокументВсеСвойства/Свойства.yaml',
      xmlItems:[{type:'TabularSection',name:'ТабличнаяЧасть'}],
      yamlPath:['ТабличныеЧасти','ТабличнаяЧасть'],wholeItem:true}]),encoding:'utf8'}));
  assert.match(result.xml,/<(?:\w+:)?TabularSection\b/);
  assert(result.xml.includes('РеквизитТабличнойЧасти'));
  assert(result.yaml.startsWith('ДлинаНомераСтроки: 9\n'));
  assert(result.yaml.includes('Реквизиты:\n'));
  const [extension]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([{xml:'e2e/fixtures/xml/cfe/all-extension/Catalogs/СправочникПолный.xml',
      yaml:'e2e/fixtures/nkdk/cfe/Расширение_All/Справочник/СправочникПолный/Свойства.yaml',
      xmlItems:[{type:'Attribute',name:'СтроковыйРеквизитСИндексом'}],
      yamlPath:['Реквизиты','СтроковыйРеквизитСИндексом'],wholeItem:true,ownerContext:true}]),encoding:'utf8'}));
  assert.deepEqual(extension.ownerContext,{
    objectBelonging:'Adopted',baseIdentity:'301fda37-ce86-4a9a-a764-f914a74e0188',
    history:[{Property:'Type',State:'MultiState'}],
  });
  assert(extension.yaml.includes('!изменять Булево'));
  assert.match(extension.xml,/<(?:\w+:)?ExtendedConfigurationObject>301fda37/);
  assert.equal(result.ownerContext,undefined);
});

test('nested property projection keeps a filled standard-attribute list',()=>{
  const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Catalogs/СправочникВладелец.xml',
      yaml:'e2e/fixtures/nkdk/cf/Справочник/СправочникВладелец/Свойства.yaml',
      xmlItems:[{type:'TabularSection',name:'ТабличнаяЧастьПолный'}],
      yamlPath:['ТабличныеЧасти','ТабличнаяЧастьПолный'],
      ownerFields:{properties:[{xml:'StandardAttributes',yaml:'СтандартныеРеквизиты'}]}}]),encoding:'utf8'}));
  assert(result.xml.includes('StandardAttribute name="LineNumber"'));
  assert(result.yaml.includes('НомерСтроки:\n'));
  assert(result.yaml.includes('Синоним: Номер'));
});

test('owner projection keeps required fields and skips declared optional XML omissions',()=>{
  const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Enums/ПеречислениеВсеСвойства.xml',
      yaml:'e2e/fixtures/nkdk/cf/Перечисление/ПеречислениеВсеСвойства/Свойства.yaml',
      ownerFields:{properties:[{xml:'ObjectBelonging',optional:true},{xml:'Name'}]}}]),encoding:'utf8'}));
  assert.match(result.xml,/<(?:\w+:)?Name>ПеречислениеВсеСвойства<\/(?:\w+:)?Name>/);
  assert(!result.xml.includes('ObjectBelonging'));
});

test('owner projection preserves source XML order independently of requested field order',()=>{
 const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:'e2e/fixtures/xml/cfe/all-extension/Enums/ПеречислениеВсеСвойства.xml',
   yaml:'e2e/fixtures/nkdk/cfe/Расширение_All/Перечисление/ПеречислениеВсеСвойства/Свойства.yaml',
   ownerFields:{properties:[{xml:'DefaultListForm'},{xml:'ExtendedConfigurationObject'},
    {xml:'Name'}]}}]),encoding:'utf8'}));
 const positions=['Name','ExtendedConfigurationObject','DefaultListForm']
  .map(name=>new RegExp(`<(?:\\w+:)?${name}[\\s>]`).exec(result.xml)?.index??-1);
 assert(positions.every(index=>index>=0));
 assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
});

test('XML-only child names stay in the projected owner without YAML blocks',()=>{
  const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Enums/ПеречислениеВсеСвойства.xml',
      yaml:'e2e/fixtures/nkdk/cf/Перечисление/ПеречислениеВсеСвойства/Свойства.yaml',
      ownerFields:{properties:[{xml:'Name'}],collections:[
        {item:'Form',xmlOnly:true},{item:'Template',xmlOnly:true}]}}]),encoding:'utf8'}));
  assert(result.xml.includes('ФормаСписка'));
  assert(result.xml.includes('Макет'));
  assert(!result.yaml.includes('Формы:'));
 assert.deepEqual(result.ownerTemplates,['Макет']);
});

test('owner projection carries generated types from the same XML fixture',()=>{
 const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Enums/ПеречислениеВсеСвойства.xml',
   yaml:'e2e/fixtures/nkdk/cf/Перечисление/ПеречислениеВсеСвойства/Свойства.yaml',
   ownerFields:{internalInfo:true,properties:[{xml:'Name'}]}}]),encoding:'utf8'}));
 assert.equal(result.ownerInternalTypes.length,3);
 assert.equal(result.ownerInternalTypes[0].name,'EnumRef.ПеречислениеВсеСвойства');
 assert.equal(result.ownerInternalTypes[0].typeId,'97de3824-d734-4183-b984-98c48ae0a7ab');
 assert(result.xml.includes('GeneratedType'));
});

test('owner projection keeps the source XML identity envelope when requested',()=>{
 const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Enums/ПеречислениеВсеСвойства.xml',
   yaml:'e2e/fixtures/nkdk/cf/Перечисление/ПеречислениеВсеСвойства/Свойства.yaml',
   ownerFields:{identity:true,properties:[{xml:'Name'}]}}]),encoding:'utf8'}));
 assert.match(result.xml,/<(?:\w+:)?Enum uuid="ec93e916-ecd7-45c4-8e73-ea76f186183c"/);
 assert.match(result.xml,/<(?:\w+:)?MetaDataObject[^>]+version="2.20"/);
});

test('generated-type projection leaves extension property states for their own rule',()=>{
 const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:'e2e/fixtures/xml/cfe/all-extension/Enums/ПеречислениеВсеСвойства.xml',
   yaml:'e2e/fixtures/nkdk/cfe/Расширение_All/Перечисление/ПеречислениеВсеСвойства/Свойства.yaml',
   ownerFields:{internalInfo:'generatedTypes',properties:[{xml:'Name'}]}}]),encoding:'utf8'}));
 assert.equal(result.ownerInternalTypes.length,3);
 assert(result.xml.includes('GeneratedType'));
 assert(!result.xml.includes('PropertyState'));
});

test('numeric owner projections preserve state tags and reject retired expectation rewriting',()=>{
  const request={xml:'e2e/fixtures/xml/cfe/all-extension/ChartsOfAccounts/ПланСчетовВсеСвойства.xml',
    yaml:'e2e/fixtures/nkdk/cfe/Расширение_All/ПланСчетов/ПланСчетовВсеСвойства/Свойства.yaml',
    ownerFields:{properties:[{xml:'CodeLength',yaml:'ДлинаКода'}]}};
  const project=value=>JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([value]),encoding:'utf8',stdio:['pipe','pipe','pipe']}))[0];
  assert.throws(()=>project({...request,ownerFields:{properties:[{
    ...request.ownerFields.properties[0],plainNumberExpectation:true}]}}),
    /Retired plainNumberExpectation/);
  const result=project(request);
  assert.equal(result.yaml,'ДлинаКода: !изменять');
  assert.equal(result.adaptation,undefined);
  assert(!result.xml.includes('PropertyState'));
  const withStates=project({...request,ownerFields:{...request.ownerFields,propertyStates:['CodeLength']}});
  assert.equal(withStates.yaml,result.yaml);
  assert.match(withStates.xml,/<(?:\w+:)?Property>CodeLength<\/(?:\w+:)?Property>/);
  assert(!withStates.xml.includes('DescriptionLength'));
  const explicit=project({
    xml:'e2e/fixtures/xml/cfe/all-extension/Documents/ДокументВсеСвойства.xml',
    yaml:'e2e/fixtures/nkdk/cfe/Расширение_All/Документ/ДокументВсеСвойства/Свойства.yaml',
    ownerFields:{properties:[{xml:'NumberLength',yaml:'ДлинаНомера'}],propertyStates:['NumberLength']},
  });
  assert.equal(explicit.yaml,'ДлинаНомера: !изменять 11');
  assert.equal(explicit.adaptation,undefined);
  const emptySelection=project({xml:'e2e/fixtures/xml/cf/ChartsOfCharacteristicTypes/ПланВидовХарактеристикВсеСвойства.xml',
    ownerFields:{properties:[{xml:'CodeLength'}],propertyStates:['CodeLength'],omitEmptyStateProjection:true}});
  assert(!emptySelection.xml.includes('InternalInfo'),
    'Removing unrelated generated types must not invent a physically empty history container');
  const originalEmpty=project({xml:'e2e/fixtures/xml/cfe/all-extension/Bots/БотПоУмолчанию.xml',
    ownerFields:{properties:[{xml:'Name'}],propertyStates:['CodeLength'],omitEmptyStateProjection:true}});
  assert(originalEmpty.xml.includes('InternalInfo'),'An originally empty container stays present');
});


test('source projections retain explicitly declared namespaces of nested collections',()=>{
  const namespace='http://v8.1c.ru/8.3/xcf/logform';
  const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/SettingsStorages/ХранилищеНастроекВсеСвойства/Forms/ФормаСохранения/Ext/Form.xml',
      yaml:'e2e/fixtures/nkdk/cf/ХранилищеНастроек/ХранилищеНастроекВсеСвойства/Формы/ФормаСохранения/Форма.yaml',
      sourceRoot:true,root:'Form',namespace,
      fields:[{xml:'f:Parameters',namespace,yaml:'Параметры'}]}]),encoding:'utf8'}));
  assert.match(result.xml,/<(?:\w+:)?Parameter name="КлючОбъекта"/);
  assert(result.xml.includes(namespace),'Qualified descendants cannot be rewritten into the empty namespace');
  assert.equal(result.yaml,'Параметры:\n  КлючОбъекта:\n  КлючТекущихНастроек:');
});

test('qualified collection projection retains QName text bindings and comparison paths',()=>{
 const namespace='http://v8.1c.ru/8.3/xcf/logform';
 const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  encoding:'utf8',input:JSON.stringify([{
   xml:'e2e/fixtures/xml/cf/CommonForms/FormCommand/Ext/Form.xml',
   yaml:'e2e/fixtures/nkdk/cf/ХранилищеНастроек/ХранилищеНастроекВсеСвойства/Формы/ФормаСохранения/Форма.yaml',
   sourceRoot:true,root:'Form',namespace,
   fields:[{xml:'f:Parameters',namespace,qname:true,yaml:'Параметры'}],
  }]),
 }));
 assert.match(result.xml,/xmlns:xs="http:\/\/www.w3.org\/2001\/XMLSchema"/);
 assert.deepEqual(result.xmlQNamePaths,[[
  'Form',`{${namespace}}Parameters`,`{${namespace}}Parameter`,`{${namespace}}Type`,
  '{http://v8.1c.ru/8.1/data/core}Type',
 ]]);
});

test('source projection selects nested paths without copying their sibling fields',()=>{
 const namespace='http://v8.1c.ru/8.3/xcf/logform';
 const request={
  xml:'e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства/Forms/ФормаДокументаВсеСвойства/Ext/Form.xml',
  yaml:'e2e/fixtures/nkdk/cf/Документ/ДокументВсеСвойства/Формы/ФормаДокументаВсеСвойства/Форма.yaml',
  sourceRoot:true,root:'Form',namespace,
  fields:[{xml:['Attributes','ConditionalAppearance'],yaml:'УсловноеОформлениеРеквизитов'},
   {xml:'AutoTitle',yaml:'АвтоЗаголовок'}],
 };
 const project=value=>JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  encoding:'utf8',input:JSON.stringify([value]),stdio:['pipe','pipe','pipe'],
 }))[0];
 const result=project(request);
 assert.match(result.xml,/<Attributes>\s*<ConditionalAppearance>/);
 assert.match(result.xml,/>34567</);
 assert.match(result.xml,/xmlns:xs="http:\/\/www.w3.org\/2001\/XMLSchema"/);
 assert(!result.xml.includes('<Attribute '));
 assert(!result.xml.includes('<Commands>'));
 assert(result.xml.indexOf('<AutoTitle>')<result.xml.indexOf('<Attributes>'));
 assert.match(result.yaml,/УсловноеОформлениеРеквизитов:/);
 assert.match(result.yaml,/АвтоЗаголовок: Ложь/);
 const joined=project({...request,fields:[request.fields[0],
  {xml:['Attributes','Attribute','Type'],qname:true}]});
 assert.equal((joined.xml.match(/<Attributes>/g)??[]).length,1);
 assert.match(joined.xml,/<Attribute name="Объект" id="1">/);
 assert(!joined.xml.includes('<MainAttribute>'));
 assert.match(joined.xml,/xmlns:cfg="http:\/\/v8.1c.ru\/8.1\/data\/enterprise\/current-config"/);
 assert.deepEqual(joined.xmlQNamePaths,[['Form','Attributes','Attribute','Type',
  '{http://v8.1c.ru/8.1/data/core}Type']]);
 const absent=project({...request,fields:[{xml:['Attributes','DoesNotExist']}]});
 assert(!absent.xml.includes('Attributes'),'Absent nested fields must not invent an empty wrapper');
 assert.throws(()=>project({...request,fields:[{xml:['Attributes','ConditionalAppearance'],namespace:'wrong'}]}),
  /Source field namespace differs/);
 assert.throws(()=>project({...request,fields:[{xml:'Attributes'},request.fields[0]]}),/Overlapping source field paths/);
 assert.throws(()=>project({...request,fields:[request.fields[0],request.fields[0]]}),/Overlapping source field paths/);
});
