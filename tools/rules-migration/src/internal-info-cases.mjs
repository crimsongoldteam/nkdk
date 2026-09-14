import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {internalInfoAttachment} from './internal-info-attachment.mjs';
import {loadSources} from './source-snapshot.mjs';

export function internalInfoCases(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
  loadSources(extraction.sourceHashes);
  const modules=[],cases=[],factSources=[];
  for(const [symbol,folder,name] of [
    ['MetadataDocumentRules','Documents','ДокументВсеСвойства'],
    ['MetadataDocumentJournalRules','DocumentJournals','ЖурналДокументовВсеСвойства'],
    ['MetadataEnumerationRules','Enums','ПеречислениеВсеСвойства'],
  ]) {
    const result=internalInfoAttachment(extraction.entries.find(e=>e.symbol===symbol));
    if(result.status!=='candidate')throw new Error(result.reason);
    const fragment=result.module;
    const producer=structuredClone(catalog.get('migration.journal-internal-types'));
    producer.id=fragment.id+'.source';
    producer.representations=structuredClone(fragment.representations);
    producer.namespaces=fragment.namespaces;
    const module={format:'nkdk-declarations/1',kind:'object',id:fragment.id+'.operation',
      imports:{part:fragment.id},inputs:{owner:fragment.inputs.owner,name:fragment.inputs.name,typeIds:{index:'metadata.internal-type-ids'},valueIds:{index:'metadata.internal-value-ids'}},
      compose:[{use:'part',bind:Object.fromEntries(Object.keys(fragment.inputs).map(name=>[name,{input:name}]))}],
      value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
    const [example]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{encoding:'utf8',input:JSON.stringify([{xml:`e2e/fixtures/xml/cf/${folder}/${name}.xml`,internalTypes:true}])}));
    modules.push(fragment,producer,module);
    factSources.push({entry:producer.id,xml:example.xml,inputs:{owner:example.owner}});
    cases.push({id:'source-internal-info-'+symbol,entry:module.id,xml:example.xml,yaml:'',inputs:{owner:example.owner,name:example.name},source:example.source,factBindings:{typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids'}});
  }
  return {modules,cases,factSources};
}
