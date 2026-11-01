import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {yaml} from '../src/candidate-catalog.mjs';

test('journal identity declarations follow rules.ts and remain generated', () => {
  execFileSync(process.execPath,
    ['tools/rules-migration/src/journal-identity-operation.mjs','--check']);
  const own=yaml.load(readFileSync('rust/declarations/probes/journal-own-identity.generated.yaml','utf8'));
  assert.equal(own.id,'migration.journal-own-identity');
  assert.deepEqual(own.representations.xml.content.fields[0].path,
    ['md:MetaDataObject','md:DocumentJournal','md:Properties','md:Name']);
  const catalog=yaml.load(readFileSync('rust/declarations/probes/journal-child-identities.generated.yaml','utf8'));
  for(const kind of ['columns','commands']) {
    const source=catalog.declarations.find(row=>row.id===`migration.journal-${kind}-identity-source`);
    assert.ok(source);
    assert.equal(source.contributions[0].index,'metadata.own-identities');
    assert.equal(source.contributions[1].index,'metadata.base-identities');
  }
});
