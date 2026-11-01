import {readFileSync} from 'node:fs';
import {sourceProjection} from './source-projection.mjs';
import {literalFixture} from './test-cases.mjs';
import {yaml} from './candidate-catalog.mjs';

export function filterComparisonCases(catalog) {
  const base='packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/';
  const path=base+'__fixtures__/data.ts';
  const source=readFileSync(path,'utf8');
  const owner=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries
    .find(row=>row.symbol==='FilterItemComparisonRules');
  // runtimeOnly is excluded by the original runtime's ordered XML/YAML keys.
  // Preserve this source decision in the manifest, rather than hiding a gap.
  const serializable=owner.properties.filter(row=>row.parameters.runtimeOnly!==true);
  const excluded=owner.properties.filter(row=>row.parameters.runtimeOnly===true);
  if(excluded.some(row=>Object.keys(row.parameters).some(key=>!['type','yaml','runtimeOnly'].includes(key))))
    throw new Error('Unreviewed contextual runtime-only property');
  const namespaces={xsi:'http://www.w3.org/2001/XMLSchema-instance',xs:'http://www.w3.org/2001/XMLSchema',
    v8:'http://v8.1c.ru/8.1/data/core',dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings',
    dcscor:'http://v8.1c.ru/8.1/data-composition-system/core',xr:'http://v8.1c.ru/8.3/xcf/readable'};
  const projection=sourceProjection(owner,catalog,{properties:serializable.map(row=>row.name),
    id:'working.dcs-filter-comparison',root:'dcsset:item',namespaces});
  const xmlns=Object.entries(namespaces).map(([prefix,uri])=>`xmlns:${prefix}="${uri}"`).join(' ');
  const wrap=xml=>xml.replace('<dcsset:item ',`<dcsset:item ${xmlns} `);
  const order=serializable.map(row=>row.parameters.yaml);
  const render=record=>yaml.dump(Object.fromEntries(order.filter(key=>Object.hasOwn(record,key)).map(key=>[key,record[key]])),{noRefs:true}).trimEnd();
  const common={entry:projection.value.id,inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},
    noRaw:false,source:[{path},{path:owner.path}],
    adaptation:'Source runtimeOnly properties excluded from serialization: '+excluded.map(row=>row.name).join(', ')};
  const cases=[['full','fullFilterItemComparisonYAML','full.xml'],
    ['in-list','inListFilterItemComparisonYAML','inList.xml']].map(([id,name,file])=>({...common,
      id:'filter-comparison-'+id,xml:wrap(readFileSync(base+'__fixtures__/'+file,'utf8')),
      yaml:render(literalFixture(path,source,name).data),source:[...common.source,{path:base+'__fixtures__/'+file}]}));
  const full=cases[0];
  cases.push({...full,id:'filter-comparison-absent-user-setting',
    xml:full.xml.replace(/\s*<dcsset:userSettingID>[^<]*<\/dcsset:userSettingID>/,''),
    yaml:render(Object.fromEntries(Object.entries(literalFixture(path,source,'fullFilterItemComparisonYAML').data)
      .filter(([key])=>key!=='ИспользоватьПользовательскуюНастройку')))});
  cases.push({...full,id:'filter-comparison-application',
    xml:full.xml.replace('</dcsset:item>','<dcsset:application>Hierarchy</dcsset:application></dcsset:item>'),
    yaml:render({...literalFixture(path,source,'fullFilterItemComparisonYAML').data,Применение:'Иерархия'})});
  cases.push({...common,id:'filter-comparison-in-list-with-nil',
    xml:wrap(readFileSync(base+'__fixtures__/inListWithNil.xml','utf8')),
    yaml:render({ЛевоеЗначение:'.Объект.Корректировки.Документ',ВидСравнения:'ВСписке',
      ПравоеЗначение:['Документ.ВыбытиеИнвестиций.ПустаяСсылка','Документ.ПоступлениеИнвестиций.ПустаяСсылка',{}]}),
    source:[...common.source,{path:base+'__fixtures__/inListWithNil.xml'},{path:base+'fromXMLToYAML.integration.test.ts'}]});
  const nilCase=cases.find(row=>row.id==='filter-comparison-in-list-with-nil');
  nilCase.acceptedYAML=[nilCase.yaml];
  nilCase.yaml=nilCase.yaml.replace('  - {}','  - !xml/raw\n    $xml:\n      _{http://www.w3.org/2001/XMLSchema-instance}nil: "true"');
  nilCase.adaptation+='; preserve the source nil attribute using the accepted typed-value anomaly contract';
  cases.push({...full,id:'filter-comparison-invalid-use',
    xml:full.xml.replace('>false</dcsset:use>','>oops</dcsset:use>'),
    yaml:undefined,annotation:'use: !xml/raw',
    retainedYAML:['ЛевоеЗначение: .Ссылка','ПравоеЗначение: Справочник.Справочник1.ПустаяСсылка']});
  return {modules:projection.modules,cases,factSources:[]};
}
