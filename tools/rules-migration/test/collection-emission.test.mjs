import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emitCollections} from '../src/collection-emission.mjs';
import {fixture} from './fixtures/array-collection.mjs';
import {candidateCatalog} from '../src/candidate-catalog.mjs';
import {formColumnCases} from '../src/form-column-cases.mjs';
import {reconstructionProfiles} from '../src/reconstruction-profiles.mjs';
import {mapCollectionReference} from '../src/collection-reference-property.mjs';

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
  assert.equal(emitCollections(graph,entries,catalog).results[0].status,'candidate');
});

test('collection fields bind declared sibling inputs without owner context',()=>{
  const {graph,entries}=fixture(),{catalog}=candidateCatalog();
  const child=entries.find(entry=>entry.symbol==='ItemRules');
  child.properties.push({name:'type',status:'static-parameters',parameters:{type:'TypeDescription',yaml:'Тип',xml:'Type',xmlParents:['Properties']}},
    {name:'fillValue',status:'static-parameters',parameters:{type:'MetadataValue',yaml:'Значение',xml:'Value',xmlParents:['Properties'],defaultValueXMLRaw:{'_xsi:nil':true},exportNilValue:true}});
  const result=emitCollections(graph,entries,catalog);
  assert.equal(result.results[0].status,'candidate',JSON.stringify(result.results[0]));
  const field=result.modules[0].value.fields.find(item=>item.name==='fillValue');
  assert.equal(field.type.bind.onlyStringType.and[0].present.field,'type');
  assert.equal(Object.hasOwn(result.modules[0].inputs??{},'onlyStringType'),false);
  child.properties.find(property=>property.name==='type').parameters.type='string';
  const wrongType=emitCollections(graph,entries,catalog);
  assert.equal(wrongType.results[0].status,'blocked');
  assert.equal(wrongType.results[0].blockers.some(blocker=>blocker.reason==='item-sibling-binding-required'),true);
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
  const hiddenKey=structuredClone(entries);
  hiddenKey.find(entry=>entry.symbol==='ItemRules').properties[0].parameters.toYAML=false;
  const liftedHidden=emitCollections(graph,hiddenKey,new Map([['common.string',{}],['common.boolean',{}]]));
  assert.equal(liftedHidden.results[0].status,'candidate',JSON.stringify(liftedHidden.results[0]));
  assert.equal(liftedHidden.modules[0].representations.yaml.fields[0].key,'Имя');
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
  // Hidden XML scalars are recovered only with an explicit compiled binding.
  for(const attribute of ['id','token']) {
    const boundEntries=structuredClone(withoutKeyYAML);
    const boundChild=boundEntries.find(entry=>entry.symbol==='ItemRules');
    boundChild.properties[0].parameters.xml='_name';
    boundChild.properties[0].parameters.xmlParents=[];
    boundChild.properties[0].parameters.required=true;
    boundChild.properties.push({name:'number',status:'static-parameters',
      parameters:{type:'string',xml:'_'+attribute,xmlOnly:true}});
    const text={kind:'scalar',scalar:'text'};
    const recovery={inputs:{numbers:{type:{kind:'index',key:text,value:text}}},
      expression:{require:{lookup:{in:{input:'numbers'},key:{field:'name'}}}}};
    const options={reconstructedFields:{[boundChild.path+'#'+boundChild.symbol]:{number:recovery}}};
    const registration=graph.registrations[0];
    const profile={source:{path:boundChild.path,symbol:boundChild.symbol,property:'number',
      parameters:structuredClone(boundChild.properties.at(-1).parameters),
      registration:{type:registration.type,parameters:structuredClone(registration.parameters)}},binding:recovery};
    const resolved=reconstructionProfiles([profile],graph,boundEntries);
    assert.deepEqual(resolved.fields,options.reconstructedFields);
    assert.equal(resolved.applied.length,1);
    const changedSource=structuredClone(boundEntries);changedSource.find(row=>row.symbol==='ItemRules').properties.at(-1).parameters.xml='_other';
    assert.throws(()=>reconstructionProfiles([profile],graph,changedSource),/source correspondence/);
    const changedRegistration=structuredClone(graph);changedRegistration.registrations[0].parameters.extra=true;
    assert.throws(()=>reconstructionProfiles([profile],changedRegistration,boundEntries),/registration correspondence/);
    assert.throws(()=>reconstructionProfiles([profile,profile],graph,boundEntries),/Duplicate reconstruction/);
    const bound=emitCollections(graph,boundEntries,catalog,{},options);
    assert.equal(bound.results[0].status,'candidate',JSON.stringify(bound.results[0]));
    const item=bound.modules[0];
    assert.deepEqual(item.representations.xml.fields.at(-1),{field:'number',path:[],attribute});
    assert.equal(item.representations.yaml.fields.some(field=>field.field==='number'),false);
    assert.deepEqual(item.presence.find(rule=>rule.target.field==='number').yaml.missing.denotes,recovery.expression);
    assert.deepEqual(item.inputs.numbers,recovery.inputs.numbers);
    assert.equal(emitCollections(graph,boundEntries,catalog).modules.length,0);
    const unknown=structuredClone(options);unknown.reconstructedFields[boundChild.path+'#'+boundChild.symbol].missing=recovery;
    assert.equal(emitCollections(graph,boundEntries,catalog,{},unknown).modules.length,0);
    const required=structuredClone(graph);
    required.registrations[0].parameters.requiredIdentity='xmlId';
    assert.equal(emitCollections(required,boundEntries,catalog,{},options).results[0].status,
      attribute==='id'?'candidate':'blocked');
    required.registrations[0].parameters.requiredIdentity='unknown';
    assert.equal(emitCollections(required,boundEntries,catalog,{},options).modules.length,0);
    boundChild.properties.at(-1).parameters.fromYAML=false;
    assert.equal(emitCollections(graph,boundEntries,catalog,{},options).modules.length,0);
  }
  const deferredGraph=structuredClone(graph);
  deferredGraph.edges[0].context.configurationIndexUidSegment='Элемент';
  assert.equal(emitCollections(deferredGraph,entries,catalog).modules.length,0);
  const readyItems=emitCollections(deferredGraph,entries,catalog,{}, {emitReadyItems:true});
  assert.equal(readyItems.results[0].status,'blocked');
  assert.equal(readyItems.modules.length,2);
  assert.equal(readyItems.results[0].itemDeclaration,readyItems.modules[0].id);
  assert.equal(readyItems.results[0].collectionDeclaration,readyItems.modules[1].id);
  assert.equal(readyItems.results[0].declaration,undefined);
  const nestedEntries=structuredClone(withoutKeyYAML);
  nestedEntries.find(row=>row.symbol==='ItemRules').properties=nestedEntries.find(row=>row.symbol==='ItemRules').properties.slice(0,1);
  const nestedList={format:'nkdk-declarations/1',kind:'value',id:'test.nested-list',
    value:{kind:'sequence',item:{kind:'scalar',scalar:'text'}},
    representations:{xml:{kind:'element-sequence',path:['Child']},yaml:{kind:'sequence'}}};
  nestedEntries.find(row=>row.symbol==='ItemRules').properties.push({name:'nested',status:'static-parameters',
    parameters:{type:'Nested',xml:'Child',xmlParents:['Properties','Nested'],yaml:'Вложенное',yamlInline:true}});
  const inline=emitCollections(graph,nestedEntries,catalog,{}, {collectionValues:{Nested:{module:nestedList}}});
  assert.equal(inline.results[0].status,'candidate',JSON.stringify(inline.results[0]));
  assert.deepEqual(inline.modules[1].representations.yaml,{kind:'record-mapping',key:'name',value:'nested'});
  assert.equal(inline.modules[0].value.fields.at(-1).type.use,'field1');
  const wrongRoot=structuredClone(nestedList);wrongRoot.representations.xml.path=['Other'];
  assert.equal(emitCollections(graph,nestedEntries,catalog,{}, {collectionValues:{Nested:{module:wrongRoot}}}).modules.length,0);
  const contextualList=structuredClone(nestedList);
  contextualList.inputs={parent:{type:{kind:'scalar',scalar:'text'}}};
  const contextDescriptor={module:contextualList,inputs:{scope:{type:{kind:'scalar',scalar:'text'}}},
    bindings:{parent:{concat:[{field:'name'},{input:'scope'}]}}};
  const contextualInline=emitCollections(graph,nestedEntries,catalog,{}, {collectionValues:{Nested:contextDescriptor}});
  assert.equal(contextualInline.results[0].status,'candidate',JSON.stringify(contextualInline.results[0]));
  assert(contextualInline.modules[0].inputs.scope);
  assert.equal(contextualInline.modules[0].value.fields.at(-1).type.bind.scope,undefined);
  const restoredEntries=structuredClone(nestedEntries);
  const restoredProperty=restoredEntries.find(row=>row.symbol==='ItemRules').properties.at(-1);
  restoredProperty.parameters.fromYAML=false;
  restoredProperty.parameters.defaultValue=[];
  const restored=emitCollections(graph,restoredEntries,catalog,{}, {collectionValues:{Nested:contextDescriptor}});
  assert.equal(restored.results[0].status,'candidate',JSON.stringify(restored.results[0]));
  assert.deepEqual(restored.modules,contextualInline.modules,
    'The whole declared collection restores values that the legacy child-item assembly supplied');
  assert.deepEqual(mapCollectionReference(restoredProperty,contextDescriptor).parameterEquivalences,[
    {parameter:'fromYAML',equivalentTo:'declared-collection-read',via:contextualList.id},
    {parameter:'defaultValue',equivalentTo:'empty-declared-collection',via:contextualList.id},
  ]);
  for(const parameters of [{fromYAML:true},{defaultValue:['unmapped']},{toYAML:false}]) {
    const wrong=structuredClone(restoredEntries);
    Object.assign(wrong.find(row=>row.symbol==='ItemRules').properties.at(-1).parameters,parameters);
    assert.equal(emitCollections(graph,wrong,catalog,{}, {collectionValues:{Nested:contextDescriptor}}).modules.length,0);
  }
  const invalidContext=structuredClone(contextDescriptor);invalidContext.bindings.scope={input:'scope'};
  assert.equal(emitCollections(graph,nestedEntries,catalog,{}, {collectionValues:{Nested:invalidContext}}).modules.length,0);
  const columns=formColumnCases(catalog);
  const sourceOwner=columns.cases.find(row=>row.id==='form-attribute-columns-source-owner');
  assert(sourceOwner,'Real source properties must attach both complete collection declarations');
  assert.equal(sourceOwner.reverseYAML,'Колонки:\n  Отступ:\n    Тип: Строка\nДополнительныеКолонки:\n  ГрафикНачислений:\n    Сумма:\n      Тип: Число(10, 2)');
  const ownerDeclaration=columns.modules.find(module=>module.id===sourceOwner.entry);
  assert.deepEqual(ownerDeclaration.compose.flatMap(part=>
    columns.modules.find(module=>module.id===ownerDeclaration.imports[part.use]).value.fields.map(field=>field.name)),
    ['columns','additionalColumns']);
  const column=columns.modules.find(module=>module.value?.fields?.some(field=>field.name==='functionalOptions'));
  assert.deepEqual(column.value.fields.map(field=>field.name).sort(),
    ['edit','fillCheck','functionalOptions','id','name','title','type','view']);
  assert.equal(column.representations.yaml.fields.some(field=>field.field==='id'),false);
  assert.deepEqual(column.representations.xml.fields.find(field=>field.field==='name'),{field:'name',path:[],attribute:'name'});
  assert(columns.cases.every(row=>row.adaptation.includes('FormAttribute assembly is separate')));
  for(const key of ['missing','enabled']){const invalid=structuredClone(graph);invalid.edges[0].mapping.keyField=key;assert.equal(emitCollections(invalid,entries,new Map([['common.string',{}],['common.boolean',{}]])).modules.length,0);}
});

