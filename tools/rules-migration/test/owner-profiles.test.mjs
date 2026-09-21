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
  assert.deepEqual(base.contributions,extension.contributions);
});

test('defined type internal ID source follows the shared document rule',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/internal-types-operation.mjs','--check'],{stdio:'pipe'});
  const source=yaml.load(readFileSync('rust/declarations/probes/document-internal-types.yaml','utf8'));
  const defined=yaml.load(readFileSync('rust/declarations/probes/defined-type-internal-types.generated.yaml','utf8'));
  const ownerFragment=yaml.load(readFileSync('rust/declarations/fragments/defined-type-internal-info.generated.yaml','utf8'));
  assert.equal(defined.id,'migration.defined-type-internal-types');
  source.id=defined.id;
  source.representations.xml.fields[0].path=ownerFragment.representations.xml.fields[0].path;
  delete source.inputs.owner;
  source.inputs.ownerName={type:{kind:'scalar',scalar:'text'}};
  source.inputs.component={type:{kind:'scalar',scalar:'text'}};
  source.inputs.parent={type:{kind:'scalar',scalar:'text'}};
  source.inputs.identities={index:'metadata.own-identities'};
  for(const contribution of source.contributions)contribution.key.record.owner={
    require:{lookup:{in:{input:'identities'},key:{record:{
      component:{input:'component'},owner:{input:'parent'},kind:{literal:'DefinedType'},name:{input:'ownerName'},
    }}}},
  };
  assert.deepEqual(defined,source);
});

test('defined type identity providers extract UUID and base UUID from owner XML',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/defined-type-identity-operation.mjs','--check'],{stdio:'pipe'});
  const own=yaml.load(readFileSync('rust/declarations/probes/defined-type-own-identity.generated.yaml','utf8'));
  const base=yaml.load(readFileSync('rust/declarations/probes/defined-type-base-identity.generated.yaml','utf8'));
  for(const provider of [own,base]){
    assert.deepEqual(provider.representations.xml.content.fields.find(field=>field.field==='uuid'),{field:'uuid',path:['md:MetaDataObject','md:DefinedType'],attribute:'uuid'});
    assert.equal(provider.compose[0].bind.identity.field,'uuid');
  }
  assert.equal(own.compose[0].bind.name.field,'name');
  assert.equal(own.compose[0].bind.kind.literal,'DefinedType');
  assert.deepEqual(base.representations.xml.content.fields.find(field=>field.field==='base').path,['md:MetaDataObject','md:DefinedType','md:Properties','md:ExtendedConfigurationObject']);
  assert.equal(base.compose[0].bind.baseIdentity.field,'base');
});
