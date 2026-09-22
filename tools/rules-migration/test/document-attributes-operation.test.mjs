import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {yaml} from '../src/candidate-catalog.mjs';

test('document attribute operation publishes its source-derived declarations and e2e case',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/document-attributes-operation.mjs','--check'],{stdio:'pipe'});
  const catalog=yaml.load(readFileSync('rust/declarations/candidates/document-attributes.generated.yaml','utf8'));
  const owner=catalog.declarations.find(module=>module.id==='metadata.document-attributes');
  const fragment=catalog.declarations.find(module=>module.id==='fragment.document-attributes');
  assert.ok(owner);
  assert.deepEqual(fragment.representations.xml.fields[0].path,['md:MetaDataObject','md:Document','md:ChildObjects']);
  const cases=JSON.parse(readFileSync('tests/migration/document-attributes-operation.json','utf8'));
  assert.equal(cases.cases.length,1);
  assert.equal(cases.cases[0].entry,owner.id);
  assert.equal(owner.contributions.some(item=>item.index==='metadata.owner-members'),true);
  assert.equal(cases.requirements.owner.operationTarget.kind,'namedCollectionTarget');
});
