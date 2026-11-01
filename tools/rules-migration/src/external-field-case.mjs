import {readFileSync} from 'node:fs';
import {emitBaseCollections} from './base-collection.mjs';
import {e2eXmlNamespaces} from './e2e-xml-namespaces.mjs';

const fixtures=[
  {id:'cf',xml:'e2e/fixtures/xml/cf/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства.xml',
    yaml:'e2e/fixtures/nkdk/cf/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойства/Таблицы/ТаблицаВсеСвойства/Свойства.yaml',
    owner:'ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства',rule:'MetadataExternalDataSourceTableRules',end:'ПоляБлокировкиДанных'},
  {id:'cfe',xml:'e2e/fixtures/xml/cfe/all-extension/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойстваExt/Tables/ТаблицаВсеСвойства.xml',
    yaml:'e2e/fixtures/nkdk/cfe/Расширение_All/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойстваExt/Таблицы/ТаблицаВсеСвойства/Свойства.yaml',
    owner:'ВнешнийИсточникДанныхВсеСвойстваExt.ТаблицаВсеСвойства',rule:'MetadataExternalDataSourceTableRules',end:'ПоляБлокировкиДанных'},
  {id:'dimension-cf',xml:'e2e/fixtures/xml/cf/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml',
    yaml:'e2e/fixtures/nkdk/cf/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойства/Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияВсеСвойства/Свойства.yaml',
    owner:'ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства',rule:'MetadataExternalDataSourceDimensionTableRules',end:'Пояснение'},
  {id:'dimension-cfe',xml:'e2e/fixtures/xml/cfe/all-extension/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойстваExt/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml',
    yaml:'e2e/fixtures/nkdk/cfe/Расширение_All/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойстваExt/Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияВсеСвойства/Свойства.yaml',
    owner:'ВнешнийИсточникДанныхВсеСвойстваExt.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства',rule:'MetadataExternalDataSourceDimensionTableRules',end:'Пояснение'},
];

export function externalFieldCase(catalog){
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  const rules=new Set(fixtures.map(fixture=>fixture.rule));
  graph.edges=graph.edges.filter(edge=>rules.has(edge.owner.symbol)&&edge.property==='fields');
  if(graph.edges.length!==rules.size)throw new Error('External data source fields collections are missing');
  graph.registrations=graph.registrations.filter(registration=>graph.edges.some(edge=>registration.type===edge.type));
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries;
  const source=readFileSync(fixtures[0].xml,'utf8');
  const {namespaces,qualified}=e2eXmlNamespaces(source,'MetaDataObject','md');
  const emitted=emitBaseCollections(graph,entries,catalog,namespaces);
  for(const result of emitted.results)if(result.status!=='candidate')throw new Error(JSON.stringify(result));
  // The existing fixture records a TypeScript-era XML patch. The common Rust
  // envelope spells out its empty semantic value and expanded QName.
  const legacyPatch='    ЗначениеЗаполнения: !xml/raw\n      $xml:\n        _xsi:type: v8:Null\n        _xsi:nil: null';
  const canonicalPatch='    ЗначениеЗаполнения: !xml/raw\n      $значение: ""\n      $xml:\n        "#replace": "true"\n        _{http://www.w3.org/2001/XMLSchema-instance}type: "{http://v8.1c.ru/8.1/data/core}Null"';
  const legacyDimensionPatch='    ЗначениеЗаполнения: !xml/raw\n      $xml:\n        _xsi:type: v8:Null';
  const canonicalDimensionPatch='    FillValue: !xml/raw\n      $xml:\n        "#replace": "true"\n        _{http://www.w3.org/2001/XMLSchema-instance}type: "{http://v8.1c.ru/8.1/data/core}Null"';
  const cases=fixtures.map(fixture=>{
    const result=emitted.results.find(result=>result.owner.symbol===fixture.rule);
    const property=emitted.modules.find(module=>module.id===result.declaration);
    const list=emitted.modules.find(module=>module.id===property.imports.items);
    const item=emitted.modules.find(module=>module.id===list.imports.item);
    const qnamePath=[...property.representations.xml.fields[0].path,...list.representations.xml.path,
      ...item.representations.xml.fields.find(field=>field.field==='type').path,
      ...catalog.get('common.type-description-types').representations.xml.path].map(qualified);
    const source=readFileSync(fixture.xml,'utf8');
    const {attributes}=e2eXmlNamespaces(source,'MetaDataObject','md');
    const fragments=[...source.matchAll(/<Field uuid="[^"]+">[\s\S]*?<\/Field>/g)].map(match=>match[0]);
    const content=readFileSync(fixture.yaml,'utf8');
    const legacyFields=content.match(new RegExp(`^Поля:\\n[\\s\\S]*?(?=^${fixture.end}:)`,'m'))?.[0].trimEnd();
    const oldPatch=fixture.id.startsWith('dimension')?legacyDimensionPatch:legacyPatch;
    const newPatch=fixture.id.startsWith('dimension')?canonicalDimensionPatch:canonicalPatch;
    if(fragments.length!==2||!legacyFields?.includes(oldPatch))throw new Error(`Expected two real fields and legacy FillValue in ${fixture.id}`);
    const fields=legacyFields.replace(oldPatch,'').replace('    ИмяВИсточникеДанных: ИмяВИсточнике\n    ИсторияВыбораПриВводе:',
      `${newPatch}\n    ИмяВИсточникеДанных: ИмяВИсточнике\n    ИсторияВыбораПриВводе:`)
      .split('\n').filter(line=>line!=='    ФормаВыбора: null').join('\n').trimEnd();
    const inputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],component:'ExternalDataSource',owner:fixture.owner};
    const xml=`<ChildObjects ${attributes}>${fragments.join('')}</ChildObjects>`;
    return {id:`real-external-source-fields-${fixture.id}`,entry:result.declaration,xml,yaml:fields,reverseYAML:legacyFields,
      xmlQNamePaths:[qnamePath],inputs,
      factBindings:{definedTypes:'metadata.defined-type-alternatives',roots:'metadata.roots',forms:'metadata.forms',identities:'metadata.own-identities'}};
  });
  return {modules:emitted.modules,
    factSources:cases.map(({entry,xml,inputs})=>({entry,xml,inputs})),cases};
}
