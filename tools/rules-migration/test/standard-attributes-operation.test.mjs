import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {yaml} from '../src/candidate-catalog.mjs';
import {candidateStandardAttributes,journalStandardAttributesFragment,tabularStandardAttributesFragment,sourceStandardAttributesFragment} from '../src/standard-attributes-operation.mjs';

test('all standard attribute owners share one generic production declaration',()=>{
 const candidates=JSON.parse(readFileSync('tests/migration/rules-candidates/manifest.json'));
 const contracts=JSON.parse(readFileSync('tests/migration/rules-contract-catalog/manifest.json'));
 const modules=candidateStandardAttributes(candidates,contracts);
 const ids=new Set(modules.map(module=>module.id));
 const changed=structuredClone(candidates);
 for(const projection of changed.entries.find(row=>row.symbol==='StandardAttributeDescriptionRules').projections)
   projection.fragments=projection.fragments.map(id=>id+'.new-hash');
 assert.deepEqual(candidateStandardAttributes(changed,contracts),modules,
   'accepted contracts keep stable identities when candidate hashes change');
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

test('tabular-section standard attributes use the same collection under their child XML path',()=>{
 const candidates=JSON.parse(readFileSync('tests/migration/rules-candidates/manifest.json'));
 const contracts=JSON.parse(readFileSync('tests/migration/rules-contract-catalog/manifest.json'));
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 const owner=candidateStandardAttributes(candidates,contracts).find(module=>module.id==='metadata.standard-attribute-owner');
 const fragment=tabularStandardAttributesFragment(owner,extraction);
 assert.equal(fragment.imports.items,'metadata.standard-attribute-list');
 assert.deepEqual(fragment.representations.xml.fields[0].path,
   ['md:TabularSection','md:Properties','md:StandardAttributes']);
 assert.deepEqual(fragment.representations.yaml.fields[0],owner.representations.yaml.fields[0]);
});

test('journal standard attributes mount the generic collection at the source XML path',()=>{
 const candidates=JSON.parse(readFileSync('tests/migration/rules-candidates/manifest.json'));
 const contracts=JSON.parse(readFileSync('tests/migration/rules-contract-catalog/manifest.json'));
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 const owner=candidateStandardAttributes(candidates,contracts).find(module=>module.id==='metadata.standard-attribute-owner');
 const fragment=journalStandardAttributesFragment(owner,extraction);
 assert.equal(fragment.kind,'fragment');
 assert.equal(fragment.imports.items,'metadata.standard-attribute-list');
 assert.deepEqual(fragment.representations.xml.fields[0].path,[
   'md:MetaDataObject','md:DocumentJournal','md:Properties','md:StandardAttributes']);
 assert.deepEqual(fragment.representations.yaml.fields[0],owner.representations.yaml.fields[0]);
 assert.deepEqual(owner.representations.xml.fields[0].path,['StandardAttributes']);
});

test('document standard attributes mount the generic collection at the document path',()=>{
 const generated=yaml.load(readFileSync('rust/declarations/candidates/standard-attributes.generated.yaml','utf8'));
 const fragment=generated.declarations.find(module=>module.id==='fragment.document-standard-attributes');
 assert.ok(fragment);
 assert.equal(fragment.imports.items,'metadata.standard-attribute-list');
 assert.deepEqual(fragment.representations.xml.fields[0].path,
   ['md:MetaDataObject','md:Document','md:Properties','md:StandardAttributes']);
});

test('a third owner mounts standard attributes from its own rule without owner-specific code',()=>{
 const candidates=JSON.parse(readFileSync('tests/migration/rules-candidates/manifest.json'));
 const contracts=JSON.parse(readFileSync('tests/migration/rules-contract-catalog/manifest.json'));
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 const owner=candidateStandardAttributes(candidates,contracts).find(module=>module.id==='metadata.standard-attribute-owner');
 const rule=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
 const fragment=sourceStandardAttributesFragment(owner,rule,'fragment.enumeration-standard-attributes');
 const generated=yaml.load(readFileSync('rust/declarations/candidates/standard-attributes.generated.yaml','utf8'));
 assert.ok(generated.declarations.some(module=>module.id===fragment.id));
 assert.equal(fragment.kind,'fragment');
 assert.deepEqual(fragment.representations.xml.fields[0].path,
   ['md:MetaDataObject','md:Enum','md:Properties','md:StandardAttributes']);
 assert.equal(fragment.representations.yaml.fields[0].key,'СтандартныеРеквизиты');
 assert.equal(fragment.imports.items,'metadata.standard-attribute-list');
 const mutated=structuredClone(rule);
 mutated.properties.find(property=>property.name==='standardAttributes').parameters.yaml='ДругоеИмя';
 assert.throws(()=>sourceStandardAttributesFragment(owner,mutated,
   'fragment.enumeration-standard-attributes'),/Changed standard attribute attachment/);
 const renamed=structuredClone(rule);
 renamed.properties.find(property=>property.name==='xmlRoot').parameters.container='RenamedEnum';
 assert.deepEqual(sourceStandardAttributesFragment(owner,renamed,'fragment.renamed-standard-attributes')
   .representations.xml.fields[0].path,
   ['md:MetaDataObject','md:RenamedEnum','md:Properties','md:StandardAttributes']);
 const owners=extraction.entries.filter(entry=>entry.itemType?.startsWith('Metadata') &&
   entry.properties.some(property=>property.parameters?.type==='StandardAttributeDescriptions'));
 assert.equal(owners.length,25);
 for(const entry of owners){
  const attached=sourceStandardAttributesFragment(owner,entry,`fragment.test.${entry.symbol}`);
  assert.equal(attached.imports.items,'metadata.standard-attribute-list',entry.symbol);
  assert.deepEqual(attached.representations.xml.fields[0].path.slice(-2),
    ['md:Properties','md:StandardAttributes'],entry.symbol);
 }
});
