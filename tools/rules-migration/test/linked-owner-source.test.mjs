import test from 'node:test';
import assert from 'node:assert/strict';
import {linkedOwnerSources} from '../src/linked-owner-source.mjs';

test('linked sources follow identities even with different names and reject ambiguous or missing bases',()=>{
  const base={kind:'RenamedKind',name:'OldName',identity:'base-id',source:[{path:'base.xml'}]};
  const extension={kind:'RenamedKind',name:'NewName',identity:'extension-id',baseIdentity:'base-id'};
  const resolve=linkedOwnerSources([base]);
  assert.equal(resolve(extension),base);
  assert.equal(resolve({...extension,baseIdentity:undefined}),undefined);
  assert.throws(()=>resolve({...extension,baseIdentity:'missing'}),/missing/i);
  assert.throws(()=>resolve({...extension,kind:'Other'}),/kind/i);
  assert.throws(()=>linkedOwnerSources([base,{...base,name:'Duplicate'}]),/repeated/i);
});
