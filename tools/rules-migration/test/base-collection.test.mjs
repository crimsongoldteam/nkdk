import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emitBaseCollections} from '../src/base-collection.mjs';
import {fixture} from './fixtures/array-collection.mjs';

test('base collection profile excludes only registered extension service fields',()=>{
  const {graph,entries}=fixture();
  const child=entries[0];
  child.itemType='Example';
  child.propertyStates=[{id:'item:Example',item:{itemType:'Example',profiles:[],properties:{base:{availability:'borrowed',modes:['control']}}}}];
  child.properties.push({name:'base',status:'static-parameters',parameters:{type:'string',yaml:'Base',runtimeOnly:true}});
  graph.edges[0].context.ownerFactRole='values';
  const original=structuredClone(entries);
  const catalog=new Map([['common.string',{}],['common.boolean',{}]]);
  const result=emitBaseCollections(graph,entries,catalog);
  assert.equal(result.results[0].status,'candidate');
  assert.equal(result.results[0].ownerRequirements.ownerFactRole,'values');
  assert.equal(result.profile,'base-configuration');
  assert.deepEqual(result.excluded,[{path:child.path,symbol:child.symbol,properties:['base']}]);
  assert.deepEqual(entries,original);
  child.properties.at(-1).name='unknown';
  assert.equal(emitBaseCollections(graph,entries,catalog).results[0].status,'blocked');
  child.properties.at(-1).name='base';
  child.propertyStates=null;
  assert.equal(emitBaseCollections(graph,entries,catalog).results[0].status,'blocked');
});
