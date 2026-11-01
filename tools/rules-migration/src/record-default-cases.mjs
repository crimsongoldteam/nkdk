import {readFileSync} from 'node:fs';
import {literalFixture} from './test-cases.mjs';
import {yaml} from './candidate-catalog.mjs';
// Independent examples for semantic construction, not a concrete common type.
export function recordDefaultCases(catalog) {
  const text={kind:'scalar',scalar:'text'};
  const phrase={format:'nkdk-declarations/1',kind:'value',id:'test.default-phrase',
    imports:{flag:'common.boolean',number:'common.exact-decimal'},
    value:{kind:'record',fields:[{name:'token',type:text},
      {name:'enabled',type:{use:'flag'}},
      {name:'amount',type:{use:'number'}}]},
    representations:{xml:{kind:'record',fields:[{field:'token',path:[],attribute:'token'},
      {field:'enabled',path:['Enabled']},{field:'amount',path:['Amount']}]},
      yaml:{kind:'mapping',fields:[{field:'token',key:'Ключ'},
        {field:'enabled',key:'Включён'},{field:'amount',key:'Число'}]}}};
  const owner={format:'nkdk-declarations/1',kind:'object',id:'test.default-owner',
    imports:{phrase:phrase.id},inputs:{name:{type:text}},
    value:{kind:'record',fields:[{name:'value',type:{use:'phrase'}}]},
    representations:{xml:{kind:'record',fields:[{field:'value',path:['Root','Child']}]},
      yaml:{kind:'mapping',fields:[{field:'value',key:'Значение'}]}},
    presence:[{target:{field:'value'},xml:{missing:{denotes:{absent:true}}},
      yaml:{missing:{denotes:{record:{token:{input:'name'},enabled:{literal:true},amount:{literal:7}}}}}}]};
  const cases=[
    {id:'record-default-context',entry:owner.id,inputs:{name:'Parent'},
      xml:'<Root><Child token="Parent"><Enabled>true</Enabled><Amount>7</Amount></Child></Root>',
      yaml:'Значение:\n  Ключ: Parent\n  Включён: Истина\n  Число: 7',reverseYAML:'{}',noRaw:true},
    {id:'record-default-explicit-values',entry:owner.id,inputs:{name:'Parent'},
      xml:'<Root><Child token="Custom"><Enabled>false</Enabled><Amount>0</Amount></Child></Root>',
      yaml:'Значение:\n  Ключ: Custom\n  Включён: Ложь\n  Число: 0',noRaw:true},
    {id:'record-default-missing-xml',entry:owner.id,inputs:{name:'Parent'},xml:'<Root/>',
      // Existing raw::Property contract uses the physical key when there is
      // no semantic value (conversion-core/tests/raw_property.rs).
      yaml:'Child: !xml/raw\n  $xml: null'},
  ];
  const scalarAbsentOwner=structuredClone(owner);
  scalarAbsentOwner.id='test.default-scalar-absent-owner';
  scalarAbsentOwner.presence[0].yaml.missing.denotes.record.enabled={absent:true};
  cases.push({id:'record-default-scalar-absent',entry:scalarAbsentOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child token="Parent"><Amount>7</Amount></Child></Root>',
    yaml:'Значение:\n  Ключ: Parent\n  Число: 7',reverseYAML:'{}',noRaw:true});
  const nested={format:phrase.format,kind:'value',id:'test.default-nested',imports:{phrase:phrase.id},
    value:{kind:'record',fields:[{name:'node',type:{use:'phrase'}},{name:'tail',type:text}]},
    representations:{xml:{kind:'record',fields:[{field:'node',path:['Inner']},{field:'tail',path:['Tail']}]},
      yaml:{kind:'mapping',fields:[{field:'node',key:'Запись'},{field:'tail',key:'Хвост'}]}}};
  const nestedOwner=structuredClone(owner);
  nestedOwner.id='test.default-nested-owner';nestedOwner.imports.phrase=nested.id;
  nestedOwner.presence[0].yaml.missing.denotes={record:{node:owner.presence[0].yaml.missing.denotes,tail:{literal:'end'}}};
  cases.push({id:'record-default-nested-context',entry:nestedOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Inner token="Parent"><Enabled>true</Enabled><Amount>7</Amount></Inner><Tail>end</Tail></Child></Root>',
    yaml:'Значение:\n  Запись:\n    Ключ: Parent\n    Включён: Истина\n    Число: 7\n  Хвост: end',reverseYAML:'{}',noRaw:true});
  cases.push({id:'record-default-nested-explicit-values',entry:nestedOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Inner token="Custom"><Enabled>false</Enabled><Amount>0</Amount></Inner><Tail>other</Tail></Child></Root>',
    yaml:'Значение:\n  Запись:\n    Ключ: Custom\n    Включён: Ложь\n    Число: 0\n  Хвост: other',noRaw:true});
  const fragment=structuredClone(phrase);
  fragment.id='test.default-fragment';fragment.kind='fragment';
  const composed={format:phrase.format,kind:'value',id:'test.default-composed',
    imports:{fields:fragment.id},compose:[{use:'fields'}],
    value:{kind:'record',fields:[{name:'tail',type:text}]},
    representations:{xml:{kind:'record',fields:[{field:'tail',path:['Tail']}]},
      yaml:{kind:'mapping',fields:[{field:'tail',key:'Хвост'}]}}};
  const composedOwner=structuredClone(owner);
  composedOwner.id='test.default-composed-owner';composedOwner.imports.phrase=composed.id;
  composedOwner.presence[0].yaml.missing.denotes.record.tail={literal:'end'};
  cases.push({id:'record-default-composed-fragment',entry:composedOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child token="Parent"><Enabled>true</Enabled><Amount>7</Amount><Tail>end</Tail></Child></Root>',
    yaml:'Значение:\n  Ключ: Parent\n  Включён: Истина\n  Число: 7\n  Хвост: end',reverseYAML:'{}',noRaw:true});
  const conditional=structuredClone(owner);
  conditional.id='test.default-conditional-owner';
  conditional.inputs.alternate={type:{kind:'scalar',scalar:'boolean'}};
  conditional.presence[0].yaml.missing.denotes={if:{input:'alternate'},
    then:{record:{token:{literal:'Alternate'},enabled:{literal:false},amount:{literal:0}}},
    else:owner.presence[0].yaml.missing.denotes};
  cases.push({id:'record-default-conditional-true',entry:conditional.id,inputs:{name:'Parent',alternate:true},
    xml:'<Root><Child token="Alternate"><Enabled>false</Enabled><Amount>0</Amount></Child></Root>',
    yaml:'Значение:\n  Ключ: Alternate\n  Включён: Ложь\n  Число: 0',reverseYAML:'{}',noRaw:true},
    {id:'record-default-conditional-false',entry:conditional.id,inputs:{name:'Parent',alternate:false},
    xml:'<Root><Child token="Parent"><Enabled>true</Enabled><Amount>7</Amount></Child></Root>',
    yaml:'Значение:\n  Ключ: Parent\n  Включён: Истина\n  Число: 7',reverseYAML:'{}',noRaw:true});
  const collection={format:phrase.format,kind:'value',id:'test.default-records',imports:{row:nested.id},
    value:{kind:'sequence',item:{use:'row'}},
    representations:{xml:{kind:'element-sequence',path:['Item']},yaml:{kind:'sequence'}}};
  const collectionOwner=structuredClone(nestedOwner);
  collectionOwner.id='test.default-collection-owner';collectionOwner.imports.phrase=collection.id;
  collectionOwner.presence[0].yaml.missing.denotes={sequence:[nestedOwner.presence[0].yaml.missing.denotes]};
  cases.push({id:'record-default-collection-nested-row',entry:collectionOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Item><Inner token="Parent"><Enabled>true</Enabled><Amount>7</Amount></Inner><Tail>end</Tail></Item></Child></Root>',
    yaml:'Значение:\n  - Запись:\n      Ключ: Parent\n      Включён: Истина\n      Число: 7\n    Хвост: end',reverseYAML:'{}',noRaw:true});
  const projected=structuredClone(nested);
  projected.id='test.projected-nested';projected.value.fields.pop();
  projected.representations.xml.fields.pop();projected.representations.yaml={kind:'projection',field:'node'};
  const projectedOwner=structuredClone(owner);
  projectedOwner.id='test.projected-nested-owner';projectedOwner.imports.phrase=projected.id;
  projectedOwner.presence[0].yaml.missing.denotes={absent:true};
  cases.push({id:'record-default-projected-without-construction',entry:projectedOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Inner token="Custom"><Enabled>false</Enabled><Amount>0</Amount></Inner></Child></Root>',
    yaml:'Значение:\n  Ключ: Custom\n  Включён: Ложь\n  Число: 0',noRaw:true});
  const bucket={format:phrase.format,kind:'value',id:'test.default-bucket',imports:{items:collection.id},
    value:{kind:'record',fields:[{name:'items',type:{use:'items'}},{name:'caption',type:text}]},
    representations:{xml:{kind:'record',fields:[{field:'items',path:['Items']},{field:'caption',path:['Caption']}]},
      yaml:{kind:'mapping',fields:[{field:'items',key:'Записи'},{field:'caption',key:'Подпись'}]}}};
  const bucketOwner=structuredClone(owner);
  bucketOwner.id='test.default-bucket-owner';bucketOwner.imports.phrase=bucket.id;
  bucketOwner.presence[0].yaml.missing.denotes={record:{items:collectionOwner.presence[0].yaml.missing.denotes,
    caption:{literal:'caption'}}};
  cases.push({id:'record-default-collection-field',entry:bucketOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Items><Item><Inner token="Parent"><Enabled>true</Enabled><Amount>7</Amount></Inner><Tail>end</Tail></Item></Items><Caption>caption</Caption></Child></Root>',
    yaml:'Значение:\n  Записи:\n    - Запись:\n        Ключ: Parent\n        Включён: Истина\n        Число: 7\n      Хвост: end\n  Подпись: caption',reverseYAML:'{}',noRaw:true});
  const emptyBucketOwner=structuredClone(bucketOwner);
  emptyBucketOwner.id='test.default-empty-bucket-owner';
  emptyBucketOwner.presence[0].yaml.missing.denotes.record.items={sequence:[]};
  cases.push({id:'record-default-empty-collection-field',entry:emptyBucketOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Items/><Caption>caption</Caption></Child></Root>',
    yaml:'Значение:\n  Записи: []\n  Подпись: caption',reverseYAML:'{}',noRaw:true});
  const repeatedBucketOwner=structuredClone(bucketOwner);
  repeatedBucketOwner.id='test.default-repeated-bucket-owner';
  const values=repeatedBucketOwner.presence[0].yaml.missing.denotes.record.items.sequence;
  const second=structuredClone(values[0]);second.record.tail={literal:'second'};values.push(second);
  cases.push({id:'record-default-repeated-collection-field',entry:repeatedBucketOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Items><Item><Inner token="Parent"><Enabled>true</Enabled><Amount>7</Amount></Inner><Tail>end</Tail></Item><Item><Inner token="Parent"><Enabled>true</Enabled><Amount>7</Amount></Inner><Tail>second</Tail></Item></Items><Caption>caption</Caption></Child></Root>',
    yaml:'Значение:\n  Записи:\n    - Запись:\n        Ключ: Parent\n        Включён: Истина\n        Число: 7\n      Хвост: end\n    - Запись:\n        Ключ: Parent\n        Включён: Истина\n        Число: 7\n      Хвост: second\n  Подпись: caption',reverseYAML:'{}',noRaw:true});
  const firstPattern={format:phrase.format,kind:'value',id:'test.default-first-pattern',
    value:{kind:'record',fields:[{name:'word',type:text}]},representations:{
      xml:{kind:'text-pattern',parts:[{literal:'A:'},{field:'word'}]},
      yaml:{kind:'text-pattern',parts:[{literal:'A:'},{field:'word'}]}}};
  const secondPattern=structuredClone(firstPattern);
  const plainFlag={format:phrase.format,kind:'value',id:'test.default-plain-flag',
    value:{kind:'scalar',scalar:'boolean'},representations:{xml:{kind:'text',values:[
      {value:true,text:'true'},{value:false,text:'false'}]},yaml:{kind:'scalar',values:[
      {value:true,literal:'Истина'},{value:false,literal:'Ложь'}]}}};
  secondPattern.id='test.default-second-pattern';secondPattern.imports={flag:plainFlag.id};
  secondPattern.value.fields.push({name:'flag',type:{use:'flag'}});
  for(const representation of Object.values(secondPattern.representations)) {
    representation.parts[0].literal='B:';representation.parts.push({literal:'/'},{field:'flag'});
  }
  const selection={format:phrase.format,kind:'value',id:'test.default-selection',
    imports:{first:firstPattern.id,second:secondPattern.id},
    value:{kind:'choice',variants:[{name:'first',type:{use:'first'}},{name:'second',type:{use:'second'}}]},
    representations:{xml:{kind:'choice'},yaml:{kind:'choice',variants:[
      {variant:'first',form:'scalar',tag:'first'},{variant:'second',form:'scalar',tag:'second'}]}}};
  const selectedRecord={format:phrase.format,kind:'value',id:'test.default-selected-record',imports:{selected:selection.id},
    value:{kind:'record',fields:[{name:'selection',type:{use:'selected'}},{name:'note',type:text}]},
    representations:{xml:{kind:'record',fields:[{field:'selection',path:[],attribute:'selected'},{field:'note',path:['Note']}]},
      yaml:{kind:'mapping',fields:[{field:'selection',key:'Выбор'},{field:'note',key:'Примечание'}]}}};
  const selectionOwner=structuredClone(owner);
  selectionOwner.id='test.default-selection-owner';selectionOwner.imports.phrase=selectedRecord.id;
  selectionOwner.presence[0].yaml.missing.denotes={record:{selection:{variant:{name:'first',value:{record:{word:{input:'name'}}}}},note:{literal:'note'}}};
  cases.push({id:'record-default-choice-first',entry:selectionOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child selected="A:Parent"><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор: !first A:Parent\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  const secondOwner=structuredClone(selectionOwner);secondOwner.id='test.default-second-selection-owner';
  secondOwner.presence[0].yaml.missing.denotes.record.selection={variant:{name:'second',value:{record:{word:{input:'name'},flag:{literal:false}}}}};
  cases.push({id:'record-default-choice-second',entry:secondOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child selected="B:Parent/false"><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор: !second B:Parent/Ложь\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  const namedRecord=structuredClone(selectedRecord);
  namedRecord.id='test.default-xml-name-record';namedRecord.imports.selected='common.xml-name';
  const namedOwner=structuredClone(selectionOwner);
  namedOwner.id='test.default-xml-name-owner';namedOwner.imports.phrase=namedRecord.id;
  namedOwner.presence[0].yaml.missing.denotes.record.selection={variant:{name:'explicit',value:{record:{name:{input:'name'}}}}};
  cases.push({id:'record-default-common-xml-name',entry:namedOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child selected="Parent"><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор: !xml/name Parent\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  const scalarSelection=structuredClone(selection);
  scalarSelection.id='test.default-scalar-selection';scalarSelection.imports.flag=plainFlag.id;
  scalarSelection.value.variants.push({name:'flag',type:{use:'flag'}});
  scalarSelection.representations.yaml.variants.push({variant:'flag',form:'scalar',tag:'flag'});
  const scalarRecord=structuredClone(selectedRecord);
  scalarRecord.id='test.default-scalar-choice-record';scalarRecord.imports.selected=scalarSelection.id;
  const scalarOwner=structuredClone(selectionOwner);
  scalarOwner.id='test.default-scalar-choice-owner';scalarOwner.imports.phrase=scalarRecord.id;
  scalarOwner.presence[0].yaml.missing.denotes.record.selection={variant:{name:'flag',value:{literal:false}}};
  cases.push({id:'record-default-choice-primitive',entry:scalarOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child selected="false"><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор: !flag Ложь\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  const labels={type:{kind:'sequence',item:{kind:'record',fields:[{name:'internal',type:text},{name:'external',type:text}]}}};
  const table={format:phrase.format,kind:'value',id:'test.default-word-table',inputs:{labels},value:text,
    representations:{xml:{kind:'text'},yaml:{kind:'input-text-table',input:'labels',internal:'internal',external:'external'}}};
  const contextual={format:phrase.format,kind:'value',id:'test.default-contextual-pattern',imports:{word:table.id},inputs:{labels},
    value:{kind:'record',fields:[{name:'word',type:{use:'word',bind:{labels:{input:'labels'}}}}]},
    representations:{xml:{kind:'text-pattern',parts:[{literal:'p:'},{field:'word'}]},
      yaml:{kind:'text-pattern',parts:[{literal:'p:'},{field:'word'}]}}};
  const contextualRecord=structuredClone(selectedRecord);
  contextualRecord.id='test.default-contextual-record';contextualRecord.imports.selected=contextual.id;
  contextualRecord.inputs={labels};contextualRecord.value.fields[0].type.bind={labels:{input:'labels'}};
  const contextualOwner=structuredClone(owner);
  contextualOwner.id='test.default-contextual-owner';contextualOwner.imports.phrase=contextualRecord.id;
  contextualOwner.inputs.labels=labels;contextualOwner.value.fields[0].type.bind={labels:{input:'labels'}};
  contextualOwner.presence[0].yaml.missing.denotes={record:{selection:{record:{word:{literal:'Internal'}}},note:{literal:'note'}}};
  cases.push({id:'record-default-contextual-pattern',entry:contextualOwner.id,
    inputs:{name:'Parent',labels:[{internal:'Internal',external:'Внешнее'}]},
    xml:'<Root><Child selected="p:Internal"><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор: p:Внешнее\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  const namedRows=structuredClone(collection);
  namedRows.id='test.default-named-rows';namedRows.imports.row=namedRecord.id;
  const namedBucket=structuredClone(bucket);
  namedBucket.id='test.default-named-bucket';namedBucket.imports.items=namedRows.id;
  const namedBucketOwner=structuredClone(bucketOwner);
  namedBucketOwner.id='test.default-named-bucket-owner';namedBucketOwner.imports.phrase=namedBucket.id;
  namedBucketOwner.presence[0].yaml.missing.denotes.record.items={sequence:[namedOwner.presence[0].yaml.missing.denotes]};
  cases.push({id:'record-default-choice-in-collection-field',entry:namedBucketOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Items><Item selected="Parent"><Note>note</Note></Item></Items><Caption>caption</Caption></Child></Root>',
    yaml:'Значение:\n  Записи:\n    - Выбор: !xml/name Parent\n      Примечание: note\n  Подпись: caption',reverseYAML:'{}',noRaw:true});
  const compactWord={format:phrase.format,kind:'value',id:'test.default-compact-word',
    value:{kind:'record',fields:[{name:'word',type:text}]},
    representations:{xml:{kind:'text-pattern',parts:[{field:'word'}]},yaml:{kind:'text-pattern',parts:[{field:'word'}]}}};
  const compactRows={format:phrase.format,kind:'value',id:'test.default-compact-rows',imports:{row:compactWord.id},
    value:{kind:'sequence',item:{use:'row'}},representations:{xml:{kind:'text-sequence',separator:'.'},yaml:{kind:'text-sequence',separator:':'}}};
  const compactFrame={format:phrase.format,kind:'value',id:'test.default-compact-frame',imports:{tail:compactRows.id},
    value:{kind:'record',fields:[{name:'head',type:text},{name:'tail',type:{use:'tail'}}]},
    representations:{xml:{kind:'text-pattern',parts:[{field:'head'},{literal:'.'},{field:'tail'}]},
      yaml:{kind:'text-pattern',parts:[{field:'head'},{literal:':'},{field:'tail'}]}}};
  const compactOwner={format:phrase.format,kind:'object',id:'test.default-compact-owner',imports:{frame:compactFrame.id},
    value:{kind:'record',fields:[{name:'frame',type:{use:'frame'}}]},
    representations:{xml:{kind:'record',fields:[{field:'frame',path:['Root','Words']}]},
      yaml:{kind:'mapping',fields:[{field:'frame',key:'Слова'}]}}};
  cases.push({id:'record-construction-leaves-compact-text-layouts-intact',entry:compactOwner.id,
    xml:'<Root><Words>head.first.second</Words></Root>',yaml:'Слова: head:first:second',noRaw:true});
  // A semantic default must retain fields hidden by a contextual spelling.
  const optionalPattern={format:phrase.format,kind:'value',id:'test.default-optional-pattern',inputs:{parent:{type:text}},
    value:{kind:'record',fields:[{name:'parent',type:text},{name:'word',type:text}]},
    representations:{xml:{kind:'text-pattern',parts:[{field:'parent'},{literal:'.'},{field:'word'}]},
      yaml:{kind:'text-pattern',parts:[{optional:'parent',parts:[{field:'parent'},{literal:'.'}]},{field:'word'}]}},
    presence:[{target:{field:'parent'},yaml:{missing:{denotes:{input:'parent'}},
      omitWhen:{eq:[{field:'parent'},{input:'parent'}]}}}]};
  const optionalRecord=structuredClone(selectedRecord);
  optionalRecord.id='test.default-optional-record';optionalRecord.imports.selected=optionalPattern.id;
  optionalRecord.inputs=optionalPattern.inputs;optionalRecord.value.fields[0].type.bind={parent:{input:'parent'}};
  const optionalOwner=structuredClone(owner);
  optionalOwner.id='test.default-optional-owner';optionalOwner.imports.phrase=optionalRecord.id;
  optionalOwner.inputs.parent={type:text};optionalOwner.value.fields[0].type.bind={parent:{input:'parent'}};
  optionalOwner.presence[0].yaml.missing.denotes={record:{selection:{record:{parent:{input:'parent'},word:{literal:'Member'}}},note:{literal:'note'}}};
  cases.push({id:'record-default-optional-context',entry:optionalOwner.id,inputs:{name:'Unused',parent:'Parent'},
    xml:'<Root><Child selected="Parent.Member"><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор: Member\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  const externalOwner=structuredClone(optionalOwner);
  externalOwner.id='test.default-optional-external-owner';
  externalOwner.presence[0].yaml.missing.denotes.record.selection.record.parent={literal:'Other'};
  cases.push({id:'record-default-optional-external-context',entry:externalOwner.id,inputs:{name:'Unused',parent:'Parent'},
    xml:'<Root><Child selected="Other.Member"><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор: Other.Member\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  const shortenedPattern=structuredClone(optionalPattern);
  shortenedPattern.id='test.default-shortened-pattern';shortenedPattern.representations.yaml.parts=[{field:'word'}];
  delete shortenedPattern.presence[0].yaml.omitWhen;
  const shortenedRecord=structuredClone(optionalRecord);
  shortenedRecord.id='test.default-shortened-record';shortenedRecord.imports.selected=shortenedPattern.id;
  const shortenedOwner=structuredClone(optionalOwner);
  shortenedOwner.id='test.default-shortened-owner';shortenedOwner.imports.phrase=shortenedRecord.id;
  cases.push({id:'record-default-shortened-context',entry:shortenedOwner.id,inputs:{name:'Unused',parent:'Parent'},
    xml:'<Root><Child selected="Parent.Member"><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор: Member\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  const conflictingOwner=structuredClone(shortenedOwner);
  conflictingOwner.id='test.default-conflicting-shortened-owner';
  conflictingOwner.presence[0].yaml.missing.denotes.record.selection.record.parent={literal:'Other'};
  cases.push({id:'record-default-shortened-conflict-rejected',entry:conflictingOwner.id,inputs:{name:'Unused',parent:'Parent'},
    xml:'<Root><Child selected="Parent.Member"><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор: Member\n  Примечание: note',rejectedYAML:['{}'],noRaw:true});
  const optionalChoice=structuredClone(selection);
  optionalChoice.id='test.default-optional-choice';optionalChoice.imports={first:shortenedPattern.id};
  optionalChoice.value.variants.length=1;optionalChoice.representations.yaml.variants.length=1;
  optionalChoice.inputs={parent:{type:text}};
  optionalChoice.value.variants[0].type.bind={parent:{input:'parent'}};
  const optionalChoiceOwner=structuredClone(owner);
  optionalChoiceOwner.id='test.default-optional-choice-owner';optionalChoiceOwner.imports.phrase=optionalChoice.id;
  optionalChoiceOwner.inputs.parent={type:text};optionalChoiceOwner.value.fields[0].type.bind={parent:{input:'parent'}};
  optionalChoiceOwner.presence[0].yaml.missing.denotes={variant:{name:'first',value:{record:{parent:{input:'parent'},word:{literal:'Member'}}}}};
  cases.push({id:'record-default-shortened-choice-direct',entry:optionalChoiceOwner.id,inputs:{name:'Unused',parent:'Parent'},
    xml:'<Root><Child>Parent.Member</Child></Root>',yaml:'Значение: !first Member',reverseYAML:'{}',noRaw:true});
  const rawRecord={format:phrase.format,kind:'value',id:'test.default-raw-record',
    value:{kind:'record',fields:[{name:'raw',type:text}]},
    representations:{xml:{kind:'record',fields:[{field:'raw',path:[],attribute:'raw'}]},
      yaml:{kind:'mapping',fields:[{field:'raw',key:'Исходный'}]}}};
  const structuredChoice={format:phrase.format,kind:'value',id:'test.default-structured-choice',
    imports:{normal:phrase.id,raw:rawRecord.id},
    value:{kind:'choice',variants:[{name:'normal',type:{use:'normal'}},{name:'raw',type:{use:'raw'}}]},
    representations:{xml:{kind:'choice',fallback:'raw'},yaml:{kind:'choice',variants:[
      {variant:'normal',form:'mapping',key:'Включён'},{variant:'raw',form:'mapping',key:'Исходный'}]}}};
  const structuredRecord=structuredClone(selectedRecord);
  structuredRecord.id='test.default-structured-record';structuredRecord.imports.selected=structuredChoice.id;
  structuredRecord.presence=[{target:{field:'selection'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}}];
  structuredRecord.representations.xml.fields[0]={field:'selection',path:['Selected']};
  const structuredOwner=structuredClone(owner);
  structuredOwner.id='test.default-structured-owner';structuredOwner.imports.phrase=structuredRecord.id;
  structuredOwner.presence[0].yaml.missing.denotes={record:{selection:{variant:{name:'normal',value:{record:{token:{input:'name'},enabled:{literal:false},amount:{literal:7}}}}},note:{literal:'note'}}};
  cases.push({id:'record-default-structured-choice-normal',entry:structuredOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Selected token="Parent"><Enabled>false</Enabled><Amount>7</Amount></Selected><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор:\n    Ключ: Parent\n    Включён: Ложь\n    Число: 7\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  const rawOwner=structuredClone(structuredOwner);
  rawOwner.id='test.default-structured-raw-owner';
  rawOwner.presence[0].yaml.missing.denotes.record.selection={variant:{name:'raw',value:{record:{raw:{literal:'Other'}}}}};
  cases.push({id:'record-default-structured-choice-fallback',entry:rawOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Selected raw="Other"/><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор:\n    Исходный: Other\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  const absentChoiceOwner=structuredClone(structuredOwner);
  absentChoiceOwner.id='test.default-structured-absent-owner';
  absentChoiceOwner.presence[0].yaml.missing.denotes.record.selection={absent:true};
  cases.push({id:'record-default-structured-choice-absent',entry:absentChoiceOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Note>note</Note></Child></Root>',yaml:'Значение:\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  // Real common declaration with independently saved TypeScript expectations.
  const fontDataPath='packages/rules/metadata/commonObjects/font/__fixtures__/data.ts';
  const fontData=readFileSync(fontDataPath,'utf8');
  const fontMeaning=literalFixture(fontDataPath,fontData,'normalMinimalFont').data;
  const fontYAML=literalFixture(fontDataPath,fontData,'normalMinimalFontYAML').data;
  const styleTypes={type:{kind:'index',key:text,value:text}};
  const fontRecord=structuredClone(structuredRecord);
  fontRecord.id='test.default-font-record';fontRecord.imports.selected='common.font';fontRecord.inputs={styleTypes};
  fontRecord.value.fields[0].type.bind={styleTypes:{input:'styleTypes'}};
  const fontOwner=structuredClone(structuredOwner);
  fontOwner.id='test.default-font-owner';fontOwner.imports.phrase=fontRecord.id; fontOwner.inputs.styleTypes=styleTypes;
  fontOwner.value.fields[0].type.bind={styleTypes:{input:'styleTypes'}};
  const fontFields=Object.fromEntries(['reference','kind','faceName','height','scale','bold','italic','underline','strikeout']
    .map(field=>[field,fontMeaning[field]===undefined?{absent:true}:{literal:fontMeaning[field]}]));
  fontOwner.presence[0].yaml.missing.denotes.record.selection={variant:{name:'normal',value:{record:fontFields}}};
  cases.push({id:'record-default-real-font',entry:fontOwner.id,inputs:{name:'Unused'},
    xml:'<Root><Child><Selected faceName="Academy Engraved LET" kind="Absolute"/><Note>note</Note></Child></Root>',
    yaml:yaml.dump({Значение:{Выбор:fontYAML,Примечание:'note'}},{noRefs:true}),reverseYAML:'{}',noRaw:true,source:[{path:fontDataPath}]});
  const absentFontOwner=structuredClone(fontOwner);
  absentFontOwner.id='test.default-absent-font-owner';absentFontOwner.presence[0].yaml.missing.denotes.record.selection={absent:true};
  cases.push({id:'record-default-real-font-absent',entry:absentFontOwner.id,inputs:{name:'Unused'},
    xml:'<Root><Child><Note>note</Note></Child></Root>',yaml:'Значение:\n  Примечание: note',reverseYAML:'{}',noRaw:true});
  const capturedChild={format:phrase.format,kind:'value',id:'test.default-captured-child',imports:{path:shortenedPattern.id},
    inputs:{parent:{type:text}},value:{kind:'record',fields:[{name:'path',type:{use:'path',bind:{parent:{input:'parent'}}}}]},
    representations:{xml:{kind:'record',fields:[{field:'path',path:['Path']}]},yaml:{kind:'mapping',fields:[{field:'path',key:'Путь'}]}}};
  const capturedRecord={format:phrase.format,kind:'value',id:'test.default-captured-record',imports:{child:capturedChild.id},
    value:{kind:'record',fields:[{name:'head',type:text},{name:'child',type:{use:'child',bind:{parent:{field:'head'}}}}]},
    representations:{xml:{kind:'record',fields:[{field:'head',path:['Head']},{field:'child',path:['Inner']}]},
      yaml:{kind:'mapping',fields:[{field:'head',key:'Группа'},{field:'child',key:'Вложенное'}]}}};
  const capturedOwner=structuredClone(owner);
  capturedOwner.id='test.default-captured-owner';capturedOwner.imports.phrase=capturedRecord.id;
  capturedOwner.presence[0].yaml.missing.denotes={record:{head:{input:'name'},child:{record:{path:{record:{parent:{input:'name'},word:{literal:'Member'}}}}}}};
  cases.push({id:'record-default-captured-sibling-context',entry:capturedOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Head>Parent</Head><Inner><Path>Parent.Member</Path></Inner></Child></Root>',
    yaml:'Значение:\n  Группа: Parent\n  Вложенное:\n    Путь: Member',reverseYAML:'{}',noRaw:true});
  const capturedChoice=structuredClone(capturedRecord);capturedChoice.id='test.default-captured-choice';
  capturedChoice.imports.label='common.xml-name';capturedChoice.value.fields[0].type={use:'label'};
  capturedChoice.value.fields[1].type.bind.parent={get:{of:{variantValue:{value:{field:'head'},variant:'explicit'}},field:'name'}};
  capturedChoice.representations.xml.fields[0]={field:'head',path:[],attribute:'label'};
  const capturedChoiceOwner=structuredClone(capturedOwner);capturedChoiceOwner.id='test.default-captured-choice-owner';
  capturedChoiceOwner.imports.phrase=capturedChoice.id;
  capturedChoiceOwner.presence[0].yaml.missing.denotes.record.head={variant:{name:'explicit',value:{record:{name:{input:'name'}}}}};
  cases.push({id:'record-default-captured-choice-context',entry:capturedChoiceOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child label="Parent"><Inner><Path>Parent.Member</Path></Inner></Child></Root>',
    yaml:'Значение:\n  Группа: !xml/name Parent\n  Вложенное:\n    Путь: Member',reverseYAML:'{}',noRaw:true});
  const styleOwner=structuredClone(fontOwner);
  styleOwner.id='test.default-style-font-owner';
  const styleName='ЭлементСтиляШрифтВсеСвойства';
  const styleFields=styleOwner.presence[0].yaml.missing.denotes.record.selection.variant.value.record;
  styleFields.reference={variant:{name:'ЭлементСтиля',value:{record:{name:{literal:styleName}}}}};
  styleFields.kind={literal:'StyleItem'};styleFields.faceName={absent:true};
  const stylePath='e2e/fixtures/xml/cf/StyleItems/'+styleName+'.xml';
  const styleProvider=catalog.get('metadata.style-item-type-facts');
  if(!styleProvider)throw new Error('Missing accepted style index provider');
  const styleSource={id:'record-default-style-font-context',entry:styleProvider.id,
    xml:readFileSync(stylePath,'utf8'),inputs:{ownerName:styleName},source:[{path:stylePath}]};
  cases.push({id:'record-default-real-font-style-context',entry:styleOwner.id,inputs:{name:'Unused'},
    xml:'<Root xmlns:style="http://v8.1c.ru/8.1/data/ui/style"><Child><Selected ref="style:ЭлементСтиляШрифтВсеСвойства" kind="StyleItem"/><Note>note</Note></Child></Root>',
    yaml:'Значение:\n  Выбор:\n    Вид: ЭлементСтиля.ЭлементСтиляШрифтВсеСвойства\n  Примечание: note',reverseYAML:'{}',noRaw:true,
    xmlQNameAttributes:[{path:['Root','Child','Selected'],name:'ref'}],
    factBindings:{styleTypes:'metadata.style-item-types'},factSourceEntries:[styleSource.id],source:[{path:stylePath}]});
  const directStructuredOwner=structuredClone(owner);
  directStructuredOwner.id='test.default-direct-structured-owner';directStructuredOwner.imports.phrase=structuredChoice.id;
  directStructuredOwner.presence[0].yaml.missing.denotes=structuredOwner.presence[0].yaml.missing.denotes.record.selection;
  cases.push({id:'record-default-structured-choice-direct',entry:directStructuredOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child token="Parent"><Enabled>false</Enabled><Amount>7</Amount></Child></Root>',
    yaml:'Значение:\n  Ключ: Parent\n  Включён: Ложь\n  Число: 7',reverseYAML:'{}',noRaw:true});
  const emptyPhrase=structuredClone(phrase);
  emptyPhrase.id='test.default-empty-phrase';emptyPhrase.inputs={name:{type:text}};
  emptyPhrase.presence=['token','enabled','amount'].map(field=>{
    const denotes=structuredClone(owner.presence[0].yaml.missing.denotes.record[field]);
    return {target:{field},xml:{missing:{denotes:{absent:true}}},
      yaml:{missing:{denotes},omitWhen:{eq:[{field},denotes]}}};
  });
  const emptyPhraseOwner=structuredClone(owner);emptyPhraseOwner.id='test.default-empty-phrase-owner';
  emptyPhraseOwner.imports.phrase=emptyPhrase.id;emptyPhraseOwner.value.fields[0].type.bind={name:{input:'name'}};
  cases.push({id:'record-default-empty-mapping',entry:emptyPhraseOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child token="Parent"><Enabled>true</Enabled><Amount>7</Amount></Child></Root>',yaml:'',noRaw:true});
  cases.push({id:'record-default-nonempty-mapping',entry:emptyPhraseOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child token="Parent"><Enabled>false</Enabled><Amount>7</Amount></Child></Root>',
    yaml:'Значение:\n  Включён: Ложь',noRaw:true});
  cases.push({id:'record-default-empty-mapping-anomaly',entry:emptyPhraseOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child token="Parent" extra="keep"><Enabled>true</Enabled><Amount>7</Amount></Child></Root>',
    yaml:'Child: !xml/raw\n  $xml:\n    _extra: keep'});
  const emptyFragment=structuredClone(emptyPhrase);emptyFragment.id='test.default-empty-fragment';emptyFragment.kind='fragment';
  const emptyComposed=structuredClone(composed);emptyComposed.id='test.default-empty-composed';emptyComposed.imports.fields=emptyFragment.id;
  emptyComposed.inputs={name:{type:text}};emptyComposed.compose[0].bind={name:{input:'name'}};
  emptyComposed.presence=[{target:{field:'tail'},xml:{missing:{denotes:{absent:true}}},
    yaml:{missing:{denotes:{literal:'end'}},omitWhen:{eq:[{field:'tail'},{literal:'end'}]}}}];
  const emptyComposedOwner=structuredClone(composedOwner);emptyComposedOwner.id='test.default-empty-composed-owner';
  emptyComposedOwner.imports.phrase=emptyComposed.id;emptyComposedOwner.value.fields[0].type.bind={name:{input:'name'}};
  cases.push({id:'record-default-empty-composed',entry:emptyComposedOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child token="Parent"><Enabled>true</Enabled><Amount>7</Amount><Tail>end</Tail></Child></Root>',yaml:'',noRaw:true});
  const emptyCollectionBucket=structuredClone(bucket);emptyCollectionBucket.id='test.default-empty-collection-bucket';
  emptyCollectionBucket.presence=[
    {target:{field:'items'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{sequence:[]}},omitWhen:{eq:[{field:'items'},{sequence:[]}]}}},
    {target:{field:'caption'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{literal:'caption'}},omitWhen:{eq:[{field:'caption'},{literal:'caption'}]}}},
  ];
  const emptyCollectionBucketOwner=structuredClone(emptyBucketOwner);emptyCollectionBucketOwner.id='test.default-empty-collection-bucket-owner';emptyCollectionBucketOwner.imports.phrase=emptyCollectionBucket.id;
  cases.push({id:'record-default-empty-mapping-collection',entry:emptyCollectionBucketOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Items/><Caption>caption</Caption></Child></Root>',yaml:'',noRaw:true});
  cases.push({id:'record-default-nonempty-mapping-collection',entry:emptyCollectionBucketOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Items/><Caption>other</Caption></Child></Root>',yaml:'Значение:\n  Подпись: other',noRaw:true});
  const inferredOwner=structuredClone(emptyPhraseOwner);inferredOwner.id='test.default-inferred-owner';
  inferredOwner.presence[0].yaml.missing.denotes={record:{}};
  cases.push({id:'record-default-inferred-record',entry:inferredOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child token="Parent"><Enabled>true</Enabled><Amount>7</Amount></Child></Root>',yaml:'',noRaw:true});
  const inferredComposedOwner=structuredClone(emptyComposedOwner);inferredComposedOwner.id='test.default-inferred-composed-owner';
  inferredComposedOwner.presence[0].yaml.missing.denotes={record:{}};
  cases.push({id:'record-default-inferred-composed',entry:inferredComposedOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child token="Parent"><Enabled>true</Enabled><Amount>7</Amount><Tail>end</Tail></Child></Root>',yaml:'',noRaw:true});
  const inheritedRows=structuredClone(collection);inheritedRows.id='test.default-inherited-rows';
  inheritedRows.presence=[{target:'self',xml:{missing:{denotes:{absent:true}}},
    yaml:{missing:{denotes:{sequence:[]}},omitWhen:{eq:[{self:true},{sequence:[]}]}}}];
  const inheritedBucket=structuredClone(emptyCollectionBucket);inheritedBucket.id='test.default-inherited-bucket';
  inheritedBucket.imports.items=inheritedRows.id;
  delete inheritedBucket.presence[0].yaml;
  const inheritedOwner=structuredClone(emptyCollectionBucketOwner);inheritedOwner.id='test.default-inherited-owner';
  inheritedOwner.imports.phrase=inheritedBucket.id;inheritedOwner.presence[0].yaml.missing.denotes={record:{}};
  cases.push({id:'record-default-inferred-collection-inheritance',entry:inheritedOwner.id,inputs:{name:'Parent'},
    xml:'<Root><Child><Items/><Caption>caption</Caption></Child></Root>',yaml:'',noRaw:true});
  for(const entry of cases)entry.factSourceEntries??=[];
  return {modules:[phrase,owner,scalarAbsentOwner,nested,nestedOwner,fragment,composed,composedOwner,conditional,collection,collectionOwner,projected,projectedOwner,bucket,bucketOwner,emptyBucketOwner,repeatedBucketOwner,firstPattern,secondPattern,plainFlag,selection,selectedRecord,selectionOwner,secondOwner,namedRecord,namedOwner,scalarSelection,scalarRecord,scalarOwner,table,contextual,contextualRecord,contextualOwner,namedRows,namedBucket,namedBucketOwner,compactWord,compactRows,compactFrame,compactOwner,optionalPattern,optionalRecord,optionalOwner,externalOwner,shortenedPattern,shortenedRecord,shortenedOwner,conflictingOwner,optionalChoice,optionalChoiceOwner,rawRecord,structuredChoice,structuredRecord,structuredOwner,rawOwner,absentChoiceOwner,fontRecord,fontOwner,absentFontOwner,capturedChild,capturedRecord,capturedOwner,capturedChoice,capturedChoiceOwner,styleOwner,styleProvider,directStructuredOwner,emptyPhrase,emptyPhraseOwner,emptyFragment,emptyComposed,emptyComposedOwner,emptyCollectionBucket,emptyCollectionBucketOwner,inferredOwner,inferredComposedOwner,inheritedRows,inheritedBucket,inheritedOwner],cases,factSources:[styleSource]};
}
