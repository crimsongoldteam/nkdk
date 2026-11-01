import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {yaml} from '../src/candidate-catalog.mjs';

test('complete journal owner is generated with every rules.ts property accounted for', () => {
  execFileSync(process.execPath,
    ['tools/rules-migration/src/journal-owner-operation.mjs','--check']);
  const module=yaml.load(readFileSync('rust/declarations/objects/journal.generated.yaml','utf8'));
  assert.equal(module.id,'metadata.journal');
  assert.equal(module.kind,'object');
  assert.equal(module.imports.columns,'fragment.journal-columns');
  assert.equal(module.imports.commands,'fragment.journal-commands');
  const coverage=JSON.parse(readFileSync('tests/migration/journal-owner-coverage.json','utf8'));
  assert.deepEqual(coverage.pending,[]);
  assert.equal(coverage.assembled.length,24);
  const routes=yaml.load(readFileSync('rust/operations/journal.routes.generated.yaml','utf8'));
  assert.equal(routes.routes[0].owners.cf,'metadata.journal');
  assert.equal(routes.routes[0].owners.cfe,'metadata.journal');
  assert.deepEqual(routes.factRoutes.map(route=>route.xmlDir),
    ['Documents','CommandGroups','CommandGroups']);
});
