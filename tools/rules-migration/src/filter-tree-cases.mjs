import {readFileSync} from 'node:fs';
import {sourceProjection,relativeSourceProjection} from './source-projection.mjs';
import {literalFixture} from './test-cases.mjs';
import {yaml} from './candidate-catalog.mjs';

export function filterTreeCases(catalog) {
  const base='packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/';
  const path=base+'__fixtures__/data.ts';
  const fixture=readFileSync(path,'utf8');
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries;
  const comparison=entries.find(row=>row.symbol==='FilterItemComparisonRules');
  const group=entries.find(row=>row.symbol==='FilterItemGroupRules');
  const namespaces={xsi:'http://www.w3.org/2001/XMLSchema-instance',xs:'http://www.w3.org/2001/XMLSchema',
    v8:'http://v8.1c.ru/8.1/data/core',dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings',
    dcscor:'http://v8.1c.ru/8.1/data-composition-system/core',xr:'http://v8.1c.ru/8.3/xcf/readable'};
  const inputs={defaultLanguage:{type:{kind:'scalar',scalar:'text'}},registeredLanguages:{type:{kind:'sequence',item:{kind:'scalar',scalar:'text'}}}};
  const bind=Object.fromEntries(Object.keys(inputs).map(key=>[key,{input:key}]));
  const collection={format:'nkdk-declarations/1',kind:'value',id:'common.filter-item',namespaces,inputs,
    imports:{node:'common.filter-node'},value:{kind:'sequence',item:{use:'node',bind}},
    representations:{xml:{kind:'element-sequence',path:['dcsset:item']},yaml:{kind:'sequence'}},
    presence:[{target:'self',xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}},omitWhen:{not:{exists:{in:{self:true},as:'row',where:{literal:true}}}}}}]};
  const local=new Map(catalog);local.set(collection.id,collection);
  const make=(owner,id)=>relativeSourceProjection(owner,local,{properties:owner.properties.filter(row=>!row.parameters.runtimeOnly).map(row=>row.name),id,namespaces});
  const projectedComparison=make(comparison,'common.filter-comparison');
  const projectedGroup=make(group,'common.filter-group');
  const node={format:'nkdk-declarations/1',kind:'value',id:'common.filter-node',namespaces,inputs,
    imports:{comparison:projectedComparison.value.id,group:projectedGroup.value.id},
    value:{kind:'choice',variants:[{name:'comparison',type:{use:'comparison',bind}},{name:'group',type:{use:'group',bind}}]},
    representations:{xml:{kind:'choice',attribute:'xsi:type',otherwise:'comparison',variants:[
      {variant:'comparison',in:['dcsset:FilterItemComparison'],emit:'dcsset:FilterItemComparison'},
      {variant:'group',in:['dcsset:FilterItemGroup'],emit:'dcsset:FilterItemGroup'}]},
      yaml:{kind:'choice',variants:[{variant:'group',form:'mapping',key:'ТипГруппы'}],fallback:'comparison'}}};
  const owner={format:'nkdk-declarations/1',kind:'object',id:'working.filter-tree',namespaces,inputs,
    imports:{items:collection.id},value:{kind:'record',fields:[{name:'items',type:{use:'items',bind}}]},
    representations:{xml:{kind:'record',fields:[{field:'items',path:['Root']}]},yaml:{kind:'mapping',fields:[{field:'items',key:'Элементы'}]}}};
  const xmlns=Object.entries(namespaces).map(([key,uri])=>`xmlns:${key}="${uri}"`).join(' ');
  const wrap=xml=>`<Root ${xmlns}>${xml}</Root>`;
  const order=(record,source)=>Object.fromEntries(source.properties.map(row=>row.parameters.yaml).filter(key=>Object.hasOwn(record,key)).map(key=>[key,record[key]]));
  const groupYAML=order(literalFixture(path,fixture,'fullFilterItemGroupYAML').data,group);
  const comparisonYAML=order(literalFixture(path,fixture,'fullFilterItemComparisonYAML').data,comparison);
  const groupXML=readFileSync(base+'__fixtures__/full-group.xml','utf8');
  const comparisonXML=readFileSync(base+'__fixtures__/full.xml','utf8');
  const common={entry:owner.id,inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},noRaw:false,
    source:[{path},{path:comparison.path},{path:base+'__fixtures__/full-group.xml'},{path:base+'__fixtures__/full.xml'}]};
  const render=rows=>yaml.dump({Элементы:rows},{noRefs:true}).trimEnd();
  const nestedXML=groupXML.replace('</dcsset:groupType>','</dcsset:groupType>'+comparisonXML+groupXML+comparisonXML);
  const nested=order({...groupYAML,Элементы:[comparisonYAML,groupYAML,comparisonYAML]},group);
  const cases=[{...common,id:'filter-tree-group',xml:wrap(groupXML),yaml:render([groupYAML])},
    {...common,id:'filter-tree-nested-repeats',xml:wrap(nestedXML),yaml:render([nested])},
    {...common,id:'filter-tree-mixed-neighbours',xml:wrap(comparisonXML+groupXML+comparisonXML),yaml:render([comparisonYAML,groupYAML,comparisonYAML])}];
  cases.push({...common,id:'filter-tree-empty-comparison',
    xml:wrap('<dcsset:item xsi:type="dcsset:FilterItemComparison"/>'),yaml:render([{}]),
    source:[...common.source,{path:base+'types.ts'}],
    adaptation:'The source selects comparison when ТипГруппы is absent, including an empty mapping'});
  const allGroupXML=groupXML.replace('<dcsset:groupType>','<dcsset:use>false</dcsset:use><dcsset:groupType>')
    .replace('<dcsset:userSettingID>','<dcsset:application>Hierarchy</dcsset:application><dcsset:userSettingID>')
    .replace('</dcsset:groupType>','</dcsset:groupType>'+comparisonXML+groupXML+comparisonXML);
  cases.push({...common,id:'filter-tree-all-group-properties',xml:wrap(allGroupXML),
    yaml:render([order({...nested,Использование:'Ложь',Применение:'Иерархия'},group)])});
  cases.push({...common,id:'filter-tree-invalid-neighbour',
    xml:wrap(comparisonXML.replace('>false</dcsset:use>','>oops</dcsset:use>')+groupXML+comparisonXML),
    annotation:'    use: !xml/raw',retainedYAML:['    ТипГруппы: ГруппаИли','    ЛевоеЗначение: .Ссылка'],
    adaptation:'Invalid comparison remains beside the intact group and repeated healthy comparison'});
  const emptyComparison=cases.find(row=>row.id==='filter-tree-empty-comparison');
  emptyComparison.acceptedYAML=[emptyComparison.yaml];
  emptyComparison.yaml='Элементы:\n  - !xml/raw\n    $xml:\n      _{http://www.w3.org/2001/XMLSchema-instance}type: "{http://v8.1c.ru/8.1/data-composition-system/settings}FilterItemComparison"';
  emptyComparison.adaptation+='; XML omits default comparisonType which ordinary export adds, so its empty source form is preserved';
  cases.push({...common,id:'filter-tree-default-comparison',
    xml:wrap('<dcsset:item xsi:type="dcsset:FilterItemComparison"><dcsset:comparisonType>Equal</dcsset:comparisonType></dcsset:item>'),
    yaml:render([{ВидСравнения:'Равно'}]),reverseYAML:render([{}]),
    adaptation:'Independent empty YAML selects comparison and emits its source default Equal'});
  const filter=entries.find(row=>row.symbol==='FilterRules');
  const filterProjection=sourceProjection(filter,local,{properties:filter.properties.map(row=>row.name),id:'working.filter-owner',root:'dcsset:filter',namespaces});
  const filterBase='packages/rules/metadata/commonObjects/dataCompositionSystem/filter/';
  const filterPath=filterBase+'__fixtures__/data.ts';
  const filterMeaning=literalFixture(filterPath,readFileSync(filterPath,'utf8'),'fullFilterFixtureYAML').data;
  const filterXML=readFileSync(filterBase+'__fixtures__/full.xml','utf8').replace('<dcsset:filter>',`<dcsset:filter ${xmlns}>`);
  const filterCommon={...common,entry:filterProjection.value.id,source:[...common.source,{path:filter.path},{path:filterPath},{path:filterBase+'__fixtures__/full.xml'}]};
  cases.push({...filterCommon,id:'filter-owner-source',xml:filterXML,yaml:yaml.dump(order(filterMeaning,filter),{noRefs:true}).trimEnd()});
  cases.push({...filterCommon,id:'filter-owner-empty',
    xml:filterXML.slice(0,filterXML.indexOf('>')+1)+'</dcsset:filter>',yaml:'',reverseYAML:'{}',
    adaptation:'Keep the original filter root and namespaces while removing its children in memory'});
  cases.push({...filterCommon,id:'filter-owner-empty-available-fields',
    xml:filterXML.replace('</dcsset:filter>','<dcsset:availableFields/></dcsset:filter>'),
    annotation:'availableFields: !xml/raw',
    retainedYAML:['ПредставлениеПользовательскойНастройки: Представление отбора'],
    adaptation:'Preserve the explicit empty optional collection beside the original filter meaning'});
  const availableBase='packages/rules/metadata/commonObjects/dataCompositionSystem/availableFields/__fixtures__/';
  const availableXML=readFileSync(availableBase+'full.xml','utf8').replaceAll('dcsset:selection','dcsset:availableFields');
  const availableYAML=literalFixture(availableBase+'data.ts',readFileSync(availableBase+'data.ts','utf8'),'fullAvailableFieldsYAML').data;
  const expanded={...filterMeaning,РежимОтображения:'Обычный',ИспользоватьПользовательскуюНастройку:'020f583f-ed48-47c1-b824-30b02c09aff9',ДоступныеПоляОтбора:availableYAML};
  cases.push({...filterCommon,id:'filter-owner-all-properties',
    xml:filterXML.replace('<dcsset:userSettingPresentation',
      '<dcsset:viewMode>Normal</dcsset:viewMode><dcsset:userSettingID>020f583f-ed48-47c1-b824-30b02c09aff9</dcsset:userSettingID><dcsset:userSettingPresentation').replace('</dcsset:filter>',availableXML+'</dcsset:filter>'),
    yaml:yaml.dump(order(expanded,filter),{noRefs:true}).trimEnd(),source:[...filterCommon.source,{path:availableBase+'full.xml'},{path:availableBase+'data.ts'}]});
  return {modules:[...projectedComparison.modules,...projectedGroup.modules,...filterProjection.modules,collection,node,owner],cases,factSources:[]};
}
