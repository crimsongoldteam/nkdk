import {execFileSync} from 'node:child_process';
import {sourceContract} from './source-contract.mjs';
import {emitCandidates} from './emit.mjs';
import {propertyContract} from './property-contract.mjs';
import {loadSources} from './source-snapshot.mjs';
import {readFileSync} from 'node:fs';
export function groupedRecordCases(catalog) {
  const text={kind:'scalar',scalar:'text'};
  const mode={format:'nkdk-declarations/1',kind:'value',id:'test.group-mode',enum:{Before:'Перед',After:'После',Override:'Вместо'}};
  const row={format:mode.format,kind:'value',id:'test.group-row',imports:{mode:mode.id},
    value:{kind:'record',fields:[{name:'key',type:text},{name:'axis',type:{use:'mode'}},{name:'payload',type:text}]},
    representations:{xml:{kind:'record',fields:[{field:'key',path:[],attribute:'name'},{field:'axis',path:[],attribute:'mode'},{field:'payload',path:['Payload']}]},
      yaml:{kind:'mapping',fields:[{field:'key',key:'Ключ'},{field:'axis',key:'Режим'},{field:'payload',key:'Значение'}]}},
    presence:[{target:{field:'axis'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}}]};
  const collection={format:mode.format,kind:'value',id:'test.group-rows',imports:{row:row.id},
    value:{kind:'sequence',item:{use:'row'}},representations:{xml:{kind:'element-sequence',path:['Entry']},
      yaml:{kind:'record-mapping',key:'key',value:'payload',groupKey:'axis'}}};
  const owner={format:mode.format,kind:'object',id:'test.group-owner',imports:{rows:collection.id},
    value:{kind:'record',fields:[{name:'rows',type:{use:'rows'}}]},
    representations:{xml:{kind:'record',fields:[{field:'rows',path:['Root','Entries']}]},yaml:{kind:'mapping',fields:[{field:'rows',key:'Записи'}]}}};
  const entry=(key,value,mode)=>`<Entry name="${key}"${mode?` mode="${mode}"`:''}><Payload>${value}</Payload></Entry>`;
  const wrap=rows=>'<Root><Entries>'+rows.join('')+'</Entries></Root>';
  const cases=[
    {id:'grouped-record-scalar-and-modes',entry:owner.id,xml:wrap([entry('Первое','a'),entry('Второе','b','Before'),entry('Второе','c','After')]),
      yaml:'Записи:\n  Первое: a\n  Второе:\n    Перед: b\n    После: c',noRaw:true,
      rejectedYAML:['Записи: {Второе: {Неизвестно: b}}','Записи: {Второе: {Перед: b, Перед: c}}','Записи: {Второе: {}}']},
    {id:'grouped-record-repeated-mode',entry:owner.id,xml:wrap([entry('Первое','a','Before'),entry('Первое','b','Before'),entry('Сосед','c')]),annotation:'Записи: !xml/raw',retainedYAML:['    Сосед: c']},
    {id:'grouped-record-conflicting-forms',entry:owner.id,xml:wrap([entry('Первое','a'),entry('Первое','b','Before'),entry('Сосед','c')]),annotation:'Записи: !xml/raw',retainedYAML:['    Сосед: c']},
    {id:'grouped-record-interleaved',entry:owner.id,xml:wrap([entry('Первое','a','Before'),entry('Сосед','c'),entry('Первое','b','After')]),annotation:'Записи: !xml/raw',retainedYAML:['    Сосед: c']},
  ];
  const bindings=catalog.get('common.event-bindings');
  if(!bindings)throw new Error('Missing event binding declaration');
  const events={format:mode.format,kind:'object',id:'test.events-owner',imports:{events:bindings.id},inputs:structuredClone(bindings.inputs),
    value:{kind:'record',fields:[{name:'events',type:{use:'events',bind:{eventNames:{input:'eventNames'}}}}]},
    representations:{xml:{kind:'record',fields:[{field:'events',path:['Events']}]},yaml:{kind:'mapping',fields:[{field:'events',key:'События'}]}},
    presence:[{target:{field:'events'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}}]};
  const inputs={eventNames:[{xml:'Click',yaml:'Нажатие'},{xml:'OnChange',yaml:'ПриИзменении'},{xml:'Opening',yaml:'ПриОткрытии'}]};
  const single='packages/rules/metadata/forms/commonObjects/event/__fixtures__/single.xml';
  cases.push({id:'event-bindings-single-fixture',entry:events.id,xml:readFileSync(single,'utf8'),yaml:'События:\n  Нажатие: РаспознаваниеДокументаНадписьНажатие',inputs,noRaw:true,source:[{path:single}]});
  const multiple='packages/rules/metadata/forms/commonObjects/event/__fixtures__/multiple.xml';
  cases.push({id:'event-bindings-multiple-fixture',entry:events.id,xml:readFileSync(multiple,'utf8'),yaml:'События:\n  ПриИзменении: ОбработкаИзменения\n  ПриОткрытии: ПроцедураОткрытия',inputs,noRaw:true,source:[{path:multiple}]});
  const event=(name,value,mode)=>`<Event name="${name}"${mode?` callType="${mode}"`:''}>${value}</Event>`;
  const eventsXML=rows=>'<Events>'+rows.join('')+'</Events>';
  cases.push({id:'event-bindings-three-modes',entry:events.id,xml:eventsXML([event('OnChange','a','Before'),event('OnChange','b','After'),event('OnChange','c','Override'),event('Click','Сосед')]),
    yaml:'События:\n  ПриИзменении:\n    Перед: a\n    После: b\n    Вместо: c\n  Нажатие: Сосед',inputs,noRaw:true});
  cases.push({id:'event-bindings-yaml-mode-order',entry:events.id,
    xml:eventsXML([event('OnChange','c','Override'),event('OnChange','b','After'),event('OnChange','a','Before')]),
    yaml:'События:\n  ПриИзменении:\n    Вместо: c\n    После: b\n    Перед: a',inputs,noRaw:true});
  cases.push({id:'event-bindings-empty-events',entry:events.id,
    xml:'<Events/>',inputs,annotation:'События: !xml/raw',retainedYAML:['  $значение: {}']});
  for(const [suffix,rows] of [
    ['duplicate',[event('OnChange','a','Before'),event('OnChange','b','Before')]],
    ['conflict',[event('OnChange','a'),event('OnChange','b','After')]],
    ['unknown-mode',[event('OnChange','a','During')]],
    ['unknown-event',[event('VendorSpecific','a')]],
    ['uuid-name',[event('047d4d09-961c-4bdc-8519-eef10674c35b','a')]],
    ['noncanonical-name',[event('onChange','a')]],
  ])cases.push({id:'event-bindings-'+suffix,entry:events.id,xml:eventsXML([...rows,event('Click','Сосед')]),inputs,annotation:'События: !xml/raw',retainedYAML:['    Нажатие: Сосед']});
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  loadSources(extraction.sourceHashes);
  const source=extraction.entries.find(row=>row.symbol==='ExtendedTooltipRules');
  const emitted=emitCandidates([{...source,properties:source.properties.filter(property=>property.type==='Events')}],catalog);
  const local=new Map([...catalog,...emitted.modules.map(module=>[module.id,module])]);
  const contract=propertyContract(emitted.entries[0].projections[0],'events',local).module;
  cases.push({id:'event-bindings-source-namespace-and-table',entry:contract.id,
    xml:readFileSync(single,'utf8').replace('<Events>','<Events xmlns="http://v8.1c.ru/8.3/xcf/logform">'),
    yaml:'События:\n  Нажатие: РаспознаваниеДокументаНадписьНажатие',noRaw:true,source:[{path:single},{path:source.path,symbol:source.symbol}]});
  const form=extraction.entries.find(row=>row.symbol==='ClientApplicationFormRules');
  const formEmission=emitCandidates([{...form,properties:form.properties.filter(property=>property.type==='Events')}],catalog);
  const formLocal=new Map([...catalog,...formEmission.modules.map(module=>[module.id,module])]);
  const formContract=sourceContract(formEmission.entries[0],'Form',formLocal,'Form');
  // A property projection does not own an empty Form file's root envelope.
  // Keep a real sibling so the test is about missing Events inside its owner.
  const absentOwner=structuredClone(events);
  absentOwner.id='test.absent-events-owner';
  absentOwner.value.fields.push({name:'note',type:text});
  absentOwner.representations.xml={kind:'record',fields:[{field:'events',path:['Root','Events']},{field:'note',path:['Root','Note']}]};
  absentOwner.representations.yaml.fields.push({field:'note',key:'Примечание'});
  cases.push({id:'event-bindings-absent-events',entry:absentOwner.id,
    xml:'<Root><Note>Сосед</Note></Root>',yaml:'Примечание: Сосед',inputs,noRaw:true});
  cases.push({id:'event-bindings-composite-owner',entry:absentOwner.id,
    xml:'<Root>'+eventsXML([event('OnChange','a','Before'),event('OnChange','b','After')])+'<Note>Сосед</Note></Root>',
    yaml:'События:\n  ПриИзменении:\n    Перед: a\n    После: b\nПримечание: Сосед',inputs,noRaw:true});
  cases.push({id:'event-bindings-composite-anomaly',entry:absentOwner.id,
    xml:'<Root>'+eventsXML([event('OnChange','a','During'),event('Click','Читаемый')])+'<Note>Сосед</Note></Root>',
    inputs,annotation:'События: !xml/raw',retainedYAML:['    Нажатие: Читаемый','Примечание: Сосед']});
  for(const [component,xmlRoot,yamlRoot] of [['cf','cf','cf'],['cfe','cfe/all-extension','cfe/Расширение_All']]) {
    const suffix=component==='cf'?'':'Ext';
    const [projected]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
      encoding:'utf8',input:JSON.stringify([{
        xml:`e2e/fixtures/xml/${xmlRoot}/Reports/ОтчетВсеСвойства${suffix}/Forms/ФормаОтчета/Ext/Form.xml`,
        yaml:`e2e/fixtures/nkdk/${yamlRoot}/Отчет/ОтчетВсеСвойства${suffix}/Формы/ФормаОтчета/Форма.yaml`,
        sourceRoot:true,root:'Form',namespace:'http://v8.1c.ru/8.3/xcf/logform',
        fields:formContract.fields.map(field=>({xml:field.xmlPath[1],namespace:field.namespace,yaml:field.yaml})),
      }]),
    }));
    cases.push({id:'event-bindings-e2e-'+component,entry:formContract.entry,...projected,noRaw:true});
  }
  return {modules:[mode,row,collection,owner,events,contract,absentOwner,...formContract.modules],cases,factSources:[]};
}
