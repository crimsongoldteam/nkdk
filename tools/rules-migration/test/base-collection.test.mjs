import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emitBaseCollections} from '../src/base-collection.mjs';
import {fixture} from './fixtures/array-collection.mjs';
import {readFileSync} from 'node:fs';
import {candidateCatalog} from '../src/candidate-catalog.mjs';

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

test('document attributes emit a complete base collection while retaining owner requirements',()=>{
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json'));
  graph.edges=graph.edges.filter(edge=>edge.owner.symbol==='MetadataDocumentRules'&&edge.property==='attributes');
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const result=emitBaseCollections(graph,entries,candidateCatalog().catalog,{md:'http://v8.1c.ru/8.3/MDClasses'});
  const [boundary]=result.results;
  assert.equal(boundary.status,'candidate',JSON.stringify(boundary.blockers));
  assert.equal(result.modules[0].value.fields.length,31);
  assert.deepEqual(result.modules[0].representations.xml.fields.find(field=>field.field==='name').path,['md:Properties','md:Name']);
  assert.deepEqual(result.modules[1].representations.xml.path,['md:Attribute']);
  assert.deepEqual(result.modules[0].representations.yaml.fields.filter(field=>field.field!=='name').slice(0,4).map(field=>field.key),['Синоним','Тип','БыстрыйВыбор','ВыборГруппИЭлементов']);
  assert.equal(boundary.ownerRequirements.ownerFactRole,'attributes');
  assert.equal(boundary.ownerRequirements.operationTarget.kind,'namedCollectionTarget');
  assert.deepEqual(boundary.inputRequirements.sort(),['attributes','containingOwnerName','defaultLanguage','ownerRoot','registeredLanguages'].sort());
});
