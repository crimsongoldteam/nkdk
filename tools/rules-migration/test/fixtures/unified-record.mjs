// One dependent record is reused at the root and twice under distinct input scopes.
const scalar = scalar => ({kind:'scalar',scalar});
const languages = {type:{kind:'sequence',item:scalar('text')}};
const inputs = {defaultLanguage:{type:scalar('text')},registeredLanguages:languages};
const record = {
  format:'nkdk-declarations/1',kind:'value',id:'test.unified.record',
  imports:{text:'common.i8n-text'},inputs,
  value:{kind:'record',fields:[
    {name:'synonym',type:{use:'text',with:{excludeIfEqualNameYAML:true},bind:{
      defaultLanguage:{input:'defaultLanguage'},registeredLanguages:{input:'registeredLanguages'},ownerName:{field:'name'},
    }}},
    {name:'name',type:scalar('text')},
  ]},
  representations:{
    xml:{kind:'record',fields:[{field:'synonym',path:['Properties','Synonym']},{field:'name',path:['Properties','Name']}]},
    yaml:{kind:'mapping',fields:[{field:'name',key:'Имя'},{field:'synonym',key:'Синоним'}]},
  },
};
const root=structuredClone(record);
root.kind='object';root.id='test.unified.root';
root.representations.xml.fields.forEach(field=>field.path.unshift('Root'));
const pair={
  format:'nkdk-declarations/1',kind:'object',id:'test.unified.pair',imports:{record:record.id},
  inputs:{registeredLanguages:languages},
  value:{kind:'record',fields:[
    {name:'first',type:{use:'record',bind:{defaultLanguage:{literal:'ru'},registeredLanguages:{input:'registeredLanguages'}}}},
    {name:'second',type:{use:'record',bind:{defaultLanguage:{literal:'en'},registeredLanguages:{input:'registeredLanguages'}}}},
  ]},
  representations:{
    xml:{kind:'record',fields:[{field:'first',path:['Root','First']},{field:'second',path:['Root','Second']}]},
    yaml:{kind:'mapping',fields:[{field:'first',key:'Первый'},{field:'second',key:'Второй'}]},
  },
};
export const declarations=[record,root,pair];
export const cases=[
  {
    id:'unified-dependency-after-value',entry:root.id,
    inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},
    xml:'<Root xmlns:v8="http://v8.1c.ru/8.1/data/core"><Properties><Synonym><v8:item><v8:lang>ru</v8:lang><v8:content>Alpha</v8:content></v8:item></Synonym><Name>Alpha</Name></Properties></Root>',
    yaml:'Имя: Alpha',
  },
  {
    id:'unified-independent-input-scopes',entry:pair.id,
    inputs:{registeredLanguages:['ru','en']},
    xml:'<Root xmlns:v8="http://v8.1c.ru/8.1/data/core"><First><Properties><Synonym><v8:item><v8:lang>ru</v8:lang><v8:content>Alpha</v8:content></v8:item></Synonym><Name>Alpha</Name></Properties></First><Second><Properties><Synonym><v8:item><v8:lang>en</v8:lang><v8:content>Beta</v8:content></v8:item></Synonym><Name>Beta</Name></Properties></Second></Root>',
    yaml:'Первый:\n  Имя: Alpha\nВторой:\n  Имя: Beta',
  },
];

cases.push({
  id:'unified-dependent-value-anomaly',entry:root.id,
  inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},
  xml:cases[0].xml.replace('<Synonym>','<Synonym extra="kept">'),
  annotation:'Синоним: !xml/raw',
});

cases.push({
  id:'unified-missing-source-field',entry:pair.id,
  inputs:{registeredLanguages:['ru','en']},
  xml:cases[1].xml.replace('<Name>Alpha</Name>',''),
  annotation:'  Name: !xml/raw',
});

