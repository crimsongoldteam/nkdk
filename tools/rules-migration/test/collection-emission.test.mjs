import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emitCollections} from '../src/collection-emission.mjs';
import {fixture} from './fixtures/array-collection.mjs';
import {candidateCatalog} from '../src/candidate-catalog.mjs';

test('collection inputs retain shared index types and bindings at every boundary',()=>{
  const {graph,entries}=fixture(),{catalog}=candidateCatalog();
  const child=entries.find(entry=>entry.symbol==='ItemRules');
  child.properties.push(...['first','second'].map(name=>({name,status:'static-parameters',parameters:{type:'MetadataItemLink',xml:name==='first'?'First':'Second',xmlParents:['Properties'],yaml:name,metadataTarget:{kind:'object',roots:['DocumentNumerator']}}})));
  const result=emitCollections(graph,entries,catalog);
  assert.equal(result.results[0].status,'candidate');
  const [row,list,owner]=result.modules;
  for(const module of result.modules) {
    assert.deepEqual(Object.keys(module.inputs),['roots']);
    const alias=module.inputs.roots.type.key.fields[0].type.use;
    assert.equal(module.imports[alias],'common.path-root');
  }
  assert.deepEqual(list.value.item.bind,{roots:{input:'roots'}});
  assert.deepEqual(owner.value.fields[0].type.bind,{roots:{input:'roots'}});
  assert.deepEqual(row.value.fields.at(-1).type.bind,{roots:{input:'roots'}});
  for(const [type,argument] of [['I8nText','ownerName'],['FormattedI8nText','name']]) {
    child.properties.at(-1).parameters={type,yaml:'Текст'};
    const contextual=emitCollections(graph,entries,catalog);
    assert.equal(contextual.results[0].status,'candidate');
    assert.deepEqual(contextual.modules[0].value.fields.at(-1).type.bind[argument],{field:'name'});
    assert.deepEqual(Object.keys(contextual.modules[0].inputs),['roots','defaultLanguage','registeredLanguages']);
  }
  graph.edges[0].mapping.keyField='first';
  assert.equal(emitCollections(graph,entries,catalog).results[0].blockers.some(b=>b.reason==='item-context-binding-required'),true);
});

test('collection fields wait for structured sibling expression backend',()=>{
  const {graph,entries}=fixture(),{catalog}=candidateCatalog();
  const child=entries.find(entry=>entry.symbol==='ItemRules');
  child.properties.push({name:'type',status:'static-parameters',parameters:{type:'TypeDescription',yaml:'Тип',xml:'Type',xmlParents:['Properties']}},
    {name:'fillValue',status:'static-parameters',parameters:{type:'MetadataValue',yaml:'Значение',xml:'Value',xmlParents:['Properties'],defaultValueXMLRaw:{'_xsi:nil':true},exportNilValue:true}});
  const result=emitCollections(graph,entries,catalog);
  assert.equal(result.results[0].status,'blocked',JSON.stringify(result.results[0]));
  assert.equal(result.results[0].blockers.some(blocker=>blocker.reason==='item-properties' && blocker.details?.some(detail=>detail.reason==='structured-sibling-expression-backend')),true);
  child.properties.find(property=>property.name==='type').parameters.type='string';
  const wrongType=emitCollections(graph,entries,catalog);
  assert.equal(wrongType.results[0].status,'blocked');
  assert.equal(wrongType.results[0].blockers.some(blocker=>blocker.reason==='item-properties'),true);
});

test('collection emission requires complete items and preserves unsupported contracts as blockers',()=>{
  const {graph,entries}=fixture(),catalog=new Map([['common.string',{}],['common.boolean',{}]]);
  const result=emitCollections(graph,entries,catalog);
  assert.equal(result.results[0].status,'candidate');
  assert.equal(result.modules.length,3);
  assert.deepEqual(result.modules[0].value.fields.map(f=>f.name),['name','enabled']);
  assert.deepEqual(emitCollections(graph,entries,catalog),result);
  const reordered=structuredClone(entries);
  reordered[0].xmlOrder={status:'static',keys:['enabled','name']};
  const ordered=emitCollections(graph,reordered,catalog).modules[0];
  assert.deepEqual(ordered.representations.xml.fields.map(f=>f.field),['enabled','name']);
  assert.deepEqual(ordered.representations.yaml.fields.map(f=>f.field),['name','enabled']);

  for(const change of [
    g=>{g.edges[0].mapping.yamlAsArray=false;},
    g=>{g.edges[0].context.ownerFactRole='items';},
    g=>{g.registrations[0].parameters.sparseItems=true;},
  ]) {
    const altered=structuredClone(graph);change(altered);
    assert.equal(emitCollections(altered,entries,catalog).modules.length,0);
  }
  const states=structuredClone(entries);
  states[0].itemType='Example';
  // Older inventories must not silently skip a source registry.
  assert.equal(emitCollections(graph,states,catalog).results[0].blockers.some(b=>b.reason==='item-state-inventory-required'),true);
  states[0].propertyStates=[{id:'item:Example',item:{itemType:'Example',profiles:[],properties:{name:{modes:['notify']}}}}];
  const stateBlocked=emitCollections(graph,states,catalog).results[0];
  assert.equal(stateBlocked.blockers.some(b=>b.reason==='item-state-assembly-required'),true);
  assert.deepEqual(stateBlocked.propertyStates,states[0].propertyStates);
  states[0].propertyStates=[];
  assert.equal(emitCollections(graph,states,catalog).results[0].status,'candidate');
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
  const withoutKeyYAML=structuredClone(entries);
  delete withoutKeyYAML.find(entry=>entry.symbol==='ItemRules').properties[0].parameters.yaml;
  const implicitKey=emitCollections(graph,withoutKeyYAML,new Map([['common.string',{}],['common.boolean',{}]]));
  assert.equal(implicitKey.results[0].status,'candidate');
  assert.equal(implicitKey.modules[0].representations.yaml.fields[0].key,'name');
  const array=structuredClone(graph);array.edges[0].mapping.yamlAsArray=true;
  assert.equal(emitCollections(array,withoutKeyYAML,new Map([['common.string',{}],['common.boolean',{}]])).modules.length,0);
  const identityEntries=structuredClone(entries),{catalog}=candidateCatalog();
  identityEntries.find(entry=>entry.symbol==='ItemRules').properties.push({name:'uuid',status:'static-parameters',parameters:{type:'uuid',xml:'_uuid',xmlParents:[],xmlOnly:true}});
  const identified=emitCollections(graph,identityEntries,catalog);
  assert.equal(identified.results[0].status,'candidate',JSON.stringify(identified.results[0]));
  const [row,,owner]=identified.modules;
  assert.deepEqual(row.representations.xml.fields.at(-1),{field:'uuid',path:[],attribute:'uuid'});
  assert.equal(row.representations.yaml.fields.some(field=>field.field==='uuid'),false);
  assert.deepEqual(row.value.fields.at(-1).type.bind.name,{field:'name'});
  assert.deepEqual(row.value.fields.at(-1).type.bind.kind,{literal:'Item'});
  assert.equal(owner.inputs.identities.index,'metadata.own-identities');
  assert.equal(owner.contributions[0].index,'metadata.own-identities');
  assert.deepEqual(owner.contributions[0].value,{get:{of:{var:'row'},field:'uuid'}});
  for(const key of ['missing','enabled']){const invalid=structuredClone(graph);invalid.edges[0].mapping.keyField=key;assert.equal(emitCollections(invalid,entries,new Map([['common.string',{}],['common.boolean',{}]])).modules.length,0);}
});
