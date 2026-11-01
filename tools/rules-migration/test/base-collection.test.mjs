import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emitBaseCollections} from '../src/base-collection.mjs';
import {fixture} from './fixtures/array-collection.mjs';
import {readFileSync} from 'node:fs';
import {candidateCatalog} from '../src/candidate-catalog.mjs';
import {attachOwnerMembership} from '../src/owner-membership.mjs';

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

test('command collection emits complete XML fields and reports its external module separately',()=>{
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json'));
  graph.edges=graph.edges.filter(edge=>edge.owner.symbol==='MetadataDocumentRules'&&edge.property==='commands');
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const result=emitBaseCollections(graph,entries,candidateCatalog().catalog,{md:'http://v8.1c.ru/8.3/MDClasses'});
  const [boundary]=result.results;
  assert.equal(boundary.status,'candidate',JSON.stringify(boundary.blockers));
  assert.equal(result.modules[0].value.fields.some(field=>field.name==='commandModule'),false);
  assert.equal(result.modules[0].value.fields.some(field=>field.name==='uuid'),true);
  assert.equal(result.modules[0].value.fields.some(field=>field.name==='picture'),true);
  assert.deepEqual(result.deferredResources.map(item=>item.properties),[['commandModule']]);
  const all=JSON.parse(readFileSync('tests/migration/collection-links.json'));
  all.edges=all.edges.filter(edge=>edge.item.symbol==='MetadataCommandRules');
  const wholeFamily=emitBaseCollections(all,entries,candidateCatalog().catalog,{md:'http://v8.1c.ru/8.3/MDClasses'});
  assert.equal(wholeFamily.results.length,23);
  assert.equal(wholeFamily.results.every(item=>item.status==='candidate'),true);
  assert.equal(wholeFamily.modules.filter(item=>item.kind==='value'&&item.value.kind==='record').length,1);
});

test('journal columns emit a complete member-link collection from source rules',()=>{
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json'));
  graph.edges=graph.edges.filter(edge=>edge.item.symbol==='MetadataDocumentJournalColumnRules');
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const result=emitBaseCollections(graph,entries,candidateCatalog().catalog,{md:'http://v8.1c.ru/8.3/MDClasses'});
  assert.equal(result.results.length,1);
  assert.equal(result.results[0].status,'candidate',JSON.stringify(result.results[0].blockers));
  assert.equal(result.modules[0].value.fields.some(field=>field.name==='references'),true);
  assert.equal(result.modules[1].representations.yaml.kind,'record-mapping');
});

test('nested named attributes accept the source empty-list defaults without dropping the item contract',()=>{
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json'));
  graph.edges=graph.edges.filter(edge=>edge.owner.symbol==='MetadataDocumentTabularSectionRules'&&edge.property==='attributes');
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const result=emitBaseCollections(graph,entries,candidateCatalog().catalog,{md:'http://v8.1c.ru/8.3/MDClasses'});
  assert.equal(result.results[0].status,'candidate',JSON.stringify(result.results[0].blockers));
  assert.equal(result.modules[0].value.fields.some(field=>field.name==='uuid'),true);
  assert.equal(result.modules[1].representations.xml.path[0],'md:Attribute');
  assert.equal(result.results[0].ownerRequirements.operationTarget.kind,'namedCollectionTarget');
  assert.deepEqual(result.modules[2].presence?.[0]?.xml?.missing?.denotes,{sequence:[]});
  assert.deepEqual(result.modules[2].presence?.[0]?.xml?.empty?.[0]?.denotes,{sequence:[]});
  assert.deepEqual(result.modules[2].presence?.[0]?.yaml?.omitWhen,{not:{exists:{in:{field:'attributes'},as:'row',where:{literal:true}}}});
});

test('external data source members use the index segment declared by their collection registration',()=>{
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json'));
  const segments=new Map(graph.registrations.filter(registration=>registration.parameters.configurationIndexUidSegment)
    .map(registration=>[registration.type,registration.parameters.configurationIndexUidSegment]));
  const edges=graph.edges.filter(edge=>edge.owner.symbol.startsWith('MetadataExternalDataSource')&&segments.has(edge.type));
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const catalog=candidateCatalog().catalog;
  assert.equal(edges.length,9);
  let accepted=0;
  for(const edge of edges){
    const selected={...graph,edges:[edge],registrations:graph.registrations.filter(registration=>registration.type===edge.type)};
    const emitted=emitBaseCollections(selected,entries,catalog);
    if(emitted.results[0].status!=='candidate')continue;
    accepted++;
    assert.equal(emitted.results[0].status,'candidate',JSON.stringify(emitted.results[0].blockers));
    assert.equal(emitted.results[0].ownerRequirements.configurationIndexUidSegment,segments.get(edge.type));
    attachOwnerMembership(emitted);
    assert.equal(emitted.results[0].ownerRequirements,undefined);
    assert.equal(emitted.modules[2].contributions.at(-1).index,'metadata.owner-member-identities');
  }
  assert.equal(accepted,9);
});