const fragment=structuredClone(root);
fragment.id='test.unified.fragment';fragment.kind='fragment';
const joined={
  format:'nkdk-declarations/1',kind:'object',id:'test.unified.joined',
  imports:{fragment:fragment.id,boolean:'common.boolean'},inputs,
  compose:[{use:'fragment',bind:{defaultLanguage:{input:'defaultLanguage'},registeredLanguages:{input:'registeredLanguages'}}}],
  value:{kind:'record',fields:[{name:'enabled',type:{use:'boolean'}}]},
  representations:{
    xml:{kind:'record',fields:[{field:'enabled',path:['Root'],attribute:'enabled'}]},
    yaml:{kind:'mapping',fields:[{field:'enabled',key:'Включено'}]},
  },
};
declarations.push(fragment,joined);
cases.push({
  id:'unified-composed-ancestor-attribute',entry:joined.id,
  inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},
  xml:cases[0].xml.replace('<Root ', '<Root enabled="true" '),
  yaml:'Имя: Alpha\nВключено: Истина',
});

const list={
  format:'nkdk-declarations/1',kind:'value',id:'test.unified.list',imports:{item:record.id},inputs,
  value:{kind:'sequence',item:{use:'item',bind:{defaultLanguage:{input:'defaultLanguage'},registeredLanguages:{input:'registeredLanguages'}}}},
  representations:{xml:{kind:'element-sequence',path:['Item']},yaml:{kind:'sequence'}},
};
const listOwner={
  format:'nkdk-declarations/1',kind:'object',id:'test.unified.list-owner',imports:{list:list.id},inputs,
  value:{kind:'record',fields:[{name:'rows',type:{use:'list',bind:{defaultLanguage:{input:'defaultLanguage'},registeredLanguages:{input:'registeredLanguages'}}}}]},
  representations:{xml:{kind:'record',fields:[{field:'rows',path:['Root','Items']}]},yaml:{kind:'mapping',fields:[{field:'rows',key:'Элементы'}]}},
};
declarations.push(list,listOwner);
cases.push({
  id:'unified-dependent-record-items',entry:listOwner.id,
  inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},
  xml:'<Root xmlns:v8="http://v8.1c.ru/8.1/data/core"><Items><Item><Properties><Synonym><v8:item><v8:lang>ru</v8:lang><v8:content>Alpha</v8:content></v8:item></Synonym><Name>Alpha</Name></Properties></Item><Item><Properties><Synonym><v8:item><v8:lang>ru</v8:lang><v8:content>Beta</v8:content></v8:item></Synonym><Name>Beta</Name></Properties></Item></Items></Root>',
  yaml:'Элементы:\n  -\n    Имя: Alpha\n  -\n    Имя: Beta',
});

const keyed=structuredClone(list);keyed.id='test.unified.keyed';keyed.representations.yaml={kind:'record-mapping',key:'name'};
const keyedOwner=structuredClone(listOwner);keyedOwner.id='test.unified.keyed-owner';keyedOwner.imports.list=keyed.id;
declarations.push(keyed,keyedOwner);
cases.push({...cases.at(-1),id:'unified-dependent-record-keys',entry:keyedOwner.id,yaml:'Элементы:\n  Alpha:\n    {}\n  Beta:\n    {}'});

const contextual=structuredClone(listOwner);contextual.id='test.unified.contextual-list';
contextual.inputs={registeredLanguages:languages};
contextual.value.fields[0].type.bind.defaultLanguage={field:'language'};
contextual.value.fields.push({name:'language',type:scalar('text')});
contextual.representations.xml.fields.push({field:'language',path:['Root','Language']});
contextual.representations.yaml.fields.push({field:'language',key:'Язык'});
declarations.push(contextual);
cases.push({
  ...cases.find(value=>value.id==='unified-dependent-record-items'),
  id:'unified-collection-owner-input-after-items',entry:contextual.id,
  inputs:{registeredLanguages:['ru','en']},
  xml:cases.find(value=>value.id==='unified-dependent-record-items').xml.replace('</Root>','<Language>ru</Language></Root>'),
  yaml:'Элементы:\n  -\n    Имя: Alpha\n  -\n    Имя: Beta\nЯзык: ru',
});

