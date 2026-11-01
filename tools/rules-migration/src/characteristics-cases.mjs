import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {emitCandidates} from './emit.mjs';
import {loadSources} from './source-snapshot.mjs';

export function characteristicsCases(catalog) {
  if(!catalog.has('common.characteristics-descriptions'))throw new Error('Missing characteristics declaration');
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  loadSources(extraction.sourceHashes);
  const source=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
  if(!source?.properties.some(property=>property.name==='characteristics'))throw new Error('Missing source Characteristics');
  const projected={...source,properties:source.properties.filter(property=>property.name==='characteristics')};
  const emitted=emitCandidates([projected],catalog);
  const [boundary]=emitted.entries[0].projections;
  if(boundary?.fields.join(',')!=='characteristics')throw new Error('Characteristics was not emitted from source');
  const modules=emitted.modules;
  const owner=modules.find(module=>module.id===boundary.id);
  if(!owner)throw new Error('Missing emitted Characteristics owner');
  owner.id='migration.characteristics-owner';
  const names=[
    ['Enums','Перечисление','ПеречислениеВсеСвойства'],
    ['Catalogs','Справочник','СправочникПолный'],
    ['Catalogs','Справочник','СправочникСХарактеристиками'],
    ['ChartsOfCharacteristicTypes','ПланВидовХарактеристик','ПланВидовХарактеристикВсеСвойства'],
    ['BusinessProcesses','БизнесПроцесс','БизнесПроцессВсеСвойства'],
    ['ChartsOfAccounts','ПланСчетов','ПланСчетовВсеСвойства'],
    ['ChartsOfCalculationTypes','ПланВидовРасчета','ПланРасчетаВсеСвойства'],
    ['Documents','Документ','ДокументВсеСвойства'],
    ['ExchangePlans','ПланОбмена','ПланОбменаВсеСвойства'],
    ['Tasks','Задача','ЗадачаВсеСвойства'],
  ];
  const requests=names.map(([xmlFolder,yamlFolder,name])=>({
    xml:`e2e/fixtures/xml/cf/${xmlFolder}/${name}.xml`,
    yaml:`e2e/fixtures/nkdk/cf/${yamlFolder}/${name}/Свойства.yaml`,
    fields:[{xml:'Characteristics',yaml:'Характеристики'}],
  }));
  const selected=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    encoding:'utf8',input:JSON.stringify(requests)}));
  const cases=selected.map((row,index)=>({id:`characteristics-${names[index][2]}`,entry:owner.id,
    xml:row.xml,yaml:row.yaml,xmlQNamePaths:row.xmlQNamePaths,
    source:row.source,noRaw:true}));
  const emptySources=[
    'e2e/fixtures/xml/cf/Catalogs/СправочникБезКодИНаименования.xml',
    'e2e/fixtures/nkdk/cf/Справочник/СправочникБезКодИНаименования/Свойства.yaml',
  ];
  if(!readFileSync(emptySources[0],'utf8').includes('<Characteristics/>')
    || readFileSync(emptySources[1],'utf8').includes('Характеристики:'))
    throw new Error('Changed empty characteristics fixture');
  cases.push({id:'characteristics-empty',entry:owner.id,
    xml:'<Properties><Characteristics/></Properties>',annotation:'Characteristics: !xml/raw',
    source:emptySources.map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}))});
  cases.push({...cases.at(-1),id:'characteristics-empty-array',reverseYAML:'Характеристики: []'});
  const service=cases[0];
  cases.push({...service,id:'characteristics-negative-service-field',
    xml:service.xml.replace('<xr:MultipleValuesUseField>-1</xr:MultipleValuesUseField>',
      '<xr:MultipleValuesUseField>-8</xr:MultipleValuesUseField>'),
    yaml:service.yaml.replace('    ПолеКлюча:',
      '    ПолеИспользованияМножественныхЗначений: "-8"\n    ПолеКлюча:')});
  cases.push({...service,id:'characteristics-invalid-service-field',noRaw:false,
    xml:service.xml.replace('<xr:MultipleValuesUseField>-1</xr:MultipleValuesUseField>',
      '<xr:MultipleValuesUseField>-oops</xr:MultipleValuesUseField>'),
    yaml:undefined,annotation:'    ПолеИспользованияМножественныхЗначений: !xml/invalid "-oops"'});
  const named=cases[1];
  cases.push({...named,id:'characteristics-named-filter-reference',
    xml:named.xml.replace('xsi:type="xs:string">Текст</xr:TypesFilterValue>',
      'xsi:type="xr:DesignTimeRef">Catalog.СправочникПолный</xr:TypesFilterValue>'),
    yaml:named.yaml.replace('ЗначениеОтбораВидов: "Текст"',
      'ЗначениеОтбораВидов: Справочник.СправочникПолный')});
  cases.push({...named,id:'characteristics-boolean-filter',
    xml:named.xml.replace('xsi:type="xs:string">Текст</xr:TypesFilterValue>',
      'xsi:type="xs:boolean">true</xr:TypesFilterValue>'),
    yaml:named.yaml.replace('ЗначениеОтбораВидов: "Текст"',
      'ЗначениеОтбораВидов: Истина')});
  const prefixed='1:e199ca70-93cf-46ce-a54b-6edc88c3a296';
  cases.push({...named,id:'characteristics-prefixed-uuid-filter',
    xml:named.xml.replace('xsi:type="xs:string">Текст</xr:TypesFilterValue>',
      `xsi:type="xr:DesignTimeRef">${prefixed}</xr:TypesFilterValue>`),
    yaml:named.yaml.replace('ЗначениеОтбораВидов: "Текст"',
      `ЗначениеОтбораВидов: ${prefixed}`)});
  for(const row of cases)for(const source of row.source)if(createHash('sha256').update(readFileSync(source.path)).digest('hex')!==source.sha256)
    throw new Error(`Changed characteristics fixture: ${source.path}`);
  return {modules,cases};
}
