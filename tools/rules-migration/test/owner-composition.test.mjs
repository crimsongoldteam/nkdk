import {test} from 'node:test';
import assert from 'node:assert/strict';
import {composeOwnerFragments,mergeOwnerFragments} from '../src/owner-composition.mjs';

test('owner composition binds shared inputs and separates different input shapes',()=>{
  const scalar={type:{kind:'scalar',scalar:'text'}},sequence={type:{kind:'sequence',item:{kind:'scalar',scalar:'text'}}};
  const first={kind:'fragment',id:'first',inputs:{name:scalar,forms:sequence}};
  const second={kind:'fragment',id:'second',inputs:{owner:scalar,forms:sequence}};
  const result=composeOwnerFragments('joined',[{alias:'one',fragment:first,bindings:{name:'name',forms:'firstForms'}},
    {alias:'two',fragment:second,bindings:{owner:'name',forms:'secondForms'}}]);
  assert.deepEqual(Object.keys(result.inputs),['name','firstForms','secondForms']);
  assert.deepEqual(result.compose[1].bind.owner,{input:'name'});
  assert.throws(()=>composeOwnerFragments('bad',[{alias:'one',fragment:first,bindings:{name:'name'}}]),/Incomplete/);
  assert.throws(()=>composeOwnerFragments('bad',[{alias:'one',fragment:first,bindings:{name:'x',forms:'x'}}]),/Conflicting/);
});

test('owner composition carries input type imports without alias collisions',()=>{
  const first={kind:'fragment',id:'first',imports:{kind:'common.first'},inputs:{value:{type:{use:'kind'}}}};
  const second={kind:'fragment',id:'second',imports:{kind:'common.second'},inputs:{value:{type:{use:'kind'}}}};
  const result=composeOwnerFragments('joined',[{alias:'one',fragment:first,bindings:{value:'firstValue'}},
    {alias:'two',fragment:second,bindings:{value:'secondValue'}}]);
  assert.equal(result.imports.one_kind,'common.first');
  assert.equal(result.imports.two_kind,'common.second');
  assert.equal(result.inputs.firstValue.type.use,'one_kind');
  assert.equal(result.inputs.secondValue.type.use,'two_kind');
});

test('owner composition reuses equivalent imported input types',()=>{
  const first={kind:'fragment',id:'first',imports:{root:'common.path-root'},inputs:{ownerRoot:{type:{use:'root'}}}};
  const second={kind:'fragment',id:'second',imports:{kind:'common.path-root'},inputs:{ownerRoot:{type:{use:'kind'}}}};
  const result=composeOwnerFragments('joined',[
    {alias:'first',fragment:first,bindings:{ownerRoot:'ownerRoot'}},
    {alias:'second',fragment:second,bindings:{ownerRoot:'ownerRoot'}},
  ]);
  assert.deepEqual(Object.keys(result.inputs),['ownerRoot']);
  assert.deepEqual(result.compose.map(part=>part.bind.ownerRoot),[{input:'ownerRoot'},{input:'ownerRoot'}]);
});

test('owner record merge writes shared XML parents once',()=>{
  const first={kind:'fragment',id:'forms',imports:{link:'common.form-link'},namespaces:{md:'urn:md'},
    inputs:{owner:{type:{kind:'scalar',scalar:'text'}}},value:{kind:'record',fields:[{name:'form',type:{use:'link'}}]},
    representations:{xml:{kind:'record',fields:[{field:'form',path:['md:Root','md:Properties','md:Form']}]},yaml:{kind:'mapping',fields:[{field:'form',key:'Форма'}]}}};
  const second={kind:'fragment',id:'fields',imports:{fields:'common.metadata-fields'},namespaces:{md:'urn:md'},
    inputs:{root:{type:{kind:'scalar',scalar:'text'}}},value:{kind:'record',fields:[{name:'dataLockFields',type:{use:'fields'}}]},
    representations:{xml:{kind:'record',fields:[{field:'dataLockFields',path:['md:Root','md:Properties','md:DataLockFields']}]},yaml:{kind:'mapping',fields:[{field:'dataLockFields',key:'ПоляБлокировкиДанных'}]}}};
  const result=mergeOwnerFragments('merged',[first,second]);
  assert.deepEqual(result.value.fields.map(field=>field.name),['form','dataLockFields']);
  assert.deepEqual(result.representations.xml.fields.map(field=>field.path.at(-1)),['md:Form','md:DataLockFields']);
  assert.deepEqual(Object.keys(result.inputs),['owner','root']);
  assert.throws(()=>mergeOwnerFragments('bad',[first,first]),/Duplicate/);
});
