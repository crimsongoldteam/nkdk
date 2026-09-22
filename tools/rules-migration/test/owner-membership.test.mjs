import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attachOwnerMembership} from '../src/owner-membership.mjs';

test('owner membership uses declared role and retains unresolved operation routing',()=>{
  const key={record:{component:{input:'component'},owner:{input:'owner'},kind:{literal:'Attribute'},name:{get:{of:{var:'row'},field:'name'}}}};
  const emission={modules:[{}, {}, {contributions:[{index:'metadata.own-identities',forEach:{in:{field:'attributes'},as:'row'},key,value:{get:{of:{var:'row'},field:'uuid'}}}]}],
    results:[{ownerRequirements:{ownerFactRole:'attributes',configurationIndexUidSegment:null,operationTarget:{kind:'namedCollectionTarget'}}}]};
  attachOwnerMembership(emission);
  assert.equal(emission.modules[2].contributions[1].index,'metadata.owner-members');
  assert.deepEqual(emission.modules[2].contributions[1].key.record.role,{literal:'attributes'});
  assert.deepEqual(emission.results[0].ownerRequirements,{operationTarget:{kind:'namedCollectionTarget'}});
});
