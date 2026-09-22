import {readFileSync} from 'node:fs';
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
