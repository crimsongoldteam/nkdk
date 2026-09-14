import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {emitBaseCollections} from './base-collection.mjs';
import {loadSources,checkSnapshot} from './source-snapshot.mjs';

// Real complete child elements, not selected Properties fields. The enclosing
// enumeration's other collections are outside this child-conversion boundary.
export function enumValueCases(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const sources=loadSources(extraction.sourceHashes);
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  checkSnapshot(sources,graph.sourceHashes);
  graph.edges=graph.edges.filter(edge=>edge.item.symbol==='MetadataEnumerationValueRules');
  if(graph.edges.length!==1)throw new Error('Ambiguous enumeration value collection');
  const emitted=emitBaseCollections(graph,extraction.entries,catalog);
  if(emitted.results[0].status!=='candidate')throw new Error(JSON.stringify(emitted.results));
  const request={xml:'e2e/fixtures/xml/cf/Enums/ПеречислениеВсеСвойства.xml',
    yaml:'e2e/fixtures/nkdk/cf/Перечисление/ПеречислениеВсеСвойства/Свойства.yaml',
    collection:{item:'EnumValue',yaml:'Значения'}};
  const [example]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([request]),encoding:'utf8'}));
  const entry=emitted.results[0].declaration;
  const inputs={component:'cf',owner:example.ownerIdentity,defaultLanguage:'ru',registeredLanguages:['ru','en']};
  return {modules:emitted.modules,
    factSources:[{entry,xml:example.xml,inputs}],
    cases:[{id:'e2e-complete-enum-values-cf',entry,inputs,factBindings:{identities:'metadata.own-identities'},
      xml:example.xml,yaml:example.yaml,source:example.source,
      adaptation:'Complete EnumValue elements; only outer MDClasses namespace removed; cf conversion branch, not extension/owner acceptance'}]};
}
