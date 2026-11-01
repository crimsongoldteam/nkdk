import {readFileSync} from 'node:fs';

// Both sides come from the unchanged e2e fixture, not the declaration under test.
export function appearanceStringCases(catalog) {
  const xmlPath='e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml';
  const yamlPath='e2e/fixtures/nkdk/cf/ОбщаяФорма/УсловноеОформление/Свойства.yaml';
  const xml=readFileSync(xmlPath,'utf8');
  const namespaces=[...xml.match(/<Form\b([^>]*)>/)[1].matchAll(/\bxmlns:[\w.-]+="[^"]*"/g)].map(match=>match[0]).join(' ');
  const items=[...xml.matchAll(/<dcscor:parameter>(?:Текст|Формат)<\/dcscor:parameter>\s*(<dcscor:value\b[^>]*>[\s\S]*?<\/dcscor:value>)/g)];
  const rows=readFileSync(yamlPath,'utf8').match(/^          (?:Текст|Формат):\n(?:^ {12}.*\n?)*/gm)??[];
  if(items.length!==5 || rows.length!==5)throw new Error('Changed appearance string fixture');
  const owner={format:'nkdk-declarations/1',kind:'object',id:'migration.appearance-string-value',
    namespaces:{dcscor:'http://v8.1c.ru/8.1/data-composition-system/core'},
    imports:{value:'common.dcs-appearance-string-value'},
    inputs:catalog.get('common.dcs-appearance-string-value').inputs,
    value:{kind:'record',fields:[{name:'value',type:{use:'value',bind:{defaultLanguage:{input:'defaultLanguage'},registeredLanguages:{input:'registeredLanguages'}}}}]},
    representations:{xml:{kind:'record',fields:[{field:'value',path:['dcscor:value']}]},yaml:{kind:'mapping',fields:[{field:'value',key:'Строка'}]}}};
  const cases=items.map((item,index)=>({
    id:`appearance-string-${index}`,entry:owner.id,
    xml:item[1].replace('<dcscor:value ',`<dcscor:value ${namespaces} `),
    yaml:'Строка:\n'+rows[index].trimEnd().split('\n').slice(1).map(line=>line.slice(10)).join('\n'),
    inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},
    source:[{path:xmlPath},{path:yamlPath}],noRaw:true,
  }));
  const contractPath='packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.integration.test.ts';
  for(const [id,text,expected] of [['plain','Строка','Строка'],['empty-plain','',"''"]]) {
    cases.push({...cases[0],id:`appearance-string-${id}`,xml:`<dcscor:value ${namespaces} xsi:type="xs:string">${text}</dcscor:value>`,
      yaml:`Строка: ${expected}`,source:[{path:contractPath}],noRaw:true});
  }
  for(const [id,type,body,expected] of [
    ['empty-localized','v8:LocalStringType','',"Строка:\n  Значение: {}"],
    ['empty-formatted','v8:LocalFormattedStringType','<v8:lws/><v8:formatted>true</v8:formatted>',"Строка:\n  Тип: ФорматированнаяСтрока\n  Значение: {}"],
  ]) cases.push({...cases[0],id:`appearance-string-${id}`,xml:`<dcscor:value ${namespaces} xsi:type="${type}">${body}</dcscor:value>`,
    yaml:expected,source:[{path:contractPath}],noRaw:true});
  for(const [id,type,body] of [
    ['empty-formatted-missing-text','v8:LocalFormattedStringType','<v8:formatted>true</v8:formatted>'],
    ['plain-extra-attribute','xs:string','Строка'],
    ['unknown-type','xs:unknown','Строка'],
  ]) cases.push({...cases[0],id:`appearance-string-${id}`,
    xml:`<dcscor:value ${namespaces} xsi:type="${type}"${id==='plain-extra-attribute'?' extra="preserved"':''}>${body}</dcscor:value>`,
    yaml:undefined,source:[{path:contractPath}],noRaw:false,annotation:'Строка: !xml/raw'});
  const optionalOwner=structuredClone(owner);
  optionalOwner.id='migration.appearance-optional-string';
  optionalOwner.representations.xml.fields[0].path=['Envelope','dcscor:value'];
  optionalOwner.presence=[{target:{field:'value'},
    xml:{missing:{denotes:{absent:true}},empty:[{form:'nil',denotes:{absent:true}}]},
    yaml:{missing:{denotes:{absent:true}},empty:[{form:'null',denotes:{absent:true}}]}}];
  for(const [id,body,expected] of [
    ['absent','', ''],
    ['nil','<dcscor:value xsi:nil="true"/>','Строка: null'],
  ]) cases.push({...cases[0],id:`appearance-string-${id}`,entry:optionalOwner.id,
    xml:`<Envelope ${namespaces}>${body}</Envelope>`,yaml:expected,source:[{path:contractPath}],noRaw:true});
  // Compose this experiment from declared contracts, preserving the same header
  // parameters as the existing parameter record. No private Rust normalization.
  const serviceOwner=structuredClone(catalog.get('common.dcs-appearance-structured-string-value'));
  serviceOwner.id='migration.appearance-string-services';
  serviceOwner.kind='object';
  serviceOwner.namespaces={dcscor:owner.namespaces.dcscor,dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings'};
  serviceOwner.representations.xml.fields[0].path=['Row','dcscor:value'];
  const parameter=catalog.get('common.dcs-parameter-value');
  const headerNames=['use','viewMode','userSettingID','userSettingPresentation'];
  serviceOwner.imports={...serviceOwner.imports,...Object.fromEntries(Object.entries(parameter.imports).filter(([key])=>['flag','view','presentation','text'].includes(key)))};
  for(const name of headerNames) {
    const field=structuredClone(parameter.value.fields.find(field=>field.name===name));
    if(name==='use')serviceOwner.value.fields.unshift(field);
    else serviceOwner.value.fields.push(field);
    const route=structuredClone(parameter.representations.xml.content.fields.find(field=>field.field===name));
    route.path.unshift('Row');
    if(name==='use')serviceOwner.representations.xml.fields.unshift(route);
    else serviceOwner.representations.xml.fields.push(route);
    serviceOwner.representations.yaml.fields.push(structuredClone(parameter.representations.yaml.fields.find(field=>field.field===name)));
    serviceOwner.presence.push(structuredClone(parameter.presence.find(rule=>rule.target.field===name)));
  }
  const sourcePresence=serviceOwner.presence.find(rule=>rule.target.field==='source');
  sourcePresence.xml={missing:{denotes:{absent:true}},empty:[{form:'nil',denotes:{absent:true}}],canonical:[{when:{isNull:{field:'value'}},form:'nil'},{form:'ordinary'}]};
  sourcePresence.yaml.empty=[{form:'null',denotes:{absent:true}}];
  sourcePresence.yaml.missing.denotes={if:{present:{field:'value'}},then:sourcePresence.yaml.missing.denotes,else:{absent:true}};
  for(const name of ['kind','value']) {
    const rule=serviceOwner.presence.find(rule=>rule.target.field===name);
    rule.xml.missing.denotes={if:{present:{field:'source'}},then:rule.xml.missing.denotes,else:{absent:true}};
    if(name==='value')rule.yaml={missing:{denotes:{absent:true}},empty:[{form:'null',denotes:{absent:true}}],nullWhen:{isNull:{field:'source'}}};
  }
  for(const [id,body,expected] of [
    ['plain','<dcscor:value xsi:type="xs:string">Строка</dcscor:value>','Значение: Строка'],
    ['localized','<dcscor:value xsi:type="v8:LocalStringType"><v8:item><v8:lang>ru</v8:lang><v8:content>Строка</v8:content></v8:item></dcscor:value>','Значение:\n  ru: Строка'],
    ['field','<dcscor:value xsi:type="dcscor:Field">Таблица.Поле</dcscor:value>','Тип: Поле\nЗначение: Таблица.Поле'],
  ]) cases.push({...cases[0],id:`appearance-string-service-${id}`,entry:serviceOwner.id,
    xml:`<Row ${namespaces}><dcscor:use>false</dcscor:use>${body}</Row>`,
    yaml:expected+'\nИспользовать: Ложь',source:[{path:contractPath}],noRaw:true});
  const service=cases.find(item=>item.id==='appearance-string-service-plain');
  const headers='<dcsset:viewMode>Normal</dcsset:viewMode><dcsset:userSettingID>21b52fc2-2b83-40f1-aa31-8dce4c9e7e9a</dcsset:userSettingID><dcsset:userSettingPresentation xsi:type="v8:LocalStringType"><v8:item><v8:lang>ru</v8:lang><v8:content>Представление</v8:content></v8:item></dcsset:userSettingPresentation>';
  cases.push({...service,id:'appearance-string-all-services',xml:service.xml.replace('</Row>',headers+'</Row>'),
    yaml:service.yaml+'\nРежимОтображения: Обычный\nИдентификаторПользовательскойНастройки: 21b52fc2-2b83-40f1-aa31-8dce4c9e7e9a\nПредставлениеПользовательскойНастройки: Представление',
    source:[...service.source,{path:'packages/rules/metadata/systemEnumerations/types.ts'},{path:'packages/rules/metadata/commonObjects/i8nText/toYAML.ts'},{path:'packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toYAML.test.ts'}]});
  cases.push({...service,id:'appearance-string-invalid-use',xml:service.xml.replace('>false</dcscor:use>','>oops</dcscor:use>'),
    yaml:undefined,noRaw:false,retainedYAML:['Значение: Строка']});
  for(const [id,value,expected] of [
    ['absent','','Использовать: Ложь'],
    ['nil','<dcscor:value xsi:nil="true"/>','Значение: null\nИспользовать: Ложь'],
  ]) cases.push({...service,id:`appearance-string-parameter-${id}`,entry:serviceOwner.id,
    xml:service.xml.replace(/<dcscor:value[\s\S]*?<\/dcscor:value>/,value),yaml:expected});
  const formatted=cases.find(item=>item.id==='appearance-string-3');
  cases.push({...formatted,id:'appearance-string-service-formatted',entry:serviceOwner.id,
    xml:`<Row ${namespaces}><dcscor:use>false</dcscor:use>${formatted.xml}</Row>`,
    yaml:formatted.yaml.split('\n').slice(1).map(line=>line.slice(2)).join('\n')+'\nИспользовать: Ложь'});
  const nil=cases.find(item=>item.id==='appearance-string-parameter-nil');
  const allServices=cases.find(item=>item.id==='appearance-string-all-services');
  cases.push({...nil,id:'appearance-string-nil-all-services',xml:nil.xml.replace('</Row>',headers+'</Row>'),
    yaml:nil.yaml+allServices.yaml.slice(service.yaml.length),source:allServices.source});
  return {modules:[owner,optionalOwner,serviceOwner],factSources:[],cases};
}
