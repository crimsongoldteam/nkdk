import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {candidateStandardAttributes} from '../src/standard-attributes-operation.mjs';

test('all standard attribute owners share one generic production declaration',()=>{
 const candidates=JSON.parse(readFileSync('tests/migration/rules-candidates/manifest.json'));
 const contracts=JSON.parse(readFileSync('tests/migration/rules-contract-catalog/manifest.json'));
 const modules=candidateStandardAttributes(candidates,contracts);
 const ids=new Set(modules.map(module=>module.id));
 assert.ok(ids.has('metadata.standard-attribute-owner'));
 assert.ok(![...ids].some(id=>id.includes('catalog-standard-attribute')||id.includes('document-standard-attribute')));
 assert.equal(modules.filter(module=>module.id.startsWith('fragment.standard-attribute.')).length,23);
 assert.ok(ids.has('metadata.standard-attribute-support.generic-standard-link-by-type-fragment'));
 assert.ok(ids.has('metadata.standard-attribute-support.literal-choice-parameter-links-fragment'));
 for(const module of modules)for(const imported of Object.values(module.imports??{})){
   assert.ok(!imported.startsWith('candidate.')&&!imported.startsWith('contract.'),`${module.id} imports ${imported}`);
 }
 const item=modules.find(module=>module.id==='metadata.standard-attribute-item');
 assert.equal(item.compose.length,26);
 assert.equal(item.yamlOrder.length,27);
 execFileSync(process.execPath,['tools/rules-migration/src/standard-attributes-operation.mjs','--check']);
});
