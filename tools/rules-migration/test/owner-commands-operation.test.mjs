import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {yaml} from '../src/candidate-catalog.mjs';
import {ownerCommandsFragment} from '../src/owner-commands-operation.mjs';

test('command collection fragment follows the source owner root',()=>{
 const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
 const owner=symbol=>entries.find(entry=>entry.symbol===symbol);
 for(const [symbol,file,id] of [
  ['MetadataDocumentRules','document','fragment.document-commands'],
  ['MetadataDocumentJournalRules','journal','fragment.journal-commands'],
 ]){
  const result=ownerCommandsFragment(owner(symbol),id);
  assert.equal(result.status,'candidate',result.reason);
  assert.deepEqual(result.module,yaml.load(readFileSync(`rust/declarations/fragments/${file}-commands.yaml`,'utf8')));
 }
 const enumeration=ownerCommandsFragment(owner('MetadataEnumerationRules'),'fragment.enumeration-commands');
 assert.equal(enumeration.status,'candidate',enumeration.reason);
 assert.deepEqual(enumeration.module.representations.xml.fields[0].path,
  ['md:MetaDataObject','md:Enum','md:ChildObjects']);
 const changed=structuredClone(owner('MetadataEnumerationRules'));
 changed.properties.find(property=>property.name==='xmlRoot').parameters.container='OtherEnum';
 changed.properties.find(property=>property.name==='commands').parameters.yaml='Действия';
 const updated=ownerCommandsFragment(changed,'fragment.other-commands');
 assert.equal(updated.status,'candidate',updated.reason);
 assert.equal(updated.module.representations.xml.fields[0].path[1],'md:OtherEnum');
 assert.equal(updated.module.representations.yaml.fields[0].key,'Действия');
 changed.properties.find(property=>property.name==='commands').parameters.unreviewed=true;
 assert.equal(ownerCommandsFragment(changed,'fragment.bad-commands').status,'blocked');
 const compatible=entries.filter(entry=>ownerCommandsFragment(entry,`fragment.test.${entry.symbol}`).status==='candidate');
 assert.equal(compatible.length,17);
 const generated=yaml.load(readFileSync('rust/declarations/fragments/enumeration-commands.generated.yaml','utf8'));
 assert.ok(generated.declarations.some(module=>module.id==='migration.enumeration-commands'));
 execFileSync(process.execPath,['tools/rules-migration/src/owner-commands-operation.mjs','--check']);
});
