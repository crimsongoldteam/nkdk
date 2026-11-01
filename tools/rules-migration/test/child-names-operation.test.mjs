import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {yaml} from '../src/candidate-catalog.mjs';
import {childNamesFragment} from '../src/child-names-operation.mjs';

test('form and template names follow the owner rule without custom XML paths',()=>{
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 const owner=symbol=>extraction.entries.find(entry=>entry.symbol===symbol);
 const journal=childNamesFragment(owner('MetadataDocumentJournalRules'),'fragment.journal-child-names');
 assert.equal(journal.status,'candidate');
 const previous=yaml.load(readFileSync('rust/declarations/fragments/journal-child-names.yaml','utf8'));
 assert.deepEqual(journal.module,previous);
 const enumeration=childNamesFragment(owner('MetadataEnumerationRules'),'fragment.enumeration-child-names');
 assert.equal(enumeration.status,'candidate');
 const register=childNamesFragment(owner('MetadataAccountingRegisterRules'),'fragment.register-child-names');
 assert.equal(register.status,'candidate',register.reason);
 assert.equal(register.module.representations.yaml.fields[1].key,'Макеты');
 const processor=childNamesFragment(owner('MetadataDataProcessorRules'),'fragment.processor-child-names');
 assert.equal(processor.status,'candidate',processor.reason);
 assert.deepEqual(processor.remaining,['forms.itemRule']);
 const cube=childNamesFragment(owner('MetadataExternalDataSourceCubeRules'),'fragment.cube-child-names');
 assert.equal(cube.status,'candidate',cube.reason);
 assert.deepEqual(cube.remaining,['forms.operationTarget','templates.operationTarget']);
 assert.deepEqual(enumeration.module.representations.xml.fields.map(field=>field.path),[
   ['md:MetaDataObject','md:Enum','md:ChildObjects','md:Form'],
   ['md:MetaDataObject','md:Enum','md:ChildObjects','md:Template'],
 ]);
 const changed=structuredClone(owner('MetadataEnumerationRules'));
 changed.properties.find(property=>property.name==='xmlRoot').parameters.container='OtherEnum';
 changed.properties.find(property=>property.name==='templates').parameters.folderName='Макеты';
 changed.properties.find(property=>property.name==='templates').parameters.operationTarget.folderName='Макеты';
 const updated=childNamesFragment(changed,'fragment.renamed-child-names');
 assert.equal(updated.status,'candidate');
 assert.equal(updated.module.representations.xml.fields[0].path[1],'md:OtherEnum');
 assert.equal(updated.module.representations.yaml.fields[1].key,'Макеты');
 changed.properties.find(property=>property.name==='templates').parameters.operationTarget.extra=true;
 assert.equal(childNamesFragment(changed,'fragment.rejected-child-names').status,'blocked');
 const families=extraction.entries.filter(entry=>entry.properties.some(property=>property.parameters?.type==='XMLRoot') &&
   entry.properties.some(property=>['ChildFormNames','ChildTemplateNames'].includes(property.parameters?.type)));
 assert.equal(families.length,21);
 for(const entry of families) {
  const projected=childNamesFragment(entry,`fragment.test.${entry.symbol}`);
  assert.equal(projected.status,'candidate',`${entry.symbol}: ${projected.reason}`);
 }
 const generated=yaml.load(readFileSync('rust/declarations/fragments/enumeration-child-names.generated.yaml','utf8'));
 assert.equal(generated.id,'fragment.enumeration-child-names');
 const object=yaml.load(readFileSync('rust/declarations/objects/enumeration-child-names.generated.yaml','utf8'));
 assert.equal(object.id,'migration.enumeration-child-names');
 execFileSync(process.execPath,['tools/rules-migration/src/child-names-operation.mjs','--check']);
});
