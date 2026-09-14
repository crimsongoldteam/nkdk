import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {emitCandidates} from './emit.mjs';
import {loadSources} from './source-snapshot.mjs';

export function hiddenScalarCases(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
  loadSources(extraction.sourceHashes);
  const source=extraction.entries.find(entry=>entry.symbol==='MetadataCommandRules');
  const selected={...source,properties:source.properties.filter(p=>['objectBelonging','shortcut'].includes(p.name))};
  const emitted=emitCandidates([selected],catalog);
  if(emitted.entries[0].properties.some(p=>p.status!=='candidate'))throw new Error('Incomplete hidden field contract');
  const entry=emitted.entries[0].projections[0].id;
  const [example]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{encoding:'utf8',input:JSON.stringify([{
    xml:'e2e/fixtures/xml/cf/Enums/ПеречислениеВсеСвойства.xml',yaml:'e2e/fixtures/nkdk/cf/Перечисление/ПеречислениеВсеСвойства/Свойства.yaml',
    xmlItems:[{type:'Command',name:'Команда1'}],yamlPath:['Команды','Команда1'],fields:[{xml:'ObjectBelonging'},{xml:'Shortcut',yaml:'СочетаниеКлавиш'}],
  }])}));
  const common={entry,source:example.source};
  return {modules:emitted.modules,cases:[
    {...common,id:'hidden-command-default',xml:example.xml,yaml:example.yaml},
    ...['Adopted','Unknown'].map(value=>({...common,id:'hidden-command-'+value,
      xml:example.xml.replace('<Properties>','<Properties><ObjectBelonging>'+value+'</ObjectBelonging>'),annotation:'ObjectBelonging: !xml/raw'})),
  ]};
}
