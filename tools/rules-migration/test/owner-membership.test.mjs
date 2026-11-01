import {factSourceOverlay} from '../src/fact-source-overlay.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attachOwnerMembership} from '../src/owner-membership.mjs';
import {readFileSync} from 'node:fs';
import {namedMemberFactSource} from '../src/named-member-fact-source.mjs';
import {candidateCatalog} from '../src/candidate-catalog.mjs';

test('owner membership uses declared role and retains unresolved operation routing',()=>{
  const key={record:{component:{input:'component'},owner:{input:'owner'},kind:{literal:'Attribute'},name:{get:{of:{var:'row'},field:'name'}}}};
  const emission={modules:[{}, {}, {contributions:[{index:'metadata.own-identities',forEach:{in:{field:'attributes'},as:'row'},key,value:{get:{of:{var:'row'},field:'uuid'}}}]}],
    results:[{ownerRequirements:{ownerFactRole:'attributes',configurationIndexUidSegment:null,operationTarget:{kind:'namedCollectionTarget'}}}]};
  attachOwnerMembership(emission);
  const child=emission.modules[2].contributions.find(row=>row.index==='metadata.path-children');
  assert.deepEqual(child,{index:'metadata.path-children',forEach:{in:{field:'attributes'},as:'row'},
    key:{record:{parent:{input:'owner'},kind:{literal:'Attribute'},name:{get:{of:{var:'row'},field:'name'}}}},
    value:{get:{of:{var:'row'},field:'uuid'}}});
  const membership=emission.modules[2].contributions.find(row=>row.index==='metadata.owner-members');
  assert.deepEqual(membership.key.record.role,{literal:'attributes'});
  assert.deepEqual(emission.results[0].ownerRequirements,{operationTarget:{kind:'namedCollectionTarget'}});
});

test('a declared index segment contributes member identities without a role',()=>{
  const key={record:{component:{input:'component'},owner:{input:'owner'},kind:{literal:'Function'},name:{get:{of:{var:'row'},field:'name'}}}};
  const emission={modules:[{}, {}, {contributions:[{index:'metadata.own-identities',forEach:{in:{field:'functions'},as:'row'},key,value:{get:{of:{var:'row'},field:'uuid'}}}]}],
    results:[{ownerRequirements:{ownerFactRole:null,configurationIndexUidSegment:'Функция'}}]};
  attachOwnerMembership(emission);
  assert.equal(emission.modules[2].contributions.length,3);
  const segment=emission.modules[2].contributions.find(row=>row.index==='metadata.owner-member-identities');
  assert.deepEqual(segment.key.record.segment,{literal:'Функция'});
  assert.equal(emission.results[0].ownerRequirements,undefined);
});

test('a collection without a named identity does not invent a child target',()=>{
  const emission={modules:[{}, {}, {contributions:[]}],results:[{ownerRequirements:{indexAddressing:'yamlPath'}}]};
  attachOwnerMembership(emission);
  assert.deepEqual(emission.modules[2].contributions,[]);
  assert.deepEqual(emission.results[0].ownerRequirements,{indexAddressing:'yamlPath'});
});

test('named member fact sources derive a different member kind from its registration',()=>{
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries;
  const edge=graph.edges.find(edge=>edge.owner.symbol==='MetadataEnumerationRules'&&edge.property==='enumValues');
  const catalog=candidateCatalog().catalog;
  const {modules,source}=namedMemberFactSource(edge,entries,catalog,{md:'http://v8.1c.ru/8.3/MDClasses'});
  assert.deepEqual(source.representations.xml.fields[0].path,
    ['md:MetaDataObject','md:Enum','md:ChildObjects']);
  assert.deepEqual(modules[1].representations.xml.path,['md:EnumValue']);
  assert.equal(source.contributions[0].key.record.role.literal,'enumValues');
  assert.ok(modules[0].representations.xml.fields.some(field=>field.attribute==='uuid'));
  const before=structuredClone(source);
  const sourceType=catalog.get('common.owner-checked-metadata-fields').inputs.members.type;
  for(const name of ['earlier','renamed']){
    const overlay=factSourceOverlay(source,{name,index:`test.${name}`,type:sourceType});
    assert.equal(overlay.local.contributions.length,2);
    assert.equal(overlay.local.contributions[1].index,`test.${name}`);
    assert.deepEqual(overlay.base.contributions[0].when.match.value.lookup.key,source.contributions[0].key);
    assert.equal(overlay.base.inputs[name].index,`test.${name}`);
    assert.deepEqual(overlay.base.contributions[0].when.match.present.then,{literal:false});
    assert.deepEqual(overlay.base.contributions[0].when.match.absent,{literal:true});
    const conditional={...source,contributions:[{...source.contributions[0],when:{literal:true}}]};
    assert.deepEqual(factSourceOverlay(conditional,{name,index:`test.${name}`,type:sourceType})
      .base.contributions[0].when.and[0],{literal:true});
  }
  assert.deepEqual(source,before);
  assert.throws(()=>factSourceOverlay(source,{name:'earlier',index:'test',type:sourceType,handler:'private'}),/Unsupported fact overlay option/);
  assert.throws(()=>factSourceOverlay(source,{name:'owner',index:'test',type:sourceType}),/conflicts/);
  assert.throws(()=>factSourceOverlay(source,{name:'earlier',index:'test',type:{kind:'scalar'}}),/typed index/);

  assert.throws(()=>namedMemberFactSource(edge,entries,catalog,
    {md:'http://v8.1c.ru/8.3/MDClasses'},{unexpected:true}),/Unsupported named member projection/);
  assert.throws(()=>namedMemberFactSource(edge,entries,catalog,
    {md:'http://v8.1c.ru/8.3/MDClasses'},{computed:{value:{kind:'sequence',item:{kind:'scalar',scalar:'text'}}}}),
    /requires record fields/);
  assert.throws(()=>namedMemberFactSource({...edge,mapping:{...edge.mapping,keyField:'missing'}},
    entries,catalog,{md:'http://v8.1c.ru/8.3/MDClasses'}),/missing its source rule/);
  assert.throws(()=>namedMemberFactSource({...edge,context:{...edge.context,ownerFactRole:null}},
    entries,catalog,{md:'http://v8.1c.ru/8.3/MDClasses'}),/registered key and role/);
});
