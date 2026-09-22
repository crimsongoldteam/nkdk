import assert from 'node:assert/strict';
import test from 'node:test';
import {partitionContracts} from '../src/contract-shards.mjs';

const modules=new Map([
 ['shared',{id:'shared',imports:{}}],
 ['a',{id:'a',imports:{base:'shared'}}],
 ['b',{id:'b',imports:{base:'shared'}}],
 ['c',{id:'c',imports:{}}],
]);
const manifest={cases:[
 {id:'a1',entry:'a'}, {id:'a2',entry:'a'}, {id:'b',entry:'b'}, {id:'c',entry:'c'},
]};

test('contract shards cover every case once and keep dependencies together',()=>{
 const shards=partitionContracts(manifest,modules,2);
 assert.deepEqual(shards.flatMap(shard=>shard.manifest.cases.map(item=>item.id)).sort(),['a1','a2','b','c']);
 assert.ok(shards.every(shard=>shard.modules.length<=2));
 assert.ok(shards.some(shard=>shard.manifest.cases.length===2));
 assert.equal(partitionContracts(manifest,modules,2).length,shards.length);
});

test('a single oversized contract is reported before compilation',()=>{
 assert.throws(()=>partitionContracts(manifest,modules,1),/requires 2 declarations/);
});

test('source size caps a shard even when its declaration count fits',()=>{
 const shards=partitionContracts(manifest,modules,3,125,()=>60);
 assert.equal(shards.length,3);
 assert.ok(shards.every(shard=>shard.modules.length*60<=125));
});
