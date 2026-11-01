import {readFileSync} from 'node:fs';
import {mapProperty} from '../../../../tools/rules-migration/src/mappings.mjs';
import {appearanceStringCases} from './cases.mjs';
import {yaml} from '../../../../tools/rules-migration/src/candidate-catalog.mjs';
import {appearanceFieldsCases} from '../../../../tools/rules-migration/src/appearance-fields-cases.mjs';

// Independent complete XML/YAML pair; this probe is not production acceptance.
export function appearanceCollectionCases(catalog) {
  const xmlPath='e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml';
  const yamlPath='e2e/fixtures/nkdk/cf/ОбщаяФорма/УсловноеОформление/Свойства.yaml';
  const xml=readFileSync(xmlPath,'utf8');
  const namespaces=[...xml.match(/<Form\b([^>]*)>/)[1].matchAll(/\bxmlns:[\w.-]+="[^"]*"/g)].map(match=>match[0]).join(' ');
  const profiles=appearanceFieldsCases(catalog);
  const table=profiles.modules.find(module=>module.id.startsWith('candidate.dcs-settings-parameter-value-collection.'));
  const production=catalog.get('common.appearance-fields');
  if(!production)throw new Error('Missing production appearance declaration');
  const index=profiles.modules.indexOf(table);
  profiles.modules[index]=production;
  profiles.modules.find(module=>module.id==='migration.appearance-field-profiles').imports.parameters=production.id;
  const collection=profiles.modules.find(module=>module.id==='migration.appearance-field-profiles');
  const whole=profiles.cases.find(item=>item.id==='appearance-profiles-together');
  const completeXML=xml.match(/<dcsset:appearance>[\s\S]*?<\/dcsset:appearance>/)?.[0];
  const completeYAML=readFileSync(yamlPath,'utf8').split('        Оформление:\n')[1]?.split('        Поля:')[0];
  if(!completeXML || !completeYAML)throw new Error('Missing complete appearance fixture');
  const cases=[...profiles.cases,{...whole,id:'appearance-complete-twelve-profiles',entry:collection.id,
    xml:completeXML.replace('<dcsset:appearance>',`<dcsset:appearance ${namespaces}>`),
    yaml:'Оформление:\n'+completeYAML.trimEnd().split('\n').map(line=>line.slice(8)).join('\n')}];
  // These scalar/expanded pairs are the existing TS appearance contract,
  // exercised through the same whole-collection declaration as all profiles.
  const contractPath='packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.integration.test.ts';
  for(const [id,use,text,yaml] of [
    ['plain','', 'Строка', '  Текст: Строка'],
    ['empty','', '', "  Текст: ''"],
    ['service','<dcscor:use>false</dcscor:use>', 'Строка', '  Текст:\n    Использовать: Ложь\n    Значение: Строка'],
  ]) cases.push({...whole,id:`appearance-unified-string-${id}`,entry:collection.id,
    xml:`<dcsset:appearance ${namespaces}><dcscor:item xsi:type="dcsset:SettingsParameterValue">${use}<dcscor:parameter>Текст</dcscor:parameter><dcscor:value xsi:type="xs:string">${text}</dcscor:value></dcscor:item></dcsset:appearance>`,
    yaml:'Оформление:\n'+yaml,noRaw:true,source:[{path:contractPath},{path:'packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts'},{path:yamlPath}]});
  {
    const selected=new Set(['empty-localized','empty-formatted','empty-formatted-missing-text','plain-extra-attribute','unknown-type','absent','nil','all-services','parameter-absent','parameter-nil','service-formatted','nil-all-services','invalid-use']);
    const order=['Использовать','Тип','Значение','РежимОтображения','ИдентификаторПользовательскойНастройки','ПредставлениеПользовательскойНастройки'];
    for(const original of appearanceStringCases(catalog).cases) {
      if(!selected.has(original.id.slice('appearance-string-'.length)))continue;
      const service=original.entry==='migration.appearance-string-services';
      const body=service?original.xml.replace(/^<Row\b[^>]*>/,'').replace(/<\/Row>$/,''):
        original.xml.match(/<dcscor:value\b[^>]*\/>|<dcscor:value\b[^>]*>[\s\S]*?<\/dcscor:value>/)?.[0]??'';
      const parameter='<dcscor:parameter>Текст</dcscor:parameter>';
      const item=body.startsWith('<dcscor:use')?body.replace(/<dcscor:use\b[^>]*>[\s\S]*?<\/dcscor:use>/,value=>value+parameter):parameter+body;
      const meaning=original.yaml===undefined?undefined:original.yaml.trim()?yaml.load(original.yaml):{};
      let row=meaning;
      if(!service) {
        row=meaning?.Строка??{};
        if(original.id==='appearance-string-nil')row={Значение:null};
      }
      if(row && typeof row==='object')row=Object.fromEntries(order.filter(key=>Object.hasOwn(row,key)).map(key=>[key,row[key]]));
      cases.push({...whole,id:`appearance-unified-${original.id.slice('appearance-string-'.length)}`,entry:collection.id,
        xml:`<dcsset:appearance ${namespaces}><dcscor:item xsi:type="dcsset:SettingsParameterValue">${item}</dcscor:item></dcsset:appearance>`,
        yaml:original.yaml===undefined?undefined:yaml.dump({Оформление:{Текст:row}},{noRefs:true}),
        noRaw:original.noRaw,annotation:undefined,retainedYAML:original.retainedYAML?.map(line=>'    '+line),source:original.source});
    }
  }
  // Retain the existing schema boundary matrix on one collection case instead
  // of repeating the primitive tests for every owner.
  const acceptance=cases.find(item=>item.id==='appearance-profiles-together');
  const wrap=value=>yaml.dump({Оформление:value},{noRefs:true});
  acceptance.acceptedYAML=[wrap({ЦветТекста:null}),wrap({ЦветТекста:{Значение:null}}),wrap({ЦветФона:{Использовать:'Ложь',Значение:'Авто'}}),wrap({Шрифт:null}),wrap({ГоризонтальноеПоложение:null}),wrap({Шрифт:{Вид:'ШрифтТекста',Размер:10}}),wrap({ЦветТекста:'Авто'}),wrap({ЦветТекста:'Синий'}),wrap({ГоризонтальноеПоложение:'Лево'})];acceptance.rejectedYAML=[];
  for(const parameter of ['ВыделятьОтрицательные','ОтметкаНезаполненного','Видимость','Доступность','ТолькоПросмотр','Отображать']) {
    acceptance.acceptedYAML.push(...['Истина','Ложь',{Значение:'Истина'},null].map(value=>wrap({[parameter]:value})));
    acceptance.rejectedYAML.push(...[1,'произвольная строка',['Истина']].map(value=>wrap({[parameter]:value})));
  }
  acceptance.rejectedYAML.push(wrap({Текст:null}),wrap({Формат:null}),wrap({НеизвестноеОформление:'Истина'}),wrap({НеизвестноеОформление:null}),wrap({ЦветТекста:'auto'}),
    wrap({Шрифт:{Вид:'ШрифтТекста',Лишнее:'x'}}),wrap({ЦветТекста:''}),wrap({ЦветФона:{Использовать:'Ложь'}}),wrap({Видимость:{Тип:'ВидСравненияКомпоновкиДанных',Значение:'Равно'}}));
  for(const parameter of ['Текст','Формат']) {
    acceptance.acceptedYAML.push(...['','Строка',{}, {Значение:{}},{Значение:{ru:'Строка'}},
      {Тип:'Поле',Значение:'Таблица.Поле'}, {Тип:'ФорматированнаяСтрока',Значение:{}},
      {Значение:null}, {Использовать:'Ложь',Значение:{ru:'Строка'}},
      {Тип:'Поле',Значение:'Таблица.Поле',Использовать:'Ложь'}].map(value=>wrap({[parameter]:value})));
    acceptance.rejectedYAML.push(...[{ru:'x'}, {Тип:'МногоязычнаяСтрока',Значение:{ru:'x'}},
      {Тип:'Поле'}, {Тип:'Поле',Значение:{ru:'x'}}, {Тип:'ФорматированнаяСтрока',Значение:'x'},
      {Форматированный:'Истина',Текст:{}}, {Значение:{ru:1}}, {Значение:'x',Лишнее:true}].map(value=>wrap({[parameter]:value})));
  }
  acceptance.validationContexts??=[];
  for(const parameter of ['Текст','Формат']) acceptance.validationContexts.push({
    inputs:{registeredLanguages:['ru','en','Тип','Значение','Форматированный']},
    yaml:wrap({[parameter]:{Значение:{Значение:'язык Значение',Тип:'язык Тип',Форматированный:'язык Форматированный'}}}),codes:[]});
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const property=extraction.entries.find(row=>row.symbol==='ConditionalAppearanceItemRules').properties.find(row=>row.type==='AppearanceFields');
  const mapped=mapProperty(property,catalog,{dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings'});
  if(mapped.status!=='candidate')throw new Error(`Missing empty collection contract: ${mapped.reason}`);
  const boundary=(mapped,id)=>{
    const owner=structuredClone(collection);
    const field=mapped.presence.target.field;
    owner.id=id;
    owner.namespaces={...owner.namespaces,...mapped.namespaces};
    owner.inputs={...owner.inputs,...mapped.inputs};
    owner.value.fields[0].name=field;
    owner.representations.xml.fields[0]={field,path:mapped.path};
    owner.representations.yaml.fields[0]={field,key:mapped.key};
    owner.presence=[mapped.presence];
    return owner;
  };
  const emptyOwner=boundary(mapped,'migration.appearance-empty-common');
  profiles.modules.push(emptyOwner);
  const source='packages/rules/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/minimal.xml';
  if(!readFileSync(source,'utf8').includes('<dcsset:appearance/>'))throw new Error('Missing immutable empty appearance fixture');
  cases.push({...whole,id:'appearance-empty-default-from-source',entry:emptyOwner.id,
    xml:`<dcsset:appearance ${namespaces}/>`,yaml:'',reverseYAML:'{}',noRaw:true,
    source:[{path:source},{path:property.source.path}]});
  const schemaProperty=extraction.entries.find(row=>row.symbol==='DataCompositionSchemaDataSetFieldRules').properties.find(row=>row.type==='AppearanceFields');
  const schemaMapped=mapProperty(schemaProperty,catalog,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'});
  if(schemaMapped.status!=='candidate')throw new Error(`Missing conditional appearance contract: ${schemaMapped.reason}`);
  const schemaOwner=boundary(schemaMapped,'migration.appearance-schema-field');
  profiles.modules.push(schemaOwner);
  const schemaSource='packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/appearance-collection.xml';
  const schemaXML=readFileSync(schemaSource,'utf8').match(/<dcssch:appearance>[\s\S]*?<\/dcssch:appearance>/)?.[0];
  if(!schemaXML)throw new Error('Missing immutable schema appearance fixture');
  const schemaNamespaces=namespaces+(namespaces.includes('xmlns:dcssch=')?'':' xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema"');
  cases.push({...whole,id:'appearance-schema-field-from-source',entry:schemaOwner.id,
    inputs:{...whole.inputs,ownerKind:'ПолеНабораДанныхСхемыКомпоновкиДанных'},
    xml:schemaXML.replace('<dcssch:appearance>',`<dcssch:appearance ${schemaNamespaces}>`),
    yaml:'Оформление:\n  Формат: ЧЦ=15; ЧДЦ=3; ЧН=0,000',noRaw:true,
    source:[{path:schemaSource},{path:'packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXMLToYAML.integration.test.ts'}]});
  const owned=catalog.get('working.dcs-schema-field-appearance');
  if(!owned)throw new Error('Missing automatically generated schema owner projection');
  profiles.modules.push(owned);
  const schemaDir='packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/';
  for(const [fixture,kind] of [['appearance-collection','ПолеНабораДанныхСхемыКомпоновкиДанных'],['folder','ПапкаПолейНабораДанныхСхемыКомпоновкиДанных'],['nested-data-set','ВложенныйНаборДанныхСхемыКомпоновкиДанных']]) {
    const path=schemaDir+'__fixtures__/'+fixture+'.xml';
    const original=readFileSync(path,'utf8');
    const attributes=original.match(/<Field\b([^>]*)>/)?.[1];
    if(attributes===undefined)throw new Error('Missing immutable Field root');
    const content=original.match(/<dcssch:appearance>[\s\S]*?<\/dcssch:appearance>/)?.[0]??'';
    const expected='Вид: '+kind+(content?'\nОформление:\n  Формат: ЧЦ=15; ЧДЦ=3; ЧН=0,000':'');
    const item={...whole,id:'appearance-kind-from-owner-'+fixture,entry:owned.id,
      xml:`<Field ${schemaNamespaces}${attributes}>${content}</Field>`,yaml:expected,noRaw:true,
      xmlQNamePaths:[],xmlQNameAttributes:[{path:['Field'],name:'xsi:type'}],
      source:[{path},{path:schemaDir+'fromXMLToYAML.integration.test.ts'}]};
    cases.push(item);
    if(content)cases.push({...item,id:'appearance-kind-from-legacy-yaml',
      reverseYAML:'Оформление:\n  Формат: ЧЦ=15; ЧДЦ=3; ЧН=0,000',
      source:[...item.source,{path:schemaDir+'fromYAMLToXML.integration.test.ts'}]});
  }
  return {modules:profiles.modules,factSources:profiles.factSources,cases};
}

// Independent expectations from existing enumeration contracts. These cases
// exercise lookups in the complete constant source, not just its preparation.
export function lexiconLookupCases(catalog) {
  const entry='migration.dcs-system-enumeration';
  const base='packages/rules/metadata/systemEnumerations/';
  const cases=[];
  const namespace='xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise"';
  for(const [name,code,label] of [['HorizontalAlign','Center','Центр'],['CheckBoxType','Switcher','Выключатель'],['RadioButtonType','RadioButtons','Переключатель']]) {
    const xml=name==='HorizontalAlign'
      ?readFileSync(base+'__fixtures__/dcs/horizontalAlign.xml','utf8').replaceAll('dcscor:value','Value')
      :`<Value xsi:type="ent:${name}">${code}</Value>`;
    cases.push({id:`constant-lexicon-${name}`,entry,xml:`<Root ${namespace}>${xml}</Root>`,
      yaml:`Значение:\n  Тип: СистемноеПеречисление\n  Имя: ${name}\n  Значение: ${label}`,noRaw:true,
      factBindings:{labels:'dcs.enumeration-labels',codes:'dcs.enumeration-codes'},
      source:[{path:base+'atomicConversion.test.ts'},{path:base+'roundTrip.integration.test.ts'},{path:base+'toDcsXML.ts'},...(name==='HorizontalAlign'?[{path:base+'__fixtures__/dcs/horizontalAlign.xml'}]:[])],
      adaptation:'Labels from atomic contracts; the DCS QName uses the existing DCS exporter namespace, not an atomic caller-supplied type attribute'});
  }
  for(const [name,code] of [['CheckBoxType','Switch'],['RadioButtonType','RadioButton']]) {
    const canonical=cases.find(item=>item.id===`constant-lexicon-${name}`);
    cases.push({...canonical,id:`constant-lexicon-${name}-alias`,
      xml:`<Root ${namespace}><Value xsi:type="ent:${name}">${code}</Value></Root>`,
      yaml:undefined,noRaw:false,annotation:'Значение: !xml/raw'});
  }
  return {modules:[catalog.get(entry)],cases};
}

// Reuse independent common expectations through the published two-property
// schema-field projection; this does not accept the entire schema-field owner.
export function workingAppearanceCases(cases) {
  const prefix='Вид: ПолеНабораДанныхСхемыКомпоновкиДанных\n';
  const path=parts=>['Field',parts[0].replace('dcsset:appearance','dcssch:appearance').replace('{http://v8.1c.ru/8.1/data-composition-system/settings}appearance','{http://v8.1c.ru/8.1/data-composition-system/schema}appearance'),...parts.slice(1)];
  const ownerYAML=text=>prefix+(text.trim()==='{}'?'':text);
  return cases.map(item=>{
    if(item.entry!=='migration.appearance-field-profiles')return item;
    const content=item.xml.replaceAll('dcsset:appearance','dcssch:appearance');
    const result={...item,id:'working-'+item.id,entry:'working.dcs-schema-field-appearance',
      xml:'<Field xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xsi:type="dcssch:DataSetFieldField">'+content+'</Field>',
      xmlQNamePaths:(item.xmlQNamePaths??[]).map(path),
      xmlQNameAttributes:[{path:['Field'],name:'xsi:type'},...(item.xmlQNameAttributes??[]).map(value=>({...value,path:path(value.path)}))]};
    for(const field of ['yaml','reverseYAML'])if(typeof item[field]==='string')result[field]=ownerYAML(item[field]);
    for(const field of ['acceptedYAML','rejectedYAML'])if(item[field])result[field]=item[field].map(ownerYAML);
    if(item.validationContexts)result.validationContexts=item.validationContexts.map(value=>({...value,yaml:ownerYAML(value.yaml)}));
    return result;
  });
}
