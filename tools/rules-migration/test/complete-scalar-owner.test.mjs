import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {candidateCatalog} from '../src/candidate-catalog.mjs';
import {numericOwnerOperation} from '../src/numeric-owner-operation.mjs';

test('complete scalar owner retains identity, base attachment and one shared state history',async()=>{
  const {completeScalarOwner}=await import('../src/complete-scalar-owner.mjs');
  const source=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries.find(row=>row.symbol==='MetadataDocumentNumeratorRules');
  const numbers=numericOwnerOperation().modules.find(row=>row.id==='fragment.owner-numbers.documentnumerator');
  const {owner,facts}=completeScalarOwner(source,numbers,candidateCatalog().catalog,{yamlKind:"Нумератор"});
  assert.equal(owner.kind,'object');
  assert.equal(owner.representations.xml.kind,'with-attributes');
  assert(owner.value.fields.some(row=>row.name==='uuid'));
  assert(owner.value.fields.some(row=>row.name==='synonym'));
  assert(owner.value.fields.some(row=>row.name==='base'));
  assert.equal(owner.value.fields.filter(row=>row.type.use==='stateRows').length,1);
  assert(owner['state-relations'].some(row=>row.field==='state'));
  assert(owner.inputs.identities.index==='metadata.own-identities');
  assert(owner.inputs.baseIds.index==='metadata.base-identities');
  assert(facts.some(row=>row.contributions?.some(item=>item.index==='metadata.base-identities')));
  assert.throws(()=>completeScalarOwner({...source,properties:[...source.properties,{name:'unexpected',type:'Unsupported'}]},numbers,candidateCatalog().catalog,{yamlKind:"Нумератор"}),/Unmapped complete owner property/);
});

test('base compatibility uses shared profiles and finite enum versions',async()=>{
  const {compatibilityConstraints}=await import('../src/compatibility-constraints.mjs');
  const source=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries.find(row=>row.symbol==='MetadataDocumentNumeratorRules');
  const constraints=compatibilityConstraints(source,candidateCatalog().catalog,{participates:{input:'adopted'},enumInput:true});
  assert.equal(constraints.length,2);
  assert.equal(constraints[0].diagnostic.code,'metadata.borrowed-compatibility');
  const versions=JSON.stringify(constraints);
  assert(versions.includes('Version8_3_8'));
  assert(!versions.includes('Версия8_3_8'));
  assert.deepEqual(constraints[0].assert.or[0],{not:{input:'adopted'}});
});

test('complete scalar owner compares every tagged boolean and enumeration with its base',async()=>{
  const {completeScalarOwner}=await import('../src/complete-scalar-owner.mjs');
  const source=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries.find(row=>row.symbol==='MetadataDocumentNumeratorRules');
  const numbers=numericOwnerOperation().modules.find(row=>row.id==='fragment.owner-numbers.documentnumerator');
  const {validation}=completeScalarOwner(source,numbers,candidateCatalog().catalog,{yamlKind:'Нумератор'});
  for(const field of ['NumberType','NumberAllowedLength','NumberPeriodicity','CheckUnique']) {
    assert(validation.constraints.some(row=>row.id===`base-present-${field}`),field);
    assert(validation.constraints.some(row=>row.id===`base-value-${field}-notified`&&row.diagnostic.severity==='warning'),field);
  }
});

test('complete owner fact snapshot derives borrowing from its source membership',async()=>{
  const {completeScalarOwner}=await import('../src/complete-scalar-owner.mjs');
  const source=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries.find(row=>row.symbol==='MetadataDocumentNumeratorRules');
  const numbers=numericOwnerOperation().modules.find(row=>row.id==='fragment.owner-numbers.documentnumerator');
  const {facts}=completeScalarOwner(source,numbers,candidateCatalog().catalog,{yamlKind:'Нумератор'});
  const snapshot=facts.find(row=>row.id.endsWith('.base-identity'));
  assert(snapshot.value.fields.some(row=>row.name==='objectBelonging'&&row.type.use==='belonging'));
  assert.deepEqual(snapshot.presence.find(row=>row.target.field==='objectBelonging').xml.missing.denotes,
    {literal:'Native'});
  assert.equal(snapshot.imports.belonging,'system.ObjectBelonging');
});


test('adopted owner defaults preserve omitted fields and explicit default values',async()=>{
  const {deriveOwnerDefaultProfiles}=await import('../src/owner-default-profiles.mjs');
  const source={properties:[{name:'enabled',type:'boolean',parameters:{defaultValueXML:false}}]};
  const fragment={inputs:{},value:{fields:[{name:'enabled'}]},presence:[{target:{field:'enabled'},
    xml:{canonical:[{form:'ordinary'}]},yaml:{default:{literal:false}}}]};
  deriveOwnerDefaultProfiles(fragment,source,{adopted:{input:'adopted'}});
  assert.deepEqual(fragment.presence[0].yaml,{missing:{denotes:{if:{input:'adopted'},
    then:{absent:true},else:{literal:false}}},omitWhen:{if:{input:'adopted'},
    then:{literal:false},else:{eq:[{field:'enabled'},{literal:false}]}}});
  const collection={inputs:{},value:{fields:[{name:'rows'}]},presence:[{target:{field:'rows'},
    xml:{missing:{denotes:{sequence:[]}},empty:[{form:'empty-element',denotes:{sequence:[]}}]},
    yaml:{missing:{denotes:{sequence:[]}}}}]};
  deriveOwnerDefaultProfiles(collection,{properties:[{name:'rows',parameters:{defaultValueXML:[]}}]},
    {adopted:{input:'adopted'}});
  assert.deepEqual(collection.presence[0].xml.missing.denotes,
    {if:{input:'adopted'},then:{absent:true},else:{sequence:[]}});
  assert.deepEqual(collection.presence[0].xml.empty,
    [{form:'empty-element',denotes:{sequence:[]}}], 'An explicit empty collection remains present');
  for(const parameters of [{defaultValueXML:false,defaultValueAdoptedXML:false},{implicitValueYAML:false}]) {
    const compact={inputs:{},value:{fields:[{name:'enabled'}]},presence:[{target:{field:'enabled'},
      xml:{missing:{denotes:{absent:true}}},yaml:{default:{literal:false}}}]};
    deriveOwnerDefaultProfiles(compact,{properties:[{name:'enabled',type:'boolean',parameters}]},
      {adopted:{input:'adopted'}});
    assert.deepEqual(compact.presence[0].yaml,{default:{literal:false}},
      'An adopted or implicit-only default retains its existing compact representation');
  }
});
