import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emitCollections} from '../src/collection-emission.mjs';
import {fixture} from './fixtures/array-collection.mjs';

test('collection emission requires complete items and preserves unsupported contracts as blockers',()=>{
  const {graph,entries}=fixture(),catalog=new Map([['common.string',{}],['common.boolean',{}]]);
  const result=emitCollections(graph,entries,catalog);
  assert.equal(result.results[0].status,'candidate');
  assert.equal(result.modules.length,3);
  assert.deepEqual(result.modules[0].value.fields.map(f=>f.name),['name','enabled']);
  assert.deepEqual(emitCollections(graph,entries,catalog),result);
  for(const change of [
    g=>{g.edges[0].mapping.yamlAsArray=false;},
    g=>{g.edges[0].context.ownerFactRole='items';},
    g=>{g.registrations[0].parameters.sparseItems=true;},
  ]) {
    const altered=structuredClone(graph);change(altered);
    assert.equal(emitCollections(altered,entries,catalog).modules.length,0);
  }
  const missing=structuredClone(entries);missing[0].properties[1].parameters.type='Unimplemented';
  const blocked=emitCollections(graph,missing,catalog);
  assert.equal(blocked.modules.length,0);
  assert.equal(blocked.results[0].blockers.find(b=>b.reason==='item-properties').details[0].property,'enabled');
});

test('named collections reuse the full item declaration and lift its declared key',()=>{
  const {graph,entries}=fixture();
  graph.edges[0].mapping.yamlAsArray=false;
  graph.edges[0].mapping.keyField='name';
  graph.registrations[0].parameters.yamlAsArray=false;
  graph.registrations[0].parameters.keyField='name';
  const result=emitCollections(graph,entries,new Map([['common.string',{}],['common.boolean',{}]]));
  assert.equal(result.results[0].status,'candidate');
  assert.deepEqual(result.modules[1].representations.yaml,{kind:'record-mapping',key:'name'});
  assert.equal(result.modules[0].value.fields.length,2);
  for(const key of ['missing','enabled']){const invalid=structuredClone(graph);invalid.edges[0].mapping.keyField=key;assert.equal(emitCollections(invalid,entries,new Map([['common.string',{}],['common.boolean',{}]])).modules.length,0);}
});