const optional={
  format:'nkdk-declarations/1',kind:'value',id:'test.unified.optional-record',imports:{boolean:'common.boolean'},
  value:{kind:'record',fields:[{name:'enabled',type:{use:'boolean'}}]},
  representations:{xml:{kind:'record',fields:[{field:'enabled',path:['Enabled']}]},yaml:{kind:'mapping',fields:[{field:'enabled',key:'Enabled'}]}},
  presence:[
    {target:'self',xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}},
    {target:{field:'enabled'},xml:{missing:{denotes:{literal:false}},canonical:[{when:{not:{field:'enabled'}},form:'missing'}]},yaml:{default:{literal:false}}},
  ],
};
const optionalPair=structuredClone(pair);optionalPair.id='test.unified.optional-pair';optionalPair.imports.record=optional.id;delete optionalPair.inputs;
optionalPair.value.fields.forEach(field=>delete field.type.bind);
declarations.push(optional,optionalPair);
cases.push({id:'unified-absent-and-empty-record',entry:optionalPair.id,xml:'<Root><Second/></Root>',yaml:'Второй: {}'});

const restored=structuredClone(root);restored.id='test.unified.restored-ancestor';
restored.value.fields.unshift({name:'token',type:scalar('text')});
restored.representations.xml.fields.unshift({field:'token',path:['Root'],attribute:'token'});
restored.presence=[{target:{field:'token'},yaml:{missing:{denotes:{field:'name'}}}}];
declarations.push(restored);
cases.push({id:'unified-restored-ancestor-field',entry:restored.id,inputs:cases[0].inputs,xml:cases[0].xml.replace('<Root ','<Root token="Alpha" '),yaml:cases[0].yaml});

const checked=structuredClone(root);checked.id='test.unified.cross-field-check';
checked.imports.boolean='common.boolean';checked.value.fields.push({name:'enabled',type:{use:'boolean'}});
checked.representations.xml.fields.push({field:'enabled',path:['Root'],attribute:'enabled'});
checked.representations.yaml.fields.push({field:'enabled',key:'Включено'});
checked.constraints=[{id:'name-policy',appliesTo:['xml-import','yaml-validation'],
  assert:{or:[{not:{field:'enabled'}},{not:{eq:[{field:'name'},{literal:'blocked'}]}}]},
  diagnostic:{code:'test.name-policy',severity:'error',at:{field:'name'},message:'Reserved name'},
}];
declarations.push(checked);
cases.push({id:'unified-check-across-containers',entry:checked.id,inputs:cases[0].inputs,xml:cases[0].xml.replace('<Root ','<Root enabled="true" '),yaml:'Имя: Alpha\nВключено: Истина'});
cases.push({...cases.at(-1),id:'unified-check-across-containers-invalid',xml:cases.at(-1).xml.replaceAll('Alpha','blocked'),yaml:undefined,annotation:'Имя: !xml/invalid blocked'});

const sameHeader=structuredClone(checked);sameHeader.id='test.unified.same-header-check';
sameHeader.value.fields.push({name:'mode',type:scalar('text')});
sameHeader.representations.xml.fields.push({field:'mode',path:['Root'],attribute:'mode'});
sameHeader.representations.yaml.fields.push({field:'mode',key:'Режим'});
sameHeader.constraints=[{id:'header-policy',appliesTo:['xml-import','yaml-validation'],
  assert:{or:[{not:{field:'enabled'}},{eq:[{field:'mode'},{literal:'open'}]}]},
  diagnostic:{code:'test.header-policy',severity:'error',at:{field:'enabled'},message:'Mode must be open'},
}];
declarations.push(sameHeader);
cases.push({id:'unified-check-inside-header',entry:sameHeader.id,inputs:cases[0].inputs,xml:cases[0].xml.replace('<Root ','<Root enabled="true" mode="open" '),yaml:'Имя: Alpha\nВключено: Истина\nРежим: open'});

const localDefault=structuredClone(sameHeader);localDefault.id='test.unified.header-default';
localDefault.value.fields.push({name:'backup',type:scalar('text')});
localDefault.representations.xml.fields.push({field:'backup',path:['Root'],attribute:'backup'});
localDefault.presence=[{target:{field:'backup'},yaml:{missing:{denotes:{field:'mode'}}}}];
declarations.push(localDefault);
cases.push({...cases.at(-1),id:'unified-restore-inside-header',entry:localDefault.id,xml:cases.at(-1).xml.replace('mode="open"','mode="open" backup="open"')});

