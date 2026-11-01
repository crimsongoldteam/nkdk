import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {commandCollectionOperation} from '../src/command-collection-operation.mjs';
import {candidateCatalog} from '../src/candidate-catalog.mjs';

test('command collection is reproducible from rules.ts and keeps module routing explicit',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/command-collection-operation.mjs','--check'],{stdio:'pipe'});
  const {modules,requirements}=commandCollectionOperation(candidateCatalog().catalog);
  assert.equal(modules.length,2);
  assert.equal(modules[0].id,'metadata.command-row');
  assert.equal(modules[1].id,'metadata.command-rows');
  assert.equal(modules[0].value.fields.length,16);
  assert.equal(modules[0].value.fields.some(field=>field.name==='states'),true);
  assert.equal(modules[0].value.fields.some(field=>field.name==='base'),true);
  assert.deepEqual(modules[0].presence.find(item=>item.target.field==='states').yaml.default,{sequence:[]});
  assert.deepEqual(modules[0].value.fields.find(field=>field.name==='picture').type.with,{allowEmpty:true});
  const picture=modules[0].presence.find(item=>item.target.field==='picture');
  assert.equal(picture.xml.empty,undefined,'An explicit empty picture must remain a value');
  assert.deepEqual(picture.yaml.missing.denotes.then,{absent:true});
  assert.deepEqual(picture.yaml.missing.denotes.else,{variant:{name:'Пустая',value:{record:{}}}});
  assert.deepEqual(picture.yaml.omitWhen.then,{literal:false},'An adopted command must retain explicit empty pictures');
  assert.deepEqual(modules[1].value.item.bind.baseIds,{input:'baseIds'});
  for(const field of ['commandParameterType','parameterUseMode','modifiesData','representation','shortcut','onMainServerUnavalableBehavior']) {
    const presence=modules[0].presence.find(item=>item.target.field===field);
    assert.equal(presence.xml.canonical.some(form=>form.form==='missing'),true,field);
  }
  assert.equal(modules[0].value.fields.some(field=>field.name==='commandModule'),false);
  assert.deepEqual(requirements.resources.properties,['commandModule']);
  assert.equal(modules[1].representations.yaml.kind,'record-mapping');
});
