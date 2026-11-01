import {readFileSync} from 'node:fs';
import {emitBaseCollections} from './base-collection.mjs';
import {e2eXmlNamespaces} from './e2e-xml-namespaces.mjs';

const xmlFixture='e2e/fixtures/xml/cf/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства.xml';
const yamlFixture='e2e/fixtures/nkdk/cf/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойства/Свойства.yaml';

export function externalFunctionCase(catalog){
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  const edge=graph.edges.find(edge=>edge.owner.symbol==='MetadataExternalDataSourceRules'&&edge.property==='functions');
  if(!edge)throw new Error('External data source functions collection is missing');
  graph.edges=[edge];
  graph.registrations=graph.registrations.filter(registration=>registration.type===edge.type);
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries;
  const source=readFileSync(xmlFixture,'utf8');
  const {attributes,namespaces,qualified}=e2eXmlNamespaces(source,'MetaDataObject','md');
  const emitted=emitBaseCollections(graph,entries,catalog,namespaces);
  if(emitted.results[0]?.status!=='candidate')throw new Error(JSON.stringify(emitted.results[0]));
  const fragments=[...source.matchAll(/<Function uuid="[^"]+">[\s\S]*?<\/Function>/g)].map(match=>match[0]);
  const yaml=readFileSync(yamlFixture,'utf8');
  const functions=yaml.slice(yaml.indexOf('Функции:')).trimEnd();
  if(fragments.length!==3||!functions.startsWith('Функции:\n'))throw new Error('Expected three real external data source functions');
  const qnamePath=['ChildObjects','Function','Properties','Type','v8:Type'].map(qualified);
  const inputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],xmlDefaultVariant:'base',component:'ExternalDataSource',owner:'ВнешнийИсточникДанныхВсеСвойства'};
  const xml=`<ChildObjects ${attributes}>${fragments.join('')}</ChildObjects>`;
  return {modules:emitted.modules,factSources:[{entry:emitted.results[0].declaration,xml,inputs}],cases:[{id:'real-external-source-functions',entry:emitted.results[0].declaration,
    xml,yaml:functions,xmlQNamePaths:[qnamePath],
    inputs,
    factBindings:{identities:'metadata.own-identities'}}]};
}