const restoredItem=structuredClone(restored);restoredItem.id='test.unified.restored-item';restoredItem.kind='value';restoredItem.representations.xml.fields.forEach(field=>field.path.shift());
const restoredList=structuredClone(keyed);restoredList.id='test.unified.restored-items';restoredList.imports.item=restoredItem.id;
const restoredOwner=structuredClone(keyedOwner);restoredOwner.id='test.unified.restored-items-owner';restoredOwner.imports.list=restoredList.id;
declarations.push(restoredItem,restoredList,restoredOwner);
const keyedCase=cases.find(value=>value.id==='unified-dependent-record-keys');
cases.push({...keyedCase,id:'unified-restored-attribute-from-key',entry:restoredOwner.id,xml:keyedCase.xml.replace('<Item>','<Item token="Alpha">').replace('<Item>','<Item token="Beta">')});

const checkedCase=cases.find(value=>value.id==='unified-check-across-containers');
cases.push({...checkedCase,id:'unified-check-unavailable-source',xml:checkedCase.xml.replace('enabled="true"','enabled="broken"'),yaml:undefined,annotation:'enabled: !xml/raw'});

const conditional=structuredClone(checked);conditional.id='test.unified.conditional-header';
conditional.representations.xml={kind:'with-attributes',attributes:[
  {name:'mode',value:{text:'active'},when:{and:[{field:'enabled'},{eq:[{input:'defaultLanguage'},{literal:'ru'}]}]}},
],content:conditional.representations.xml};
declarations.push(conditional);
cases.push({...checkedCase,id:'unified-conditional-header-present',entry:conditional.id,xml:checkedCase.xml.replace('enabled="true"','mode="active" enabled="true"')});
cases.push({...checkedCase,id:'unified-conditional-header-absent',entry:conditional.id,xml:checkedCase.xml.replace('enabled="true"','enabled="false"'),yaml:'Имя: Alpha\nВключено: Ложь'});
cases.push({...cases.find(value=>value.id==='unified-conditional-header-present'),id:'unified-conditional-header-order',xml:checkedCase.xml.replace('enabled="true"','enabled="true" mode="active"'),yaml:undefined,annotation:'!xml/raw'});
cases.push({...cases.find(value=>value.id==='unified-conditional-header-present'),id:'unified-conditional-header-damaged-source',xml:checkedCase.xml.replace('enabled="true"','mode="active" enabled="broken"'),yaml:undefined,annotation:'!xml/raw'});

const conditionalValue=structuredClone(conditional);conditionalValue.kind='value';conditionalValue.id='test.unified.conditional-value';conditionalValue.representations.xml.content.fields.forEach(field=>field.path.shift());
const conditionalPair=structuredClone(pair);conditionalPair.id='test.unified.conditional-pair';conditionalPair.imports.record=conditionalValue.id;
declarations.push(conditionalValue,conditionalPair);
cases.push({id:'unified-conditional-nested-boundary',entry:conditionalPair.id,inputs:{registeredLanguages:['ru','en']},
  xml:cases[1].xml.replace('<First>','<First mode="active" enabled="true">').replace('<Second>','<Second enabled="false">'),
  yaml:'Первый:\n  Имя: Alpha\n  Включено: Истина\nВторой:\n  Имя: Beta\n  Включено: Ложь'});
const conditionalList=structuredClone(list);conditionalList.id='test.unified.conditional-list';conditionalList.imports.item=conditionalValue.id;
const conditionalOwner=structuredClone(listOwner);conditionalOwner.id='test.unified.conditional-list-owner';conditionalOwner.imports.list=conditionalList.id;
declarations.push(conditionalList,conditionalOwner);
cases.push({...cases.find(value=>value.id==='unified-dependent-record-items'),id:'unified-conditional-item-boundary',entry:conditionalOwner.id,
  xml:cases.find(value=>value.id==='unified-dependent-record-items').xml.replace('<Item>','<Item mode="active" enabled="true">').replace('<Item>','<Item enabled="false">'),
  yaml:'Элементы:\n  -\n    Имя: Alpha\n    Включено: Истина\n  -\n    Имя: Beta\n    Включено: Ложь'});
