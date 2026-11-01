import {readFileSync} from 'node:fs';
import {declaredSettingsParameterCollection} from './dcs-value-profile.mjs';
import {dcsProductionFactSources} from './declaration-fact-fixtures.mjs';
import {checkSnapshot} from './source-snapshot.mjs';
import {yaml} from './candidate-catalog.mjs';

// Expectations from the immutable collection fixture and existing import tests.
// The collection declaration is selected; its conversion logic stays in YAML.
export function settingsParameterCases(catalog) {
  const base='packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/';
  const namespaces='xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web"';
  const wrap=text=>text.replace('<dcsset:dataParameters>',`<dcsset:dataParameters ${namespaces}>`);
  const tables=[];
  const selectOwner=(rule,id)=>{
    const owner=structuredClone(catalog.get('migration.dcs-settings-parameter-value-collection'));
    owner.id=id;
    const selected=declaredSettingsParameterCollection({type:'SettingsParameterValueCollection',defaultItemRule:rule,configurationIndexAddressing:'yamlPath'},catalog);
    if(!selected)throw new Error('Unrecognized collection profile: '+rule.valueType);
    tables.push(selected.declaration);
    owner.imports.parameters=selected.declaration.id;
    for(const key of ['profiles','defaultProfile']){
      delete owner.inputs[key];delete owner.value.fields[0].type.bind[key];
    }
    return owner;
  };
  const modules=['Field','Primitive'].map(profile=>selectOwner({type:'SettingsParameterValue',valueType:profile},'migration.settings-parameters-'+profile.toLowerCase()));
  const bindings={styleTypes:'metadata.style-item-types',labels:'dcs.enumeration-labels',codes:'dcs.enumeration-codes'};
  const common={inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},factBindings:bindings,noRaw:true,
    source:[{path:base+'fromYAML.test.ts'},{path:base+'fromXML.integration.test.ts'}]};
  const cases=[
    {...common,id:'settings-field-original-fixture',entry:modules[0].id,
      xml:wrap(readFileSync(base+'__fixtures__/full.xml','utf8')),
      yaml:'ПараметрыДанных:\n  Параметр1:\n    Значение: ПараметрыДанных.Параметр1',
      source:[...common.source,{path:base+'__fixtures__/full.xml'},{path:base+'__fixtures__/data.ts'}]},
    {...common,id:'settings-field-enumeration',entry:modules[0].id,
      xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:use>false</dcscor:use><dcscor:parameter>ВидДвижения</dcscor:parameter><dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value></dcscor:item></dcsset:dataParameters>'),
      yaml:'ПараметрыДанных:\n  ВидДвижения:\n    Использовать: Ложь\n    Значение:\n      Тип: СистемноеПеречисление\n      Имя: AccumulationRecordType\n      Значение: Приход',
      adaptation:'Use the existing DCS exporter enterprise namespace; namespace alias preservation is a separate contract'},
    {...common,id:'settings-primitive-quoted-number',entry:modules[1].id,
      xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>Маска</dcscor:parameter><dcscor:value xsi:type="xs:string">123</dcscor:value></dcscor:item></dcsset:dataParameters>'),
      yaml:'ПараметрыДанных:\n  Маска:\n    Значение: \"123\"',
      reverseYAML:'ПараметрыДанных:\n  Маска: \"123\"',
      acceptedYAML:['ПараметрыДанных:\n  Маска: \"123\"','ПараметрыДанных:\n  Маска:\n    Значение: \"123\"']},
  ];
  for(const [rule,id,name,body,expected,source] of [
    [{valueType:'Font'},'settings-font-absolute','Шрифт','<dcscor:value xsi:type="v8ui:Font" faceName="Academy Engraved LET" kind="Absolute"/>',
      '    Значение:\n      ВидXML: Absolute\n      Имя: Academy Engraved LET', 'packages/rules/metadata/commonObjects/font/__fixtures__/data.ts'],
    [{valueType:'SystemEnumeration',typeSE:'HorizontalAlign'},'settings-horizontal-align','Выравнивание','<dcscor:value xsi:type="v8ui:HorizontalAlign">Center</dcscor:value>',
      '    Значение: Центр', 'packages/rules/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts'],
  ]) {
    const owner=selectOwner({type:'SettingsParameterValue',...rule},'migration.'+id);
    modules.push(owner);
    cases.push({...common,id,entry:owner.id,
      xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>'+name+'</dcscor:parameter>'+body+'</dcscor:item></dcsset:dataParameters>'),
      yaml:'ПараметрыДанных:\n  '+name+':\n'+expected,source:[...common.source,{path:source}]});
  }
  const quoted=cases.find(row=>row.id==='settings-primitive-quoted-number');
  cases.push({...quoted,id:'settings-primitive-number',
    xml:quoted.xml.replace('xsi:type="xs:string"','xsi:type="xs:decimal"'),
    yaml:'ПараметрыДанных:\n  Маска:\n    Значение: 123',
    reverseYAML:'ПараметрыДанных:\n  Маска: 123',
    acceptedYAML:['ПараметрыДанных:\n  Маска: 123']});
  const numeric=cases.at(-1);
  const items=[quoted,numeric].map((row,index)=>row.xml.match(/<dcscor:item[\s\S]*?<\/dcscor:item>/)[0].replace('>Маска<',index===0?'>Строка<':'>Число<'));
  cases.push({...quoted,id:'settings-primitive-mixed-neighbours',
    xml:wrap('<dcsset:dataParameters>'+items.join('')+'</dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  Строка:\n    Значение: \"123\"\n  Число:\n    Значение: 123',
    reverseYAML:'ПараметрыДанных:\n  Строка: \"123\"\n  Число: 123',acceptedYAML:undefined});
  const legacy=JSON.parse(readFileSync('tests/migration/settings-parameter-legacy.json','utf8'));
  checkSnapshot(Object.fromEntries(legacy.sources.map(({path})=>[path,readFileSync(path)])),legacy.sources);
  const legacyOwners=new Map();
  for(const fixture of legacy.fixtures){
    const profile=fixture.rule.valueType.toLowerCase()+(fixture.rule.typeSE?'-'+fixture.rule.typeSE.toLowerCase():'');
    let owner=legacyOwners.get(profile);
    if(!owner){
      owner=selectOwner(fixture.rule,'migration.settings-parameters-legacy-'+profile);
      legacyOwners.set(profile,owner);modules.push(owner);
    }
    const name=fixture.rule.yaml;
    if(!name || !fixture.xml)throw new Error('Incomplete legacy parameter fixture: '+fixture.id);
    cases.push({...common,id:'settings-legacy-'+fixture.id,entry:owner.id,
      xml:wrap('<dcsset:dataParameters>'+fixture.xml+'</dcsset:dataParameters>'),
      yaml:yaml.dump({ПараметрыДанных:{[name]:fixture.yaml}},{noRefs:true}).trimEnd(),
      xmlQNamePaths:fixture.rule.valueType==='Color'?[[
        '{http://v8.1c.ru/8.1/data-composition-system/settings}dataParameters',
        '{http://v8.1c.ru/8.1/data-composition-system/core}item',
        '{http://v8.1c.ru/8.1/data-composition-system/core}value']]:[],
      source:[...legacy.sources,{path:base.replace('settingsParameterValueCollection/','parameterValue/')+'fromYAML.test.ts'}]});
  }
  const addedSource=[{path:base.replace('settingsParameterValueCollection/','parameterValue/')+'fromYAML.test.ts'}];
  cases.push({...common,id:'settings-use-only',entry:legacyOwners.get('designtimevalue').id,
    xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:use>false</dcscor:use><dcscor:parameter>Текст</dcscor:parameter></dcscor:item></dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  Текст:\n    Использовать: Ложь',source:addedSource});
  cases.push({...common,id:'settings-field-empty-string',entry:modules[0].id,
    xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:use>false</dcscor:use><dcscor:parameter>НоменклатураВключение</dcscor:parameter><dcscor:value xsi:type="xs:string"/></dcscor:item></dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  НоменклатураВключение:\n    Использовать: Ложь\n    Значение:\n      Тип: Строка\n      Значение: ""',source:addedSource});
  cases.push({...common,id:'settings-primitive-array',entry:modules[1].id,
    xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>Список</dcscor:parameter><dcscor:value xsi:type="xs:string">123</dcscor:value><dcscor:value xsi:type="xs:decimal">456</dcscor:value></dcscor:item></dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  Список:\n    Значение:\n      - "123"\n      - 456',source:addedSource});
  cases.push({...common,id:'settings-primitive-nested-array',entry:modules[1].id,
    xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>Список</dcscor:parameter><dcscor:value xsi:type="v8:FixedArray"><v8:Value xsi:type="xs:string">123</v8:Value><v8:Value xsi:type="xs:decimal">456</v8:Value></dcscor:value></dcscor:item></dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  Список:\n    Значение:\n      - ["123", 456]',
    source:[{path:'rust/declarations/common/dcs-parameter-value.yaml'},{path:'rust/declarations/common/dcs-primitive-value.generated.yaml'}]});
  // Existing settings-field and presentation contracts, through the collection.
  const presentationSource=[{path:'rust/crates/compiled-rules/tests/dcs_parameter_values.rs'},
    {path:base.replace('settingsParameterValueCollection/','parameterValue/')+'userSettingPresentationXML.test.ts'}];
  const settingsBody='<dcscor:parameter>ЦветФона</dcscor:parameter><dcscor:value xsi:type="v8ui:Color">web:Red</dcscor:value><dcsset:viewMode>Normal</dcsset:viewMode><dcsset:userSettingID>48553968-cd08-47dc-896c-8bb766f9e28f</dcsset:userSettingID>';
  for(const [id,presentation,expected] of [
    ['string','<dcsset:userSettingPresentation xsi:type="xs:string">Период с</dcsset:userSettingPresentation>','!xml/string Период с'],
    ['localized','<dcsset:userSettingPresentation xsi:type="v8:LocalStringType"><v8:item><v8:lang>ru</v8:lang><v8:content>Период с</v8:content></v8:item><v8:item><v8:lang>en</v8:lang><v8:content>Period from</v8:content></v8:item></dcsset:userSettingPresentation>','\n      ru: Период с\n      en: Period from'],
  ])cases.push({...common,id:'settings-fields-presentation-'+id,entry:legacyOwners.get('color').id,
    xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue">'+settingsBody+presentation+'</dcscor:item></dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  ЦветФона:\n    Значение: Красный\n    РежимОтображения: Обычный\n    ИдентификаторПользовательскойНастройки: 48553968-cd08-47dc-896c-8bb766f9e28f\n    ПредставлениеПользовательскойНастройки: '+expected,
    xmlQNamePaths:[['{http://v8.1c.ru/8.1/data-composition-system/settings}dataParameters','{http://v8.1c.ru/8.1/data-composition-system/core}item','{http://v8.1c.ru/8.1/data-composition-system/core}value']],source:presentationSource});
  const wrapperSource=[{path:base.replace('settingsParameterValueCollection/','parameterValue/')+'fromYAML.test.ts'},
    {path:base.replace('settingsParameterValueCollection/','parameterValue/')+'toYAML.test.ts'}];
  for(const disabled of [false,true])cases.push({...common,
    id:'settings-color-absolute'+(disabled?'-disabled':''),entry:legacyOwners.get('color').id,
    xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue">'+
      (disabled?'<dcscor:use>false</dcscor:use>':'')+'<dcscor:parameter>ЦветТекста</dcscor:parameter><dcscor:value xsi:type="v8ui:Color">#FF0000</dcscor:value></dcscor:item></dcsset:dataParameters>'),
    yaml:yaml.dump({ПараметрыДанных:{ЦветТекста:{...(disabled?{Использовать:'Ложь'}:{}),Значение:'#FF0000'}}},{noRefs:true}).trimEnd(),source:wrapperSource});
  cases.push({...common,id:'settings-name-matches-font-field',entry:legacyOwners.get('designtimevalue').id,
    xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>Имя</dcscor:parameter><dcscor:value xsi:type="xs:string">Значение</dcscor:value></dcscor:item></dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  Имя:\n    Значение: Значение',reverseYAML:'ПараметрыДанных:\n  Имя: Значение',source:wrapperSource});
  cases.push({...common,id:'settings-field-order',entry:modules[0].id,
    xml:wrap('<dcsset:dataParameters>'+[['Второй','B'],['Первый','A']].map(([name,value])=>
      '<dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>'+name+'</dcscor:parameter><dcscor:value xsi:type="dcscor:Field">'+value+'</dcscor:value></dcscor:item>').join('')+'</dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  Второй:\n    Значение: B\n  Первый:\n    Значение: A',source:common.source});
  for(const disabled of [false,true])cases.push({...common,
    id:'settings-color-auto'+(disabled?'-disabled':''),entry:legacyOwners.get('color').id,
    xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue">'+(disabled?'<dcscor:use>false</dcscor:use>':'')+'<dcscor:parameter>ЦветФона</dcscor:parameter><dcscor:value xsi:type="v8ui:Color">auto</dcscor:value></dcscor:item></dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  ЦветФона: '+(disabled?'\n    Использовать: Ложь\n    Значение: Авто':'Авто'),
    source:[...addedSource,{path:base.replace('settingsParameterValueCollection/','parameterValue/')+'toYAML.ts'}],
  });
  cases.push({...common,id:'settings-nil-with-id',entry:modules[0].id,
    xml:wrap('<dcsset:dataParameters><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>Параметр1</dcscor:parameter><dcscor:value xsi:nil="true"/><dcsset:userSettingID>21b52fc2-2b83-40f1-aa31-8dce4c9e7e9a</dcsset:userSettingID></dcscor:item></dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  Параметр1:\n    Значение: null\n    ИдентификаторПользовательскойНастройки: 21b52fc2-2b83-40f1-aa31-8dce4c9e7e9a',
    source:[{path:base+'toYAML.test.ts'},{path:base+'fromXML.integration.test.ts'}]});
  const nested=(value,children='',settings=false)=>'<dcscor:item'+(settings?' xsi:type="dcsset:SettingsParameterValue"':'')+'><dcscor:parameter>Текст</dcscor:parameter><dcscor:value xsi:type="xs:string">'+value+'</dcscor:value>'+children+'</dcscor:item>';
  cases.push({...common,id:'settings-nested-parameters',entry:legacyOwners.get('designtimevalue').id,
    xml:wrap('<dcsset:dataParameters>'+nested('Родитель',nested('Первый')+nested('Второй',nested('Внук')),true)+'</dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  Текст:\n    Значение: Родитель\n    Элементы:\n      - Значение: Первый\n      - Значение: Второй\n        Элементы:\n          - Значение: Внук',
    source:[...wrapperSource,{path:base.replace('settingsParameterValueCollection/','parameterValue/')+'fromXML.ts'}]});
  cases.push({...common,id:'settings-nested-parameter-extension',entry:legacyOwners.get('designtimevalue').id,
    xml:wrap('<dcsset:dataParameters>'+nested('Родитель',nested('Первый')+
      '<dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>Текст</dcscor:parameter><dcscor:value xsi:type="xs:string">Второй</dcscor:value>'+nested('Внук')+'<dcsset:userSettingID>21b52fc2-2b83-40f1-aa31-8dce4c9e7e9a</dcsset:userSettingID></dcscor:item>',true)+'</dcsset:dataParameters>'),
    yaml:'ПараметрыДанных:\n  Текст:\n    Значение: Родитель\n    Элементы:\n      - Значение: Первый\n      - Значение: Второй\n        ИдентификаторПользовательскойНастройки: 21b52fc2-2b83-40f1-aa31-8dce4c9e7e9a\n        Элементы:\n          - Значение: Внук',
    source:[...wrapperSource,{path:base.replace('settingsParameterValueCollection/','parameterValue/')+'toXML.ts'}]});
  return {modules:[...modules,...tables,catalog.get('metadata.style-item-type-facts')],cases,
    factSources:dcsProductionFactSources()};
}
