import {readFileSync} from 'node:fs';
import {sourceProjection,relativeSourceProjection} from './source-projection.mjs';
import {literalFixture} from './test-cases.mjs';
import {yaml} from './candidate-catalog.mjs';
import {dcsProductionFactSources} from './declaration-fact-fixtures.mjs';
import {emitCollections} from './collection-emission.mjs';
import {referenceDeclarationModule} from './declaration-identifiers.mjs';

// Source expectations are independent of the generated declaration. All
// fifteen properties are assembled together; no per-property runtime exists.
export function dataSetFieldCases(catalog) {
  const base='packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/';
  const path=base+'__fixtures__/data.ts';
  const source=readFileSync(path,'utf8');
  const owner=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries
    .find(row=>row.symbol==='DataCompositionSchemaDataSetFieldRules');
  const namespaces={xsi:'http://www.w3.org/2001/XMLSchema-instance',xs:'http://www.w3.org/2001/XMLSchema',
    v8:'http://v8.1c.ru/8.1/data/core',dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema',
    dcscor:'http://v8.1c.ru/8.1/data-composition-system/core',dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings',
    v8ui:'http://v8.1c.ru/8.1/data/ui',ent:'http://v8.1c.ru/8.1/data/enterprise'};
  const projection=sourceProjection(owner,catalog,{properties:owner.properties.map(row=>row.name),
    id:'working.dcs-data-set-field',root:'Field',namespaces});
  const library=relativeSourceProjection(owner,catalog,{properties:owner.properties.map(row=>row.name),
    id:'common.data-composition-schema-data-set-field',namespaces});
  const libraryOwner={format:'nkdk-declarations/1',kind:'object',id:'working.dcs-data-set-field-library',
    imports:{source:library.value.id},inputs:projection.value.inputs,
    value:{kind:'record',fields:[{name:'value',type:{use:'source',bind:Object.fromEntries(Object.keys(projection.value.inputs).map(name=>[name,{input:name}]))}}]},
    representations:{xml:{kind:'record',fields:[{field:'value',path:['Field']}]},yaml:{kind:'mapping',fields:[{field:'value',key:'ПолеНабораДанных'}]}}};
  const xmlns=Object.entries(namespaces).map(([prefix,uri])=>`xmlns:${prefix}="${uri}"`).join(' ');
  const wrap=xml=>xml.replace('<Field ',`<Field ${xmlns} `);
  const common={entry:projection.value.id,inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},
    factBindings:{styleTypes:'metadata.style-item-types',labels:'dcs.enumeration-labels',codes:'dcs.enumeration-codes'},
    source:[{path},{path:owner.path}],noRaw:true};
  const yamlKeys=['Вид','ПутьКДанным','Поле','Роль','ОграничениеИспользования',
    'ОграничениеИспользованияРеквизитов','Заголовок','ДоступныеЗначения','ТипЗначения','Оформление',
    'ПараметрыРедактирования','ВыраженияУпорядочивания','ВыражениеПредставления',
    'НаборДанныхПроверкиИерархии','ПараметрНабораДанныхПроверкиИерархии'];
  const ordered=record=>Object.fromEntries(yamlKeys.filter(key=>Object.hasOwn(record,key)).map(key=>[key,record[key]]));
  const cases=[['full','full'],['folder','folder'],['nested','nested-data-set']].map(([name,file])=>({
    ...common,entry:libraryOwner.id,id:`data-set-field-${name}`,xml:wrap(readFileSync(base+'__fixtures__/'+file+'.xml','utf8')),
    yaml:yaml.dump({ПолеНабораДанных:ordered(literalFixture(path,source,name+'DataCompositionSchemaDataSetFieldYAML').data)},{noRefs:true}).trimEnd(),
    source:[...common.source,{path:base+'__fixtures__/'+file+'.xml'}]}));
  // Full document/order diagnostics use the original source object boundary;
  // public library cases above test an ordinary property of their caller.
  const full={...cases[0],entry:projection.value.id,
    yaml:yaml.dump(ordered(literalFixture(path,source,'fullDataCompositionSchemaDataSetFieldYAML').data),{noRefs:true}).trimEnd()};
  cases.push({...full,id:'data-set-field-legacy-without-kind',reverseYAML:yaml.dump(
    literalFixture(path,source,'legacyDataCompositionSchemaDataSetFieldYAML').data,{noRefs:true}).trimEnd()});
  cases.push({...common,id:'data-set-field-available-values',
    xml:wrap(readFileSync(base+'__fixtures__/availableValues.xml','utf8')),
    yaml:'Вид: ПолеНабораДанныхСхемыКомпоновкиДанных\nПутьКДанным: Состояние\nПоле: Состояние\nЗаголовок: Состояние\nДоступныеЗначения:\n  - Значение: "Выставлен"\n    Представление: Выставлен\n  - Значение: "Аннулирован"\n    Представление: Аннулирован',
    source:[...common.source,{path:base+'__fixtures__/availableValues.xml'},
      {path:'packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/__fixtures__/data.ts'}]});
  const appearanceYAML='Вид: ПолеНабораДанныхСхемыКомпоновкиДанных\nПутьКДанным: ВремяВыполнения\nПоле: ВремяВыполнения\nТипЗначения: "Число(15, 3)"\nОформление:\n  Формат: ЧЦ=15; ЧДЦ=3; ЧН=0,000';
  cases.push({...common,id:'data-set-field-appearance',
    xml:wrap(readFileSync(base+'__fixtures__/appearance-collection.xml','utf8')),
    yaml:appearanceYAML,
    xmlQNamePaths:[['Field','{'+namespaces.dcssch+'}valueType','{'+namespaces.v8+'}Type']],
    source:[...common.source,{path:base+'__fixtures__/appearance-collection.xml'},
      {path:base+'fromYAMLToXML.integration.test.ts'}]});
  // Exercise source properties absent from the short original XML fixtures.
  // Independent XML/YAML names are deliberately recorded here as expectations.
  const extras=[['role','Роль'],['editParameters','ПараметрыРедактирования'],
    ['orderExpressions','ВыраженияУпорядочивания'],['presentationExpression','ВыражениеПредставления'],
    ['hierarchyCheckDataSet','НаборДанныхПроверкиИерархии'],
    ['hierarchyCheckDataSetParameter','ПараметрНабораДанныхПроверкиИерархии']];
  const extraXML=extras.map(([name])=>`<dcssch:${name}>${name}</dcssch:${name}>`).join('');
  const fullMeaning=yaml.load(full.yaml);
  for(const [name,key] of extras)fullMeaning[key]=name;
  fullMeaning.ОграничениеИспользованияРеквизитов={Поле:'Истина',Условие:'Истина',Группировка:'Истина',Порядок:'Истина'};
  const orderedMeaning=ordered(fullMeaning);
  const attributeRestriction='<dcssch:attributeUseRestriction><dcssch:field>true</dcssch:field><dcssch:condition>true</dcssch:condition><dcssch:group>true</dcssch:group><dcssch:order>true</dcssch:order></dcssch:attributeUseRestriction>';
  const normalExtraXML=[extras[3],...extras.filter((_,index)=>index!==3)]
    .map(([name])=>`<dcssch:${name}>${name}</dcssch:${name}>`).join('');
  cases.push({...full,id:'data-set-field-all-source-properties',
    xml:full.xml.replace('</Field>',attributeRestriction+normalExtraXML+'</Field>'),
    yaml:yaml.dump(orderedMeaning,{noRefs:true}).trimEnd(),
    adaptation:'Extend an immutable field fixture in memory to cover properties absent from its short source XML'});
  cases.push({...full,id:'data-set-field-reordered-source-properties',
    xml:full.xml.replace('</Field>',extraXML+attributeRestriction+'</Field>'),
    yaml:undefined,noRaw:false,annotation:'!xml/raw',
    semanticYAML:yaml.dump(orderedMeaning,{noRefs:true}).trimEnd(),
    adaptation:'Keep a different sibling order as a document ordering anomaly, with readable properties'});
  cases.push({...full,id:'data-set-field-invalid-restriction',
    xml:full.xml.replace('>true</dcssch:condition>','>oops</dcssch:condition>'),
    yaml:undefined,noRaw:false,annotation:'  condition: !xml/raw',retainedYAML:['ПутьКДанным: Реквизит1','Поле: Реквизит1']});
  cases.push({...full,id:'data-set-field-missing-xml-kind',
    xml:full.xml.replace('xsi:type="dcssch:DataSetFieldField"',''),
    yaml:undefined,noRaw:false,annotation:'!xml/raw',semanticYAML:full.yaml});
  cases.push({...full,id:'data-set-field-unknown-xml-kind',
    xml:full.xml.replace('xsi:type="dcssch:DataSetFieldField"','xsi:type="dcssch:Unknown"'),
    yaml:undefined,noRaw:false,annotation:'type: !xml/raw',
    retainedYAML:['ПутьКДанным: Реквизит1','Поле: Реквизит1','ОграничениеИспользования:']});
  const folder=cases.find(row=>row.id==='data-set-field-folder');
  cases.push({...folder,id:'data-set-field-folder-unexpected-field',
    xml:folder.xml.replace('</dcssch:dataPath>','</dcssch:dataPath><dcssch:field>Значение</dcssch:field>'),
    yaml:undefined,noRaw:false,annotation:'  Поле: !xml/raw',
    retainedYAML:['  ПутьКДанным: ГруппаПолей','  Заголовок: Группа полей']});
  const formPath='e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml';
  const form=readFileSync(formPath,'utf8');
  const formNamespaces=[...form.match(/<Form\b([^>]*)>/)[1].matchAll(/\bxmlns(?::([\w.-]+))?="([^"]+)"/g)];
  const collectionNamespaces=Object.fromEntries(formNamespaces.map(match=>[match[1]??'form',match[2]]));
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  graph.edges=graph.edges.filter(edge=>edge.owner.symbol==='DynamicListRules' && edge.property==='fields');
  if(graph.edges.length!==1)throw new Error('Expected one registered data set field collection');
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries;
  const collection=emitCollections(graph,entries,catalog,collectionNamespaces,{defaultXmlNamespace:'form',deferOwnerContributions:true});
  if(collection.results[0]?.status!=='candidate')throw new Error(JSON.stringify(collection.results));
  collection.modules=referenceDeclarationModule(collection.modules,collection.modules[0].id,library.value.id);
  const firstField=form.match(/<Field\b[^>]*>[\s\S]*?<\/Field>/)[0];
  cases.push({...common,id:'data-set-field-registered-form-collection',entry:collection.results[0].declaration,
    xml:'<Settings '+formNamespaces.map(match=>match[0]).join(' ')+'>'+firstField+'</Settings>',
    yaml:'Поля:\n  - Вид: ПолеНабораДанныхСхемыКомпоновкиДанных\n    ПутьКДанным: Реквизит1\n    Поле: Реквизит1\n    ОграничениеИспользования:\n      Условие: Истина',
    source:[{path:formPath},{path:graph.edges[0].registration.path},{path:graph.edges[0].owner.path}],
    adaptation:'Selected first field from immutable real form; registered collection placement and default namespace, whole dynamic list excluded'});
  return {modules:[...projection.modules,...library.modules,libraryOwner,...collection.modules,catalog.get('metadata.style-item-type-facts'),
    catalog.get('metadata.system-enumeration-index-source')],cases,factSources:dcsProductionFactSources()};
}
