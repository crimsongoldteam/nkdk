import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {yaml} from '../src/candidate-catalog.mjs';

test('defined type profiles differ only in declared empty and missing states',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/owner-profiles-operation.mjs','--check'],{stdio:'pipe'});
  const base=yaml.load(readFileSync('rust/declarations/objects/defined-type.yaml','utf8'));
  const extension=yaml.load(readFileSync('rust/declarations/objects/defined-type-extension.generated.yaml','utf8'));
  assert.equal(base.id,'metadata.defined-type');
  assert.equal(extension.id,'metadata.defined-type-extension');
  const rule=(profile,field)=>profile.presence.find(item=>item.target?.field===field);
  assert.ok(rule(base,'type').xml.empty);
  assert.equal(rule(extension,'type').xml.empty,undefined);
  assert.ok(rule(base,'synonym').xml.canonical);
  assert.equal(rule(extension,'synonym').xml.canonical,undefined);
  assert.deepEqual(rule(extension,'synonym').yaml.omitWhen,{not:{present:{field:'synonym'}}});
  assert.deepEqual(rule(extension,'synonym').yaml.missing.denotes,{absent:true});
  const inherited=rule(extension,'objectBelonging').yaml.missing.denotes;
  assert.deepEqual(inherited.if,{present:{lookup:rule(extension,'base').yaml.missing.denotes.then.require.lookup}});
  assert.equal(inherited.then.literal,'Adopted');
  assert.equal(inherited.else.literal,'Native');
  assert.deepEqual(base.contributions,extension.contributions);
});

test('defined type internal ID source follows the shared document rule',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/internal-types-operation.mjs','--check'],{stdio:'pipe'});
  const source=yaml.load(readFileSync('rust/declarations/probes/document-internal-types.yaml','utf8'));
  const defined=yaml.load(readFileSync('rust/declarations/probes/defined-type-internal-types.generated.yaml','utf8'));
  const ownerFragment=yaml.load(readFileSync('rust/declarations/fragments/defined-type-internal-info.generated.yaml','utf8'));
  assert.equal(defined.id,'migration.defined-type-internal-types');
  assert.deepEqual(defined.representations.xml.fields[0].path,ownerFragment.representations.xml.fields[0].path);
  assert.deepEqual(defined.value,source.value);
  assert.deepEqual(defined.representations.yaml,source.representations.yaml);
  assert.equal(defined.contributions.length,source.contributions.length);
  for(const [index,contribution] of defined.contributions.entries()){
    assert.equal(contribution.index,source.contributions[index].index);
    assert.deepEqual(contribution.forEach,source.contributions[index].forEach);
    assert.deepEqual(contribution.value,source.contributions[index].value);
    assert.equal(contribution.key.record.owner.require.lookup.key.record.name.input,'ownerName');
  }
  assert.equal(defined.inputs.identitySeed.type.scalar,'text');
  const generated=defined.presence[0].yaml.missing.denotes.sequence[0].record;
  assert.equal(generated.typeId.identity.format,'uuid');
  assert.equal(generated.valueId.identity.format,'uuid');
});

test('defined type identity providers prepare owner UUID and optional base UUID',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/defined-type-identity-operation.mjs','--check'],{stdio:'pipe'});
  const own=yaml.load(readFileSync('rust/declarations/probes/defined-type-own-identity.generated.yaml','utf8'));
  const baseCatalog=yaml.load(readFileSync('rust/declarations/probes/defined-type-base-identity.generated.yaml','utf8'));
  const base=baseCatalog.declarations.find(item=>item.id==='migration.defined-type-base-identity');
  assert.deepEqual(own.representations.xml.content.fields.find(field=>field.field==='uuid'),{field:'uuid',path:['md:MetaDataObject','md:DefinedType'],attribute:'uuid'});
  assert.equal(own.compose[0].bind.identity.field,'uuid');
  assert.equal(own.compose[0].bind.name.field,'name');
  assert.equal(own.compose[0].bind.kind.literal,'DefinedType');
  assert.deepEqual(base.representations.xml.fields.find(field=>field.field==='base').path,['md:MetaDataObject','md:DefinedType','md:Properties']);
  const baseValues=baseCatalog.declarations.find(item=>item.id==='migration.defined-type-base-values');
  assert.deepEqual(baseValues.representations.xml.path,['md:ExtendedConfigurationObject']);
  assert.deepEqual(base.contributions[0].forEach,{in:{field:'base'},as:'item'});
  assert.equal(base.contributions[0].key.record.identity.require.lookup.in.input,'identities');
});

test('enumeration identity sources derive every generated type from rules.ts',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/enumeration-identity-operation.mjs','--check'],{stdio:'pipe'});
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const source=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
  const expected=source.properties.find(property=>property.type==='InternalInfo').parameters.items;
  const own=yaml.load(readFileSync('rust/declarations/probes/enumeration-own-identity.generated.yaml','utf8'));
  const internal=yaml.load(readFileSync('rust/declarations/probes/enumeration-internal-types.generated.yaml','utf8'));
  const base=yaml.load(readFileSync('rust/declarations/probes/enumeration-base-identity.generated.yaml','utf8'));
  assert.deepEqual(own.representations.xml.content.fields.find(field=>field.field==='uuid'),
    {field:'uuid',path:['md:MetaDataObject','md:Enum'],attribute:'uuid'});
  assert.deepEqual(own.presence.find(row=>row.target.field==='uuid').yaml.missing.denotes.identity.address,
    [{literal:'Перечисление'},{input:'ownerName'}]);
  const rows=internal.presence.find(row=>row.target.field==='types').yaml.missing.denotes.sequence;
  assert.deepEqual(rows.map(row=>[row.record.name.concat[0].literal,row.record.category.literal]),
    expected.map(row=>[row.name+'.',row.category]));
  assert.deepEqual(internal.representations.xml.fields[0].path,['md:MetaDataObject','md:Enum','md:InternalInfo']);
  assert(internal.value.fields.some(field=>field.name==='states'));
  assert.deepEqual(base.representations.xml.fields[0].path,['md:MetaDataObject','md:Enum','md:Properties']);
  assert.equal(base.contributions[0].key.record.identity.require.lookup.key.record.kind.literal,'Enum');
});
