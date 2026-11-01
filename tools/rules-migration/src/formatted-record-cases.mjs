import {readFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {selectContracts} from './focused-catalog.mjs';

// Keep the independent, previously accepted expectations; replace only the
// declaration dependencies with their current versions. This small closure
// catches representation regressions without compiling the complete catalog.
export function formattedRecordCases(current) {
  const read=path=>JSON.parse(readFileSync(path,'utf8'));
  const manifest=read('tests/migration/rules-contract-cases.json');
  const saved=read('tests/migration/rules-contract-catalog/manifest.json').generatedFiles;
  const catalog=new Map(Object.values(saved).map(text=>yaml.load(text)).map(module=>[module.id,module]));
  for(const [id,module] of current)catalog.set(id,module);
  const ids=manifest.cases.filter(item=>item.id.startsWith('formatted-')).map(item=>item.id);
  if(ids.length!==9 || !ids.includes('formatted-missing-attribute'))
    throw new Error('Formatted record regression corpus changed: review independent expectations');
  const selected=selectContracts(manifest,catalog,ids);
  const plain=selected.manifest.cases.find(item=>item.id==='formatted-1');
  plain.rejectedYAML=['Заголовок: {}','Заголовок: {Форматированный: Ложь}','Заголовок: {Текст: []}'];
  plain.acceptedYAML=['Заголовок: {Форматированный: Истина}','Заголовок: {Текст: Обычный}'];
  return {modules:selected.modules,cases:selected.manifest.cases,factSources:selected.manifest.factSources??[]};
}
