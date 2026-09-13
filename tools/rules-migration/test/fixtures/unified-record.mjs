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
