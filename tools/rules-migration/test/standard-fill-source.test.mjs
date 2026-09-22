import {readFileSync} from 'node:fs';
import {globSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {standardMemberPolicies,standardFillPolicyInputs} from '../src/standard-fill-source.mjs';

test('standard FillValue policies come from the registered owner and shared declarations', () => {
  const common='packages/runtime/metadata/standardMembers/declarations.ts';
  const catalog='packages/rules/metadata/appliedObjects/metadataCatalog/standardMembers.ts';
  const policies=standardMemberPolicies({
    [common]:readFileSync(common,'utf8'),
    [catalog]:readFileSync(catalog,'utf8'),
  },'Справочник');
  assert.deepEqual(policies.get('Ref').fillValue,{policy:'forbidden'});
  assert.deepEqual(policies.get('Owner').fillValue,{
    policy:'ownerReference',ownersProperty:'owners',predefinedOnly:true,allowUnselectedTypeWhenComposite:true,
  });
  assert.deepEqual(policies.get('Code').fillValue,{
    policy:'codeFromOwner',typeProperty:'codeType',lengthProperty:'codeLength',allowedLengthProperty:'codeAllowedLength',
  });
  assert.deepEqual(policies.get('Description').fillValue,{policy:'stringFromOwner',lengthProperty:'descriptionLength'});
  assert.equal(policies.get('Parent').fillValue,undefined);
  const facts={owners:['Catalog.СправочникВладелец'],codeType:'Number',codeLength:'11',
    codeAllowedLength:'Variable',descriptionLength:'30'};
  const roots={Catalog:'Справочник'};
  assert.deepEqual(standardFillPolicyInputs(policies.get('Owner'),facts,roots),{
    policy:'ownerReference',expectedKind:'reference',owners:['Справочник.СправочникВладелец'],
    maxTextLength:'',maxNumberDigits:'',allowedTextLength:'',
  });
  assert.deepEqual(standardFillPolicyInputs(policies.get('Code'),facts,roots),{
    policy:'codeFromOwner',expectedKind:'decimal',owners:[],
    maxTextLength:'',maxNumberDigits:'11',allowedTextLength:'',
  });
  assert.equal(standardFillPolicyInputs(policies.get('Ref'),facts,roots).policy,'forbidden');
  assert.equal(standardFillPolicyInputs(policies.get('DeletionMark'),facts,roots).expectedKind,'boolean');
  assert.equal(standardFillPolicyInputs(policies.get('Description'),facts,roots).maxTextLength,'30');
  assert.equal(standardFillPolicyInputs(policies.get('Parent'),facts,roots).policy,'notSpecified');
  assert.deepEqual(standardFillPolicyInputs(policies.get('Code'),{
    ...facts,codeType:'String',codeAllowedLength:'Fixed',codeLength:'9',
  },roots),{policy:'codeFromOwner',expectedKind:'text',owners:[],
    maxTextLength:'9',maxNumberDigits:'',allowedTextLength:'Fixed'});
});

test('the same extraction reads a different owner without a catalog-specific table', () => {
  const paths=[
    'packages/runtime/metadata/standardMembers/declarations.ts',
    'packages/runtime/rule-kit.ts',
    'packages/rules/metadata/standardMembers/declarations.ts',
    'packages/rules/metadata/appliedObjects/metadataDocument/standardMembers.ts',
  ];
  const policies=standardMemberPolicies(Object.fromEntries(paths.map(path=>[path,readFileSync(path,'utf8')])),
    'Документ');
  assert.equal(policies.get('Date').fillValue.policy,'byEffectiveType');
  assert.equal(standardFillPolicyInputs(policies.get('Date'),{},{}).expectedKind,'calendar');
  assert.equal(policies.get('DeletionMark').fillValue.policy,'byEffectiveType');
});

test('static generated member pairs are extracted from accounting register rules', () => {
  const paths=[
    'packages/runtime/metadata/standardMembers/declarations.ts',
    'packages/rules/metadata/appliedObjects/metadataAccountingRegister/standardMembers.ts',
  ];
  const members=standardMemberPolicies(Object.fromEntries(paths.map(path=>[path,readFileSync(path,'utf8')])),
    'РегистрБухгалтерии');
  assert.equal(members.size,106);
  assert.equal(members.get('ExtDimension1').names.yaml,'Субконто1');
  assert.equal(members.get('ExtDimensionType50').names.yaml,'ВидСубконто50');
  assert.equal(members.get('Period').fillValue.policy,'byEffectiveType');
});

test('all standard member owner families have statically readable declarations', () => {
  const paths=[
    'packages/runtime/metadata/standardMembers/declarations.ts',
    'packages/runtime/rule-kit.ts',
    'packages/rules/metadata/standardMembers/declarations.ts',
    ...globSync('packages/rules/metadata/appliedObjects/*/standardMembers.ts'),
  ];
  const sources=Object.fromEntries(paths.map(path=>[path,readFileSync(path,'utf8')]));
  const ownerKinds=[...new Set(paths.filter(path=>path.includes('/appliedObjects/')).flatMap(path=>
    [...sources[path].matchAll(/ownerKind:\s*"([^"]+)"/g)].map(match=>match[1])))];
  assert.equal(paths.filter(path=>path.includes('/appliedObjects/')).length,14);
  assert.equal(ownerKinds.length,22);
  for(const ownerKind of ownerKinds)assert.ok(standardMemberPolicies(sources,ownerKind).size>0,ownerKind);
});
