import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {ownerContracts} from '../src/owner-contracts.mjs';
import {yaml} from '../src/candidate-catalog.mjs';

test('owner contracts prepare inputs needed by selected property declarations',()=>{
  const manifest=JSON.parse(readFileSync('tests/migration/rules-candidates/manifest.json','utf8'));
  const catalog=new Map(Object.values(manifest.generatedFiles).map(text=>{
    const declaration=yaml.load(text);return [declaration.id,declaration];
  }));
  const snapshot=JSON.parse(readFileSync('tests/migration/metadata-root-index-inventory.json','utf8'));
  const result=ownerContracts(manifest,catalog,snapshot);
  const document=result.cases.find(row=>row.id==='e2e-properties-ДокументВсеСвойства');
  assert.equal(document.inputs.ownerRoot,'Document');
  assert.equal(document.inputs.containingOwnerName,'ДокументВсеСвойства');
});

test('owner fixture joins selected properties and the complete child collection from one e2e pair',()=>{
  const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства.xml',
      yaml:'e2e/fixtures/nkdk/cf/Документ/ДокументВсеСвойства/Свойства.yaml',
      ownerFields:{properties:[{xml:'DefaultObjectForm',yaml:'ОсновнаяФормаОбъекта'},
        {xml:'DefaultListForm',yaml:'ОсновнаяФормаСписка'},
        {xml:'DefaultChoiceForm',yaml:'ОсновнаяФормаДляВыбора'},
        {xml:'AuxiliaryObjectForm'},{xml:'AuxiliaryListForm'},{xml:'AuxiliaryChoiceForm'}],
        collection:{item:'Attribute',yaml:'Реквизиты'}}}]),encoding:'utf8'}));
  assert.match(result.xml,/<(?:\w+:)?DefaultChoiceForm>Document\.ДокументВсеСвойства\.Form\.ФормаВыбора/);
  assert.match(result.xml,/<(?:\w+:)?Attribute\s+uuid=/);
  assert.equal(result.yaml.includes('ОсновнаяФормаДляВыбора: ФормаВыбора'),true);
  assert.equal(result.yaml.includes('Реквизиты:'),true);
  assert.equal(result.xml.includes('DefaultObjectForm'),true);
  assert.equal(result.xml.includes('Posting'),false);
  assert.equal(result.source.length,2);
});