test('direct XML collections require the real owner root for standalone projection',()=>{
  const {graph,entries}=fixture(),{catalog}=candidateCatalog();
  graph.edges[0].mapping.xmlParents=[];
  const blocked=emitCollections(graph,entries,catalog);
  assert.equal(blocked.results[0].status,'blocked');
  assert.equal(blocked.results[0].blockers.some(item=>item.reason==='collection-owner-path'),true);
  const key=`${graph.edges[0].owner.path}#${graph.edges[0].owner.symbol}`;
  const emitted=emitCollections(graph,entries,catalog,{}, {ownerXmlRoots:{[key]:['Root']}});
  assert.equal(emitted.results[0].status,'candidate',JSON.stringify(emitted.results[0]));
  assert.deepEqual(emitted.modules[2].representations.xml.fields,[{field:graph.edges[0].property,path:['Root']}]);
  const invalid=emitCollections(graph,entries,catalog,{}, {ownerXmlRoots:{[key]:[]}});
  assert.equal(invalid.results[0].status,'blocked');
  graph.edges[0].mapping.ownerXmlRoot=['Settings'];
  const derived=emitCollections(graph,entries,catalog);
  assert.equal(derived.results[0].status,'candidate');
  assert.deepEqual(derived.modules[2].representations.xml.fields,[{field:graph.edges[0].property,path:['Settings']}]);
  const formNamespace='http://v8.1c.ru/8.3/xcf/logform';
  const qualified=emitCollections(graph,entries,catalog,{form:formNamespace},{defaultXmlNamespace:'form'});
  assert.equal(qualified.results[0].status,'candidate');
  assert.deepEqual(qualified.modules[2].representations.xml.fields,[{field:graph.edges[0].property,path:['form:Settings']}]);
  assert.deepEqual(qualified.modules[1].representations.xml.path,['form:Item']);
});

