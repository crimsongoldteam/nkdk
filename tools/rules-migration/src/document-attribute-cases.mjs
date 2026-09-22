import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {emitBaseCollections} from './base-collection.mjs';
import {loadSources,checkSnapshot} from './source-snapshot.mjs';

export function documentAttributeCases(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  checkSnapshot(loadSources(extraction.sourceHashes),graph.sourceHashes);
  graph.edges=graph.edges.filter(edge=>edge.owner.symbol==='MetadataDocumentRules'&&edge.property==='attributes');
  if(graph.edges.length!==1)throw new Error('Ambiguous document attribute collection');
  const emitted=emitBaseCollections(graph,extraction.entries,catalog,{md:'http://v8.1c.ru/8.3/MDClasses'});
  const boundary=emitted.results[0];
  if(boundary.status!=='candidate')throw new Error(`Document attribute collection blocked: ${JSON.stringify(boundary.blockers)}`);
  const [example]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства.xml',
      yaml:'e2e/fixtures/nkdk/cf/Документ/ДокументВсеСвойства/Свойства.yaml',linkContext:true,
      collection:{item:'Attribute',yaml:'Реквизиты',preserveNamespace:true}}]),encoding:'utf8'}));
  const inputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],component:'cf',owner:example.ownerIdentity,...example.linkContext};
  const entry=boundary.declaration;
  return {modules:emitted.modules,requirements:{inputs:boundary.inputRequirements,owner:boundary.ownerRequirements},
    factSources:[{entry,xml:example.xml,inputs}],
    cases:[{id:'e2e-complete-document-attributes-cf',entry,xml:example.xml,yaml:example.yaml,inputs,xmlQNamePaths:example.xmlQNamePaths,
      factBindings:{identities:'metadata.own-identities'},source:example.source,
      adaptation:'Complete document Attribute elements; owner link context is derived from the immutable XML and UUIDs from generated identity facts'}]};
}
