import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {candidateStandardAttributes} from '../src/standard-attributes-operation.mjs';

test('complete standard attribute contracts become owner-specific candidate declarations',()=>{
 const candidates=JSON.parse(readFileSync('tests/migration/rules-candidates/manifest.json'));
 const contracts=JSON.parse(readFileSync('tests/migration/rules-contract-catalog/manifest.json'));
 const modules=candidateStandardAttributes(candidates,contracts);
 assert.equal(modules.length,33);
 const ids=new Set(modules.map(module=>module.id));
 assert.ok(ids.has('metadata.catalog-standard-attribute-owner'));
 assert.ok(ids.has('metadata.document-standard-attribute-owner'));
 assert.equal(modules.filter(module=>module.id.startsWith('fragment.standard-attribute.')).length,25);
 for(const module of modules)for(const imported of Object.values(module.imports??{})){
   assert.ok(!imported.startsWith('candidate.')&&!imported.startsWith('contract.'),`${module.id} imports ${imported}`);
 }
 for(const owner of ['catalog','document']){
   const item=modules.find(module=>module.id===`metadata.${owner}-standard-attribute-item`);
   assert.equal(item.compose.length,26);
   assert.equal(item.yamlOrder.length,27);
 }
 execFileSync(process.execPath,['tools/rules-migration/src/standard-attributes-operation.mjs','--check']);
});
