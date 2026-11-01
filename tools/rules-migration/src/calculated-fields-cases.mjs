import {readFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {emitCollections} from './collection-emission.mjs';
import {dcsProductionFactSources} from './declaration-fact-fixtures.mjs';
import {relativeSourceProjection} from './source-projection.mjs';
import {referenceDeclarationModule} from './declaration-identifiers.mjs';

export function calculatedFieldsCases(catalog) {
  const xmlPath='e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml';
  const yamlPath='e2e/fixtures/nkdk/cf/ОбщаяФорма/ДинамическийСписок/Свойства.yaml';
  const form=readFileSync(xmlPath,'utf8');
  const attributes=[...form.match(/<Form\b([^>]*)>/)[1].matchAll(/\bxmlns(?::([\w.-]+))?="([^"]+)"/g)];
  const namespaces=Object.fromEntries(attributes.map(match=>[match[1]??'form',match[2]]));
  const xmlns=attributes.map(match=>match[0]).join(' ');
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const owner=extraction.entries.find(row=>row.symbol==='CalculatedFieldRules');
  const library=relativeSourceProjection(owner,catalog,{properties:owner.properties.map(row=>row.name),
    id:'common.calculated-field',namespaces});
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  graph.edges=graph.edges.filter(edge=>edge.owner.symbol==='DynamicListRules' && edge.property==='calculatedFields');
  if(graph.edges.length!==1)throw new Error('Expected one calculated field collection registration');
  const emitted=emitCollections(graph,extraction.entries,catalog,namespaces,{defaultXmlNamespace:'form',deferOwnerContributions:true});
  if(emitted.results[0]?.status!=='candidate')throw new Error(JSON.stringify(emitted.results));
  emitted.modules=referenceDeclarationModule(emitted.modules,emitted.modules[0].id,library.value.id);
  const fields=[...form.matchAll(/<CalculatedField>[\s\S]*?<\/CalculatedField>/g)].map(match=>match[0]);
  const expected=[...readFileSync(yamlPath,'utf8').matchAll(/^        ВычисляемыеПоля:\n((?:^          .*\n)+)/gm)]
    .flatMap(match=>yaml.load(match[1].split('\n').map(line=>line.slice(10)).join('\n')));
  if(fields.length!==2 || expected.length!==2)throw new Error('Changed calculated field e2e corpus');
  const wrap=items=>`<Settings ${xmlns}>${items.join('')}</Settings>`;
  const source=[{path:xmlPath},{path:yamlPath},{path:graph.edges[0].item.path},{path:graph.edges[0].registration.path}];
  const common={entry:emitted.results[0].declaration,source,
    inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},
    factBindings:{styleTypes:'metadata.style-item-types',labels:'dcs.enumeration-labels',codes:'dcs.enumeration-codes'},
    xmlQNamePaths:[['form:Settings','form:CalculatedField','dcssch:valueType','v8:Type'].map(name=>{
      const [prefix,local]=name.split(':');return `{${namespaces[prefix]}}${local}`;
    })]};
  // Values are independent e2e expectations. Order follows the old published
  // rule registration, including nested common contracts, not generated YAML.
  const order=['ПутьКДанным','Выражение','Заголовок','ДоступныеЗначения','Оформление',
    'ОграничениеИспользования','ВыражениеПредставления','ВыраженияУпорядочивания','ТипЗначения'];
  const ordered=(record,keys)=>{
    if(Object.keys(record).some(key=>!keys.includes(key)))throw new Error('Unreviewed calculated field expectation key');
    return Object.fromEntries(keys.filter(key=>Object.hasOwn(record,key)).map(key=>[key,record[key]]));
  };
  const render=rows=>yaml.dump({ВычисляемыеПоля:rows.map(row=>{
    const result=ordered(row,order);
    if(row.ОграничениеИспользования)result.ОграничениеИспользования=ordered(row.ОграничениеИспользования,['Поле','Условие','Группировка','Порядок']);
    if(row.ВыраженияУпорядочивания)result.ВыраженияУпорядочивания=row.ВыраженияУпорядочивания.map(item=>ordered(item,['Выражение','ТипУпорядочивания','Автоупорядочивание']));
    return result;
  })},{noRefs:true,sortKeys:false,lineWidth:-1});
  const cases=fields.map((field,index)=>({...common,id:`calculated-fields-real-${index}`,
    xml:wrap([field]),yaml:render([expected[index]]),noRaw:false}));
  cases.push({...common,id:'calculated-fields-neighbours-and-repeat',xml:wrap([...fields,fields[0]]),
    yaml:render([...expected,expected[0]]),noRaw:false});
  cases.push({...cases[0],id:'calculated-fields-invalid-boolean',
    xml:cases[0].xml.replace('<dcssch:field>true</dcssch:field>','<dcssch:field>oops</dcssch:field>'),
    yaml:undefined,annotation:'      field: !xml/raw',retainedYAML:['    ПутьКДанным: Поле1','    ВыражениеПредставления: Наименование','      Группировка: Истина']});
  const valuesPath='packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/__fixtures__/nilAndBoolean.xml';
  const available=readFileSync(valuesPath,'utf8').replace(/<\/?root>/g,'');
  cases.push({...common,id:'calculated-fields-available-values',
    xml:wrap([`<CalculatedField><dcssch:dataPath>ЭтоЗаказ</dcssch:dataPath><dcssch:expression>Истина</dcssch:expression>${available}</CalculatedField>`]),
    yaml:render([{ПутьКДанным:'ЭтоЗаказ',Выражение:'Истина',ДоступныеЗначения:[{},{Значение:'Истина'}]}]),
    noRaw:true,source:[...source,{path:valuesPath}]});
  const appearance='<dcssch:appearance><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>ЦветТекста</dcscor:parameter><dcscor:value xsi:type="v8ui:Color">#1C55AE</dcscor:value></dcscor:item></dcssch:appearance>';
  cases.push({...common,id:'calculated-fields-appearance',
    xml:wrap([`<CalculatedField><dcssch:dataPath>ОбщееСостояниеПодключения</dcssch:dataPath><dcssch:expression/>${appearance}</CalculatedField>`]),
    yaml:render([{ПутьКДанным:'ОбщееСостояниеПодключения',Выражение:'',Оформление:{ЦветТекста:{Значение:'#1C55AE'}}}]),
    noRaw:true,source:[...source,{path:'packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedField/__fixtures__/data.ts'}]});
  return {modules:[...emitted.modules,...library.modules,catalog.get('metadata.style-item-type-facts'),catalog.get('metadata.system-enumeration-index-source')],
    cases,factSources:dcsProductionFactSources()};
}
