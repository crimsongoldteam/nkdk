import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {yaml} from '../src/candidate-catalog.mjs';
import {ownerFormLinksFragment} from '../src/owner-form-links-operation.mjs';

test('owner and common form links derive from the source rule',()=>{
 const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
 const owner=entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
 const result=ownerFormLinksFragment(owner,'fragment.enumeration-form-links');
 assert.equal(result.status,'candidate',result.reason);
 assert.deepEqual(result.module.representations.xml.fields.map(field=>field.path),[
  ['md:MetaDataObject','md:Enum','md:Properties','md:DefaultListForm'],
  ['md:MetaDataObject','md:Enum','md:Properties','md:DefaultChoiceForm'],
  ['md:MetaDataObject','md:Enum','md:Properties','md:AuxiliaryListForm'],
  ['md:MetaDataObject','md:Enum','md:Properties','md:AuxiliaryChoiceForm'],
 ]);
 assert.deepEqual(result.module.representations.yaml.fields.map(field=>field.key),[
  'ОсновнаяФормаСписка','ОсновнаяФормаДляВыбора','ДополнительнаяФормаСписка','ДополнительнаяФормаДляВыбора',
 ]);
 const changed=structuredClone(owner);
 changed.properties.find(property=>property.name==='xmlRoot').parameters.container='OtherEnum';
 changed.properties.find(property=>property.name==='defaultListForm').parameters.yaml='ГлавнаяФорма';
 const updated=ownerFormLinksFragment(changed,'fragment.other-form-links');
 assert.equal(updated.status,'candidate',updated.reason);
 assert.equal(updated.module.representations.xml.fields[0].path[1],'md:OtherEnum');
 assert.equal(updated.module.representations.yaml.fields[0].key,'ГлавнаяФорма');
 changed.properties.find(property=>property.name==='defaultListForm').parameters.unreviewed=true;
 assert.equal(ownerFormLinksFragment(changed,'fragment.bad-form-links').status,'blocked');
 const compatible=entries.filter(entry=>ownerFormLinksFragment(entry,`fragment.test.${entry.symbol}`).status==='candidate');
 assert.equal(compatible.length,18);
 assert.equal(ownerFormLinksFragment(entries.find(entry=>entry.symbol==='MetadataReportRules'),'fragment.report-form-links').status,'blocked');
 const generated=yaml.load(readFileSync('rust/declarations/fragments/enumeration-form-links.generated.yaml','utf8'));
 assert.ok(generated.declarations.some(module=>module.id==='migration.enumeration-form-links'));
 execFileSync(process.execPath,['tools/rules-migration/src/owner-form-links-operation.mjs','--check']);
});