test('YAML-path index addressing remains an explicit owner requirement',()=>{
  const {graph,entries}=fixture(),{catalog}=candidateCatalog();
  graph.registrations[0].parameters.configurationIndexAddressing='yamlPath';
  graph.edges[0].mapping.configurationIndexAddressing='yamlPath';
  const owner=entries.find(entry=>entry.symbol==='OwnerRules');
  owner.properties.find(property=>property.name==='items').parameters.configurationIndexAddressing='yamlPath';
  const blocked=emitCollections(graph,entries,catalog);
  assert.equal(blocked.results[0].status,'blocked');
  assert.equal(blocked.results[0].blockers.some(item=>item.reason==='collection-index-addressing-required'),true);
  const deferred=emitCollections(graph,entries,catalog,{}, {deferOwnerContributions:true});
  assert.equal(deferred.results[0].status,'candidate',JSON.stringify(deferred.results[0]));
  assert.deepEqual(deferred.results[0].ownerRequirements.indexAddressing,'yamlPath');
  graph.registrations[0].parameters.configurationIndexAddressing='xmlPath';
  assert.equal(emitCollections(graph,entries,catalog,{}, {deferOwnerContributions:true}).results[0].status,'blocked');
});

test('collection registration supplies the named index segment before the owner property',()=>{
  const {graph,entries}=fixture(),{catalog}=candidateCatalog();
  graph.registrations[0].parameters.configurationIndexUidSegment='Поле';
  graph.edges[0].context.configurationIndexUidSegment='Реквизит';
  const emitted=emitCollections(graph,entries,catalog,{}, {deferOwnerContributions:true});
  assert.equal(emitted.results[0].status,'candidate',JSON.stringify(emitted.results[0]));
  assert.equal(emitted.results[0].ownerRequirements.configurationIndexUidSegment,'Поле');
  graph.registrations[0].parameters.configurationIndexUidSegment='';
  assert.equal(emitCollections(graph,entries,catalog,{}, {deferOwnerContributions:true}).results[0].status,'blocked');
});
