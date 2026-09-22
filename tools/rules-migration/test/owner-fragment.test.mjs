import {test} from 'node:test';
import assert from 'node:assert/strict';
import {asOwnerFragment} from '../src/owner-fragment.mjs';

test('owner fragment prefixes XML routes without changing declared inputs or facts',()=>{
  const source={kind:'object',id:'test.child',inputs:{owner:{type:{kind:'scalar',scalar:'text'}},identities:{type:{kind:'index',key:{kind:'scalar',scalar:'text'},value:{kind:'scalar',scalar:'text'}},index:'test.identities'}},
    representations:{xml:{kind:'record',fields:[{field:'children',path:['md:ChildObjects']}]},yaml:{kind:'mapping',fields:[{field:'children',key:'Дети'}]}},
    contributions:[{index:'test.members',key:{input:'owner'},value:{literal:'one'}}]};
  const fragment=asOwnerFragment(source,'test.fragment',['md:MetaDataObject','md:Document']);
  assert.equal(fragment.kind,'fragment');
  assert.deepEqual(fragment.representations.xml.fields[0].path,['md:MetaDataObject','md:Document','md:ChildObjects']);
  assert.deepEqual(fragment.inputs.identities.type,source.inputs.identities.type);
  assert.equal(fragment.inputs.identities.index,undefined);
  assert.equal(source.inputs.identities.index,'test.identities');
  assert.deepEqual(fragment.contributions,source.contributions);
  assert.deepEqual(source.representations.xml.fields[0].path,['md:ChildObjects']);
});
