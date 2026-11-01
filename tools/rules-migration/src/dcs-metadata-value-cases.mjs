import {readFileSync} from 'node:fs';
import {literalFixture} from './test-cases.mjs';
import {emitCandidates} from './emit.mjs';
import {yaml} from './candidate-catalog.mjs';
import {dcsProductionFactSources} from './declaration-fact-fixtures.mjs';

// Transfer source rule parameters and independent expectations. Conversion
// remains in the selected declarations, never in this test-data generator.
export function dcsMetadataValueCases(catalog) {
  const base='packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/';
  const path=base+'__fixtures__/data.ts';
  const fixture=literalFixture(path,readFileSync(path,'utf8'),'dcsMetadataValueFromXMLFixtures');
  const namespaces={xsi:'http://www.w3.org/2001/XMLSchema-instance',xs:'http://www.w3.org/2001/XMLSchema',
    dcscor:'http://v8.1c.ru/8.1/data-composition-system/core',dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings',
    v8:'http://v8.1c.ru/8.1/data/core',v8ui:'http://v8.1c.ru/8.1/data/ui',
    ent:'http://v8.1c.ru/8.1/data/enterprise',xr:'http://v8.1c.ru/8.3/xcf/readable',
    web:'http://v8.1c.ru/8.1/data/ui/colors/web',style:'http://v8.1c.ru/8.1/data/ui/style'};
  const xmlns=Object.entries(namespaces).map(([key,value])=>`xmlns:${key}="${value}"`).join(' ');
  const modules=new Map();
  const cases=fixture.data.map(row=>{
    const property={name:'value',status:'static-parameters',source:fixture.source,
      parameters:{...row.rule,xml:'dcscor:value',xmlParents:['Root']}};
    const emitted=emitCandidates([{path,symbol:row.id,comparison:{status:'keys-match'},properties:[property]}],catalog,()=>path,namespaces);
    if(emitted.entries[0].properties[0].status!=='candidate')throw new Error('Unsupported source value profile: '+row.id);
    for(const module of emitted.modules)modules.set(module.id,module);
    const owner=emitted.modules.find(module=>module.kind==='object');
    const xmlPath=base+'__fixtures__/'+row.xml;
    return {id:'dcs-metadata-value-'+row.id,profile:row.rule.valueType,entry:owner.id,
      xml:`<Root ${xmlns}>${readFileSync(xmlPath,'utf8')}</Root>`,
      yaml:row.yaml===undefined||row.yaml?.$undefined===true?undefined:yaml.dump({[row.rule.yaml]:row.yaml},{noRefs:true}).trimEnd(),
      noRaw:!['colorRawRef','emptyLocalString','primitiveTypeRef'].includes(row.id),
      inputs:Object.fromEntries(Object.entries({defaultLanguage:'ru',registeredLanguages:['ru','en']})
        .filter(([name])=>Object.hasOwn(owner.inputs??{},name))),
      factBindings:Object.fromEntries(Object.entries({styleTypes:'metadata.style-item-types',labels:'dcs.enumeration-labels',codes:'dcs.enumeration-codes'})
        .filter(([name])=>Object.hasOwn(owner.inputs??{},name))),
      xmlQNamePaths:row.rule.valueType==='Color'?[[
        'Root','{http://v8.1c.ru/8.1/data-composition-system/core}value']]:[],
      xmlQNameAttributes:row.rule.valueType==='Font'?[{path:[
        'Root','{http://v8.1c.ru/8.1/data-composition-system/core}value'],name:'ref'}]:[],
      source:[{path},{path:xmlPath}]};
  });
  for(const name of ['emptyLocalString','primitiveTypeRef']) {
    const row=cases.find(row=>row.id==='dcs-metadata-value-'+name);
    row.yaml=undefined;row.noRaw=false;row.annotation='value: !xml/raw';
  }
  cases.find(row=>row.id==='dcs-metadata-value-primitiveTypeRef').retainedYAML=['  $значение: null'];
  const uuid=cases.find(row=>row.id==='dcs-metadata-value-primitiveUuid');
  uuid.yaml=undefined;uuid.noRaw=false;uuid.annotation='value: !xml/raw';
  uuid.retainedYAML=['  $значение: 00000000-0000-0000-0000-000000000000'];
  uuid.adaptation='The source v8:UUID spelling is retained while the accepted primitive contract emits its canonical type';
  const colorReference=cases.find(row=>row.id==='dcs-metadata-value-colorRawRef');
  colorReference.yaml='value: 0:615512b6-4378-4fce-86f1-a56725f945da';
  colorReference.noRaw=true;
  colorReference.adaptation='Use the accepted Color contract: an unresolved reference remains explicit text, not an omitted value';
  const designTime=cases.find(row=>row.id==='dcs-metadata-value-designTimeValue');
  cases.push({...designTime,id:'dcs-metadata-value-formatted-local-string',
    xml:designTime.xml.replace(/<dcscor:value[\s\S]*<\/dcscor:value>/,
      '<dcscor:value xsi:type="v8:LocalFormattedStringType"><v8:lws><v8:item><v8:lang>ru</v8:lang><v8:content>Многоязычная форматированная строка</v8:content></v8:item></v8:lws><v8:formatted>true</v8:formatted></dcscor:value>'),
    yaml:'value:\n  Тип: МногоязычнаяФорматированнаяСтрока\n  Значение:\n    Форматированный: Истина\n    Текст: Многоязычная форматированная строка',
    source:[...designTime.source,{path:base+'fromXML.integration.test.ts'},{path:base+'fromYAML.test.ts'}]});
  const field=cases.find(row=>row.id==='dcs-metadata-value-field');
  cases.push({...field,id:'dcs-metadata-value-field-decimal',
    xml:field.xml.replace(/<dcscor:value[\s\S]*<\/dcscor:value>/,'<dcscor:value xsi:type="xs:decimal">0</dcscor:value>'),yaml:'value: 0'});
  const ordinary=cases.find(row=>row.id==='dcs-metadata-value-primitiveBoolean');
  cases.push({...ordinary,id:'dcs-metadata-value-invalid-boolean',
    xml:ordinary.xml.replace('>true</dcscor:value>','>oops</dcscor:value>'),
    yaml:undefined,noRaw:false,annotation:'value: !xml/raw'});
  const parameter=cases.find(row=>row.id==='dcs-metadata-value-parameter');
  const extra='<dcscor:item><dcscor:choiceParameter>ВторойПараметр</dcscor:choiceParameter><dcscor:value xsi:type="xs:decimal">456</dcscor:value></dcscor:item>';
  cases.push({...parameter,id:'dcs-metadata-value-extra-choice-parameter',
    xml:parameter.xml.replace(/<\/dcscor:value>\s*<\/Root>$/,extra+'</dcscor:value></Root>'),
    yaml:undefined,noRaw:false,annotation:'value: !xml/raw'});
  for(const id of ['metadata.style-item-type-facts','metadata.system-enumeration-index-source'])modules.set(id,catalog.get(id));
  return {modules:[...modules.values()],cases,factSources:dcsProductionFactSources()};
}
