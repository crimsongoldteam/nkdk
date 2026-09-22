import {test} from 'node:test';
import assert from 'node:assert/strict';
import {composeOwnerFragments} from '../src/owner-composition.mjs';

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