for(const [source,id,element] of [['unified-conditional-nested-boundary','unified-nested-header-anomaly','First'],['unified-conditional-item-boundary','unified-item-header-anomaly','Item']]){
  const original=cases.find(value=>value.id===source);
  cases.push({...original,id,xml:original.xml.replace(`<${element} `,`<${element} extra="preserved" `),yaml:undefined,annotation:element==='First'?'  !xml/raw':'Элементы: !xml/raw',...(element==='First'?{retainedYAML:['    Имя: Alpha','    Включено: Истина']}:{})});
}

const otherList=structuredClone(list);otherList.id='test.unified.other-list';otherList.representations.xml.path=['Other'];
const shared={format:'nkdk-declarations/1',kind:'value',id:'test.unified.shared-wrapper',imports:{first:list.id,second:otherList.id,boolean:'common.boolean'},inputs,
  value:{kind:'record',fields:[{name:'enabled',type:{use:'boolean'}},...['first','second'].map(name=>({name,type:{use:name,bind:{defaultLanguage:{input:'defaultLanguage'},registeredLanguages:{input:'registeredLanguages'}}}}))]},
  representations:{xml:{kind:'record',fields:[{field:'enabled',path:[],attribute:'enabled'},{field:'first',path:[]},{field:'second',path:[]}]},yaml:{kind:'mapping',fields:[{field:'enabled',key:'Включено'},{field:'first',key:'Первые'},{field:'second',key:'Вторые'}]}}};
const sharedOwner=structuredClone(listOwner);sharedOwner.id='test.unified.shared-owner';sharedOwner.imports.list=shared.id;sharedOwner.representations.xml.fields[0].path=['Root','Shared'];sharedOwner.representations.yaml.fields[0].key='Общий';
declarations.push(otherList,shared,sharedOwner);
const sharedRows=cases.find(value=>value.id==='unified-dependent-record-items').xml.match(/<Item>[\s\S]*?<\/Item>/g);
cases.push({id:'unified-two-shared-collections',entry:sharedOwner.id,inputs:cases[0].inputs,
  xml:`<Root xmlns:v8="http://v8.1c.ru/8.1/data/core"><Shared enabled="true">${sharedRows[0]}${sharedRows[1].replaceAll('Item>','Other>')}</Shared></Root>`,
  yaml:'Общий:\n  Включено: Истина\n  Первые:\n    -\n      Имя: Alpha\n  Вторые:\n    -\n      Имя: Beta'});
const sharedCase=cases.find(value=>value.id==='unified-two-shared-collections');
cases.push({...sharedCase,id:'unified-shared-collection-anomaly',xml:sharedCase.xml.replace('<Item>','<Item extra="preserved">'),yaml:undefined,annotation:'  Первые: !xml/raw',retainedYAML:['  Вторые:','      Имя: Beta']});
const deepFirst=structuredClone(list);deepFirst.id='test.unified.deep-first';deepFirst.representations.xml.path.unshift('Deep');
const deepSecond=structuredClone(otherList);deepSecond.id='test.unified.deep-second';deepSecond.representations.xml.path.unshift('Deep');
const deepShared=structuredClone(shared);deepShared.id='test.unified.deep-shared';deepShared.imports.first=deepFirst.id;deepShared.imports.second=deepSecond.id;
const deepOwner=structuredClone(sharedOwner);deepOwner.id='test.unified.deep-owner';deepOwner.imports.list=deepShared.id;
declarations.push(deepFirst,deepSecond,deepShared,deepOwner);
const deepCase={...sharedCase,id:'unified-deep-shared-collections',entry:deepOwner.id,xml:sharedCase.xml.replace('enabled="true">','enabled="true"><Deep>').replace('</Shared>','</Deep></Shared>')};
cases.push(deepCase);
cases.push({...deepCase,id:'unified-deep-shared-anomaly',xml:deepCase.xml.replace('<Item>','<Item extra="preserved">'),yaml:undefined,annotation:'  Первые: !xml/raw',retainedYAML:['  Вторые:','      Имя: Beta']});
cases.push({...sharedCase,id:'unified-empty-shared-collections',xml:'<Root><Shared enabled="true"/></Root>',yaml:'Общий:\n  Включено: Истина\n  Первые: []\n  Вторые: []'});
