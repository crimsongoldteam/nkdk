import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {candidateCatalog} from '../src/candidate-catalog.mjs';
import {internalInfoAttachment} from '../src/internal-info-attachment.mjs';
import {readyAttachment} from '../src/ready-attachment.mjs';

test('internal types derive from source parameters without owner-specific defaults',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/internal-info-operation.mjs','--check'],{stdio:'pipe'});
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const {catalog}=candidateCatalog();
  for(const [symbol,previous] of [['MetadataDocumentRules','fragment.document-internal-info'],['MetadataDocumentJournalRules','fragment.journal-internal-info'],['MetadataEnumerationRules',null],['MetadataDefinedTypeRules',null]]) {
    const owner=entries.find(e=>e.symbol===symbol);
    const actual=internalInfoAttachment(owner);
    assert.equal(actual.status,'candidate');
    const property=owner.properties.find(p=>p.type==='InternalInfo');
    const attachment=readyAttachment(property,catalog,[],owner);
    assert.equal(attachment.status,'ready');
    assert.equal(attachment.fragment,actual.module.id);
    assert.deepEqual(attachment.modules,[actual.module]);
    assert.equal(actual.module.presence[0].yaml.default.sequence.length,property.parameters.items.length);
    if(symbol==='MetadataDefinedTypeRules') {
      const generated=catalog.get('fragment.defined-type-internal-info');
      assert.deepEqual(generated?.presence,actual.module.presence);
      assert.deepEqual(generated?.representations,actual.module.representations);
    }
    if(previous) {
      const old=catalog.get(previous);
      assert.deepEqual(actual.module.presence,old.presence);
      assert.deepEqual(actual.module.representations,old.representations);
      assert.deepEqual(actual.module.inputs,old.inputs);
    }
    const renamed=structuredClone(owner);
    renamed.properties.find(p=>p.type==='XMLRoot').parameters.container='OtherRoot';
    renamed.properties.find(p=>p.type==='InternalInfo').parameters.items=[{name:'DifferentType',category:'OtherCategory'}];
    const changed=internalInfoAttachment(renamed);
    assert.equal(changed.status,'candidate');
    assert.equal(changed.module.representations.xml.fields[0].path[1],'md:OtherRoot');
    assert.equal(changed.module.presence[0].yaml.default.sequence[0].record.category.literal,'OtherCategory');
    renamed.properties.find(p=>p.type==='InternalInfo').parameters.extra=true;
    assert.equal(internalInfoAttachment(renamed).status,'blocked');
  }
});
