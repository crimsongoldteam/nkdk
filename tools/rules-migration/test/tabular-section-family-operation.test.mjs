import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {yaml} from '../src/candidate-catalog.mjs';
import {generatedTypeFormLink} from '../src/type-form-link-declaration.mjs';

test('type-owned form link is generated from the shared form contract and root lexicon',()=>{
  assert.equal(readFileSync('rust/declarations/common/type-form-link.generated.yaml','utf8'),
    generatedTypeFormLink());
  const declaration=yaml.load(generatedTypeFormLink());
  assert.equal(declaration.id,'common.type-form-link');
  assert.equal(declaration.inputs.typeItems.type.kind,'sequence');
  assert.equal(declaration.representations.yaml.parts[0].optional,'owner');
});

test('ten owners and their extensions reuse one ordered declarative tabular-section assembly',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/tabular-section-family-operation.mjs','--check']);
  const catalog=yaml.load(readFileSync('rust/declarations/candidates/tabular-sections.generated.yaml','utf8'));
  const manifest=JSON.parse(readFileSync('tests/migration/tabular-section-family-operation.json','utf8'));
  assert.equal(manifest.cases.length,21);
  assert.equal(new Set(manifest.cases.map(item=>item.entry)).size,10);
  assert.equal(new Set(manifest.factSources.map(item=>item.id??item.entry)).size,manifest.factSources.length);
  for(const item of manifest.cases) {
    const entry=catalog.declarations.find(module=>module.id===item.entry);
    assert(entry?.xmlOrder?.includes('items'));
    assert.match(item.xml,/<(?:\w+:)?TabularSection\b/);
    if(item.id.includes('-minimal-'))assert.equal(item.yaml.trim(),'ДлинаНомераСтроки: 9');
    else assert(item.yaml.includes('Реквизиты:'));
    assert(item.factSourceEntries.some(entry=>entry.endsWith('.root')));
    assert(item.factSourceEntries.some(id=>id.includes('.form.')));
    assert(item.source.some(source=>source.path.includes('/Forms/')));
    assert(item.source.every(source=>source.sha256.length===64));
  }
  const business=manifest.cases.find(item=>item.id.includes('businessprocesses'));
  assert(manifest.factSources.some(source=>business.factSourceEntries.includes(source.id) &&
    source.entry==='migration.form-metadata-header' &&
    source.id.includes('.Catalog.СправочникРеквизит.') && source.inputs.parent.length===36 &&
    source.inputs.name==='ФормаВыбора'));
  const extensions=manifest.cases.filter(item=>item.id.endsWith('-cfe'));
  assert.equal(extensions.length,10);
  for(const extension of extensions) {
    const base=manifest.cases.find(item=>item.id===extension.id.replace(/-cfe$/,'-cf'));
    assert.equal(extension.entry,base.entry);
    assert.notDeepEqual(extension.factSourceEntries,base.factSourceEntries);
    assert.deepEqual(extension.inputs.elidableNames,[]);
    assert.equal(extension.inputs.componentKind,'extension');
    assert.match(extension.inputs.component,/^cfe\//);
    assert.match(extension.adaptation,/legacy extension YAML/);
  }
  const characteristic=extensions.find(item=>item.id.includes('chartsofcharacteristictypes'));
  assert.match(characteristic.yaml,/НомерСтроки:\n    \{\}/);
});
