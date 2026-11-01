import {readFileSync} from 'node:fs';
import {filterTreeCases} from './filter-tree-cases.mjs';
import {sourceProjection,relativeSourceProjection} from './source-projection.mjs';
import {literalFixture} from './test-cases.mjs';
import {yaml} from './candidate-catalog.mjs';
import {dcsProductionFactSources} from './declaration-fact-fixtures.mjs';

export function conditionalAppearanceCases(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const source=symbol=>extraction.entries.find(row=>row.symbol===symbol);
  const trees=filterTreeCases(catalog);
  const treeOwner=trees.modules.find(row=>row.id==='working.filter-owner');
  const namespaces=trees.modules.find(row=>row.id==='working.filter-tree').namespaces;
  const local=new Map([...catalog,...trees.modules.map(row=>[row.id,row])]);
  const filter=relativeSourceProjection(source('FilterRules'),local,{
    properties:treeOwner.yamlOrder,id:'common.filter',namespaces});
  for(const row of filter.modules)local.set(row.id,row);
  const itemSource=source('ConditionalAppearanceItemRules');
  const item=relativeSourceProjection(itemSource,local,{
    properties:itemSource.properties.map(row=>row.name),id:'common.conditional-appearance-item',namespaces});
  for(const row of item.modules)local.set(row.id,row);
  const inputs=item.value.inputs;
  const bind=Object.fromEntries(Object.keys(inputs).map(key=>[key,{input:key}]));
  const collection={format:'nkdk-declarations/1',kind:'value',id:'common.conditional-appearance-items',
    namespaces,inputs,imports:{item:item.value.id},value:{kind:'sequence',item:{use:'item',bind}},
    representations:{xml:{kind:'element-sequence',path:['dcsset:item'],item:{kind:'declared'}},yaml:{kind:'sequence',item:{kind:'declared'}}}};
  local.set(collection.id,collection);
  const ownerSource=source('ConditionalAppearanceRules');
  const publicOwner=relativeSourceProjection(ownerSource,local,{properties:ownerSource.properties.map(row=>row.name),
    id:'common.conditional-appearance',namespaces});
  for(const row of publicOwner.modules)local.set(row.id,row);
  const owner=sourceProjection(ownerSource,local,{properties:ownerSource.properties.map(row=>row.name),
    id:'working.conditional-appearance',root:'dcsset:conditionalAppearance',namespaces});
  const wrapper={format:'nkdk-declarations/1',kind:'object',id:'working.conditional-items',namespaces,
    inputs:Object.fromEntries(Object.entries(inputs).map(([key,value])=>[key,{...value,...(item.providers[key]?{index:item.providers[key]}:{})}])),
    imports:{items:collection.id},value:{kind:'record',fields:[{name:'items',type:{use:'items',bind}}]},
    representations:{xml:{kind:'record',fields:[{field:'items',path:['ConditionalAppearance']}]},yaml:{kind:'mapping',fields:[{field:'items',key:'Элементы'}]}}};
  const namespaceFixture='e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml';
  const formRoot=readFileSync(namespaceFixture,'utf8').match(/<Form\b([^>]*)>/)[1];
  const fixtureNamespaces=Object.fromEntries([...formRoot.matchAll(/xmlns:([\w.-]+)="([^"]*)"/g)].map(match=>[match[1],match[2]]));
  const xmlns=Object.entries({...fixtureNamespaces,...namespaces}).map(([prefix,uri])=>`xmlns:${prefix}="${uri}"`).join(' ');
  const itemBase='packages/rules/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/';
  const ownerBase='packages/rules/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/__fixtures__/';
  const common={inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},noRaw:false,
    factBindings:item.providers,source:[{path:itemSource.path},{path:ownerSource.path},{path:namespaceFixture}]};
  const wrapItem=name=>readFileSync(itemBase+name+'.xml','utf8').replace('<ConditionalAppearance>',`<ConditionalAppearance ${xmlns}>`);
  const wrapOwner=name=>readFileSync(ownerBase+name+'.xml','utf8').replace('<dcsset:conditionalAppearance>',`<dcsset:conditionalAppearance ${xmlns}>`);
  const ownerFixture=readFileSync(ownerBase+'data.ts','utf8');
  const order=(record,registration)=>Object.fromEntries(registration.properties.map(row=>row.parameters.yaml)
    .filter(key=>Object.hasOwn(record,key)).map(key=>[key,record[key]]));
  const cases=[{...common,id:'conditional-item-minimal',entry:wrapper.id,xml:wrapItem('minimal'),yaml:'Элементы:\n  - {}'},
    ...['full','minimal'].map(name=>({...common,id:name==='full'?'conditional-owner-source':'conditional-owner-minimal',
      entry:owner.value.id,xml:wrapOwner(name),
      yaml:yaml.dump(order(literalFixture(ownerBase+'data.ts',ownerFixture,name+'ConditionalAppearanceYAML').data,ownerSource),{noRefs:true}).trimEnd()}))];
  const appearancePath='packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields/__fixtures__/data.ts';
  const appearance=literalFixture(appearancePath,readFileSync(appearancePath,'utf8'),'fixtureAppearanceFieldsYAML').data;
  const itemPath=itemBase+'data.ts';
  const itemFixture=readFileSync(itemPath,'utf8').replace('Оформление: fixtureAppearanceFieldsYAML',
    'Оформление: '+JSON.stringify(appearance));
  const fullItem=literalFixture(itemPath,itemFixture,'fullConditionalAppearanceItemsYAML').data[0];
  // Adopt the already accepted local-string contract, not the old wrapper.
  const nestedTitle=fullItem.Отбор.Элементы[1].Элементы[0];
  nestedTitle.Представление=nestedTitle.Представление.Значение;
  const itemXML=wrapItem('full');
  const expandedName=(prefix,name)=>'{'+namespaces[prefix]+'}'+name;
  const valuePath=['ConditionalAppearance',expandedName('dcsset','item'),expandedName('dcsset','appearance'),expandedName('dcscor','item'),expandedName('dcscor','value')];
  const itemCommon={...common,entry:wrapper.id,source:[...common.source,{path:itemPath},{path:itemBase+'full.xml'},{path:appearancePath}],
    xmlQNamePaths:[valuePath],xmlQNameAttributes:[{path:valuePath,name:'ref'}],
    adaptation:'Accepted DcsLocalStringType shortens the multilingual title and marks xs:string explicitly with !xml/string'};
  const render=rows=>yaml.dump({Элементы:rows},{noRefs:true}).trimEnd()
    .replace(/^(    (?:Представление|ПредставлениеПользовательскойНастройки): )/gm,'$1!xml/string ');
  cases.push({...itemCommon,id:'conditional-item-source',xml:itemXML,yaml:render([order(fullItem,itemSource)])});
  const controls=itemSource.properties.filter(row=>row.name.startsWith('useIn'));
  const extra={Использование:'Ложь',РежимОтображения:'БыстрыйДоступ',
    ИдентификаторПользовательскойНастройки:'48553968-cd08-47dc-896c-8bb766f9e28f',
    ПредставлениеПользовательскойНастройки:'Представление настройки',
    ...Object.fromEntries(controls.map(row=>[row.parameters.yaml,'НеИспользовать']))};
  const controlXML=controls.map(row=>'<'+row.parameters.xml+'>DontUse</'+row.parameters.xml+'>').join('');
  const fullXML=itemXML.replace('<dcsset:selection>', '<dcsset:use>false</dcsset:use><dcsset:selection>')
    .replace('\n\t</dcsset:item>',
      '<dcsset:viewMode>QuickAccess</dcsset:viewMode><dcsset:userSettingID>48553968-cd08-47dc-896c-8bb766f9e28f</dcsset:userSettingID>'+
      '<dcsset:userSettingPresentation xsi:type="xs:string">Представление настройки</dcsset:userSettingPresentation>'+controlXML+'\n\t</dcsset:item>');
  cases.push({...itemCommon,id:'conditional-item-all-properties',xml:fullXML,yaml:render([order({...fullItem,...extra},itemSource)])});
  cases.push({...itemCommon,id:'conditional-item-repeats',xml:itemXML.replace('</ConditionalAppearance>',
    wrapItem('minimal').replace(/^<ConditionalAppearance[^>]*>|<\/ConditionalAppearance>$/g,'')+'</ConditionalAppearance>'),
    yaml:render([order(fullItem,itemSource),{}])});
  const fullOwner=cases.find(row=>row.id==='conditional-owner-source');
  const ownerMeaning=literalFixture(ownerBase+'data.ts',ownerFixture,'fullConditionalAppearanceYAML').data;
  cases.push({...fullOwner,id:'conditional-owner-all-properties',
    xml:fullOwner.xml.replace('<dcsset:userSettingID>','<dcsset:viewMode>QuickAccess</dcsset:viewMode><dcsset:userSettingID>'),
    yaml:yaml.dump(order({...ownerMeaning,РежимОтображения:'БыстрыйДоступ'},ownerSource),{noRefs:true}).trimEnd()});
  cases.push({...itemCommon,id:'conditional-item-invalid-neighbour',
    xml:fullXML.replace('>false</dcsset:use>','>oops</dcsset:use>'),
    annotation:'    use: !xml/raw',retainedYAML:['    Поля:','    Представление: !xml/string Выделение цветом состояния']});
  cases.push({...common,id:'conditional-item-missing-container',entry:wrapper.id,
    xml:wrapItem('minimal').replace('<dcsset:selection/>',''),annotation:'    !xml/raw',
    adaptation:'Ordinary empty YAML adds selection; preserve its source absence automatically'});
  const formSource=source('ClientApplicationFormRules');
  // The owner state machine is not part of this own-form property projection.
  const formProperty=sourceProjection({...formSource,propertyStates:[]},local,{
    properties:['attributesConditionalAppearance'],id:'working.form-conditional-property',
    root:'form:Form',namespaces:{...fixtureNamespaces,...namespaces,form:'http://v8.1c.ru/8.3/xcf/logform'},defaultXmlNamespace:'form'});
  const formFixture='packages/rules/metadata/forms/clientApplicationForm/__fixtures__/conditionalAppearanceWithoutAttributes.xml';
  const formXML=readFileSync(formFixture,'utf8');
  const formNamespaces=[...formXML.match(/<Form\b([^>]*)>/)[1].matchAll(/\bxmlns(?::[\w.-]+)?="[^"]*"/g)].map(match=>match[0]).join(' ');
  const appearanceXML=formXML.match(/<ConditionalAppearance>[\s\S]*?<\/ConditionalAppearance>/)[0];
  cases.push({...common,id:'conditional-form-property-source',entry:formProperty.value.id,
    xml:'<Form '+formNamespaces+'><Attributes>'+appearanceXML+'</Attributes></Form>',
    yaml:'УсловноеОформлениеРеквизитов:\n  РежимОтображения: Обычный',
    source:[{path:formFixture},{path:formSource.path}],
    adaptation:'Own-form projection of one registered property; other fields and extension state machine remain outside acceptance'});
  const modules=[...trees.modules,...filter.modules,...item.modules,collection,...publicOwner.modules,...owner.modules,...formProperty.modules,wrapper];
  const unique=[...new Map(modules.map(row=>[row.id,row])).values()];
  for(const case_ of cases)case_.source.push({path:(case_.entry===wrapper.id?itemBase:ownerBase)+(case_.id.endsWith('minimal')?'minimal':'full')+'.xml'});
  return {modules:unique,cases,factSources:dcsProductionFactSources()};
}
