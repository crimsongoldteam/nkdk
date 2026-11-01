import {readyCases} from './ready-cases.mjs';
import {sourceOwnerAttachments} from './source-owner-attachments.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {internalInfoAttachment} from './internal-info-attachment.mjs';
import {loadSources} from './source-snapshot.mjs';

const factIndexes={typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids',
  thisNodes:'metadata.internal-this-nodes',containedIds:'metadata.internal-contained-ids'};

function operationFor(fragment) {
  return {format:'nkdk-declarations/1',kind:'object',id:fragment.id+'.operation',
    imports:{part:fragment.id},inputs:Object.fromEntries(Object.entries(fragment.inputs).map(([name,input])=>
      [name,factIndexes[name]?{index:factIndexes[name]}:input])),
    compose:[{use:'part',bind:Object.fromEntries(Object.keys(fragment.inputs).map(name=>[name,{input:name}]))}],
    value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
}

export function internalInfoCases(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
  loadSources(extraction.sourceHashes);
  const modules=[],cases=[],factSources=[];
  for(const [symbol,folder,name,qualifiedName,xmlItems] of [
    ['MetadataDocumentRules','Documents','ДокументВсеСвойства'],
    ['MetadataDocumentJournalRules','DocumentJournals','ЖурналДокументовВсеСвойства'],
    ['MetadataEnumerationRules','Enums','ПеречислениеВсеСвойства'],
    ['MetadataCatalogRules','Catalogs','СправочникПолный'],
    ['MetadataConstantRules','Constants','КонстантаВсеСвойства'],
    ['MetadataAccountingRegisterRules','AccountingRegisters','РегистрБухгалтерииВсеСвойстваОбороты'],
    ['MetadataInformationRegisterRules','InformationRegisters','РегистрСведенийВсеСвойстваНезависимый'],
    ['MetadataReportRules','Reports','ОтчетВсеСвойства'],
    ['MetadataChartOfCalculationTypesRules','ChartsOfCalculationTypes','ПланРасчетаВсеСвойства'],
    ['MetadataChartOfCharacteristicTypesRules','ChartsOfCharacteristicTypes','ПланВидовХарактеристикВсеСвойства'],
    ['MetadataAccumulationRegisterRules','AccumulationRegisters','РегистрНакопленияВсеСвойстваОбороты'],
    ['MetadataBusinessProcessRules','BusinessProcesses','БизнесПроцессВсеСвойства'],
    ['MetadataCalculationRegisterRules','CalculationRegisters','РегистрРасчетаВсеСвойства'],
    ['MetadataChartOfAccountsRules','ChartsOfAccounts','ПланСчетовВсеСвойства'],
    ['MetadataDataProcessorRules','DataProcessors','ОбработкаВсеСвойства'],
    ['MetadataDefinedTypeRules','DefinedTypes','ОпределяемыйТипВсеСвойства'],
    ['MetadataExternalDataSourceRules','ExternalDataSources','ВнешнийИсточникДанныхВсеСвойства'],
    ['MetadataFilterCriterionRules','FilterCriteria','КритерийОтбораВсеСвойства'],
    ['MetadataIntegrationServiceRules','IntegrationServices','СервисИнтеграцииВсеСвойства'],
    ['MetadataSequenceRules','Sequences','ПоследовательностьВсеПоля'],
    ['MetadataSettingsStorageRules','SettingsStorages','ХранилищеНастроекВсеСвойства'],
    ['MetadataTaskRules','Tasks','ЗадачаВсеСвойства'],
    ['MetadataWSReferenceRules','WSReferences','WSСсылкаВсеСвойства'],
    ['MetadataExternalDataSourceTableRules','ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables','ТаблицаВсеСвойства','ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства'],
    ['MetadataExternalDataSourceDimensionTableRules','ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables','ТаблицаИзмеренияВсеСвойства','ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства'],
    ['MetadataExternalDataSourceCubeRules','ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes','КубВсеСвойства','ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства'],
    ['MetadataExternalDataSourceCubeCollectionRules','ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes','КубВсеСвойства','ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства'],
    ['MetadataExternalDataSourceTableCollectionRules','ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables','ТаблицаВсеСвойства','ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства'],
    ['MetadataExternalDataSourceDimensionTableCollectionRules','ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables','ТаблицаИзмеренияВсеСвойства','ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства'],
    ['MetadataIntegrationServiceChannelRules','IntegrationServices','СервисИнтеграцииВсеСвойства','СервисИнтеграцииВсеСвойства.КаналСервисаИнтеграцииВсеСвойства',
      [{type:'IntegrationServiceChannel',name:'КаналСервисаИнтеграцииВсеСвойства'}]],
    ['RecalculationRules','CalculationRegisters/РегистрРасчетаВсеСвойства/Recalculations','ПерерасчетВсеСвойства','РегистрРасчетаВсеСвойства.ПерерасчетВсеСвойства'],
    ['MetadataDocumentTabularSectionRules','Documents','ДокументВсеСвойства','ДокументВсеСвойства.ТабличнаяЧасть',
      [{type:'TabularSection',name:'ТабличнаяЧасть'}]],
    ['MetadataTabularSectionRules','Documents','ДокументВсеСвойства',undefined,
      [{type:'TabularSection',name:'ТабличнаяЧасть'}]],
    ['MetadataBusinessProcessTabularSectionRules','BusinessProcesses','БизнесПроцессВсеСвойства',
      'БизнесПроцессВсеСвойства.ТабличнаяЧастьВсеСвойства',
      [{type:'TabularSection',name:'ТабличнаяЧастьВсеСвойства'}]],
    ['MetadataCatalogTabularSectionRules','Catalogs','СправочникПолный',
      'СправочникПолный.ТабличнаяЧасть',[{type:'TabularSection',name:'ТабличнаяЧасть'}]],
    ['MetadataChartOfAccountsTabularSectionRules','ChartsOfAccounts','ПланСчетовВсеСвойства',
      'ПланСчетовВсеСвойства.ТабличнаяЧастьВсеСвойства',
      [{type:'TabularSection',name:'ТабличнаяЧастьВсеСвойства'}]],
    ['MetadataChartOfCalculationTypesTabularSectionRules','ChartsOfCalculationTypes','ПланРасчетаВсеСвойства',
      'ПланРасчетаВсеСвойства.ТабличнаяЧастьВсеСвойства',
      [{type:'TabularSection',name:'ТабличнаяЧастьВсеСвойства'}]],
    ['MetadataChartOfCharacteristicTypesTabularSectionRules','ChartsOfCharacteristicTypes','ПланВидовХарактеристикВсеСвойства',
      'ПланВидовХарактеристикВсеСвойства.ТабличнаяЧасть',
      [{type:'TabularSection',name:'ТабличнаяЧасть'}]],
    ['MetadataDataProcessorTabularSectionRules','DataProcessors','ОбработкаВсеСвойства',
      'ОбработкаВсеСвойства.ТабличнаяЧастьВсеСвойства',
      [{type:'TabularSection',name:'ТабличнаяЧастьВсеСвойства'}]],
    ['MetadataExchangePlanTabularSectionRules','ExchangePlans','ПланОбменаВсеСвойства',
      'ПланОбменаВсеСвойства.ТабличнаяЧастьВсеСвойства',
      [{type:'TabularSection',name:'ТабличнаяЧастьВсеСвойства'}]],
    ['MetadataReportTabularSectionRules','Reports','ОтчетВсеСвойства',
      'ОтчетВсеСвойства.ТабличнаяЧастьВсеСвойства',
      [{type:'TabularSection',name:'ТабличнаяЧастьВсеСвойства'}]],
    ['MetadataTaskTabularSectionRules','Tasks','ЗадачаВсеСвойства',
      'ЗадачаВсеСвойства.ТабличнаяЧастьВсеСвойства',
      [{type:'TabularSection',name:'ТабличнаяЧастьВсеСвойства'}]],
  ]) {
    const result=internalInfoAttachment(extraction.entries.find(e=>e.symbol===symbol));
    if(result.status!=='candidate')throw new Error(result.reason);
    const fragment=result.module;
    const producer=structuredClone(catalog.get('migration.journal-internal-types'));
    producer.id=fragment.id+'.source';
    producer.representations=structuredClone(fragment.representations);
    producer.namespaces=fragment.namespaces;
    const module=operationFor(fragment);
    const root=fragment.representations.xml.fields[0].path[0];
    const [example]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{encoding:'utf8',input:JSON.stringify([{
      xml:`e2e/fixtures/xml/cf/${folder}/${name}.xml`,internalTypes:true,...(xmlItems?{xmlItems}:{}),
      ...(!xmlItems && root!=='md:MetaDataObject'?{internalRoot:root.split(':')[1]}:{}),
    }])}));
    if(qualifiedName && (example.name!==(xmlItems?.[0].name??name) || !example.xml.includes('.'+qualifiedName+'"')))throw new Error(`Unexpected qualified generated-type name: ${symbol}`);
    modules.push(fragment,producer,module);
    const sourceId=`${producer.id}.${symbol}`;
    const factBindings=Object.fromEntries(Object.entries(factIndexes)
      .filter(([name])=>Object.hasOwn(fragment.inputs,name)));
    if(Object.keys(factBindings).length)factSources.push({id:sourceId,entry:producer.id,xml:example.xml,inputs:{owner:example.owner}});
    const explicit=!(extraction.entries.find(e=>e.symbol===symbol).properties
      .find(property=>property.type==='InternalInfo').parameters.items?.length);
    cases.push({id:'source-internal-info-'+symbol,entry:module.id,xml:example.xml,
      ...(explicit?{yaml:undefined,retainedYAML:['ВнутренниеТипы:'],noRaw:true}:{yaml:''}),
      inputs:{owner:example.owner,name:qualifiedName??example.name},source:example.source,
      ...(Object.keys(factBindings).length?{factBindings,factSourceEntries:[sourceId]}:{})});
  }
  // Protect mounting independent services together on a real owner, without
  // repeating the behavioral matrices of internal types and child names.
  const catalogOwner=extraction.entries.find(row=>row.symbol==='MetadataCatalogRules');
  const services=sourceOwnerAttachments(catalogOwner,'test.catalog-services',{claimed:['commands']});
  if(services.blockers.length)throw new Error('Incomplete catalog services');
  const nameFragment={format:'nkdk-declarations/1',kind:'fragment',id:'test.catalog-services.name',
    namespaces:{md:'http://v8.1c.ru/8.3/MDClasses'},value:{kind:'record',fields:[{name:'fixtureName',type:{kind:'scalar',scalar:'text'}}]},
    representations:{xml:{kind:'record',fields:[{field:'fixtureName',path:['md:MetaDataObject','md:Catalog','md:Properties','md:Name']}]},
      yaml:{kind:'mapping',fields:[{field:'fixtureName',key:'Имя'}]}}};
  const mountServices=(result,id,xmlOrder)=>{
    const operation=composeOwnerFragments(id,[
      ...result.attachments.map(row=>({alias:row.alias,fragment:row.module,
        bindings:Object.fromEntries(Object.keys(row.module.inputs??{}).map(name=>[name,`${row.alias}_${name}`]))})),
      {alias:'name',fragment:nameFragment,bindings:{}},
    ]);
    for(const row of result.attachments)for(const [name,index] of Object.entries(row.indexProviders??{}))
      operation.inputs[`${row.alias}_${name}`].index=index;
    operation.xmlOrder=xmlOrder;
    modules.push(...result.attachments.map(row=>row.module).filter(row=>!modules.some(existing=>existing.id===row.id)),operation);
    return operation;
  };
  const mounted=mountServices(services,'test.catalog-services',['types','fixtureName','forms','templates']);
  const originalCase=cases.find(row=>row.id==='source-internal-info-MetadataCatalogRules');
  const xmlPath='e2e/fixtures/xml/cf/Catalogs/СправочникПолный.xml';
  const yamlPath='e2e/fixtures/nkdk/cf/Справочник/СправочникПолный/Свойства.yaml';
  const [mountedExample]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    encoding:'utf8',input:JSON.stringify([{xml:xmlPath,yaml:yamlPath,ownerFields:{internalInfo:true,
      properties:[{xml:'Name'}],collections:[{item:'Form',xmlOnly:true},{item:'Template',xmlOnly:true}]}}])}));
  modules.push(nameFragment);
  cases.push({...originalCase,id:'source-catalog-mounted-services',entry:mounted.id,xml:mountedExample.xml,
    yaml:'Имя: СправочникПолный',noRaw:true,
    inputs:{...Object.fromEntries(Object.entries(originalCase.inputs).map(([name,value])=>['internal_'+name,value])),
      children_forms:mountedExample.ownerForms,children_templates:mountedExample.ownerTemplates},
    factBindings:Object.fromEntries(Object.entries(originalCase.factBindings).map(([name,value])=>['internal_'+name,value]))});
  const resources=sourceOwnerAttachments(catalogOwner,'test.catalog-file-services',
    {catalog,claimed:['commands','objectModule']});
  if(resources.blockers.length)throw new Error('Incomplete catalog file services');
  const mountedFiles=mountServices(resources,'test.catalog-file-services',
    ['types','fixtureName','forms','templates','indexes','help']);
  const external=readyCases();
  const indexes=external.cases.find(row=>row.id==='e2e/fixtures/xml/cf/Catalogs/СправочникПолный/Ext/AdditionalIndexes.xml');
  const help=external.cases.find(row=>row.id==='e2e/fixtures/xml/cf/Catalogs/СправочникПолный/Ext/Help.xml');
  if(!indexes||!help||indexes.inputs.owner!==xmlPath.slice(0,-4))throw new Error('Missing independent catalog resource examples');
  const indexProducer=catalog.get('migration.journal-additional-index-identity-source');
  const indexSourceId='test.catalog-file-services.index-source';
  factSources.push({id:indexSourceId,entry:indexProducer.id,xml:indexes.documents[0].xml,inputs:{owner:indexes.inputs.owner}});
  modules.push(indexProducer);
  cases.push({...cases.find(row=>row.id==='source-catalog-mounted-services'),id:'source-catalog-mounted-file-services',entry:mountedFiles.id,
    inputs:{...cases.find(row=>row.id==='source-catalog-mounted-services').inputs,indexes_owner:indexes.inputs.owner,help_pages:help.inputs.pages},
    factBindings:{...Object.fromEntries(Object.entries(originalCase.factBindings).map(([name,value])=>['internal_'+name,value])),indexes_identities:'metadata.additional-index-ids'},
    factSourceEntries:[...originalCase.factSourceEntries,indexSourceId],documents:[...indexes.documents,...help.documents],
    yaml:indexes.yaml.replace('Проверка: example','Имя: СправочникПолный').trimEnd()});
  for(const [id,symbol,path] of [
    ['configuration-cf','MetadataConfigurationRules','cf/Configuration.xml'],
    ['configuration-cfe','MetadataConfigurationExtensionRules','cfe/default/Configuration.xml'],
    ['exchange-plan-cf','MetadataExchangePlanRules','cf/ExchangePlans/ПланОбменаВсеСвойства.xml'],
    ['exchange-plan-cfe','MetadataExchangePlanRules','cfe/all-extension/ExchangePlans/ПланОбменаВсеСвойстваExt.xml'],
  ]) {
    const owner=extraction.entries.find(entry=>entry.symbol===symbol);
    const result=internalInfoAttachment(owner);
    if(result.status!=='candidate')throw new Error(`${symbol}: ${result.reason}`);
    const fragment=result.module;
    const source=structuredClone(fragment);
    source.id=fragment.id+'.source';
    source.kind='object';
    source.inputs={owner:fragment.inputs.owner,name:fragment.inputs.name};
    source.presence=source.presence.map(({target,xml})=>({target,xml,
      yaml:{missing:{denotes:{absent:true}}}}));
    if(owner.properties.find(property=>property.type==='InternalInfo').parameters.items?.length) {
      const generated=catalog.get('migration.journal-internal-types');
      source.types=structuredClone(generated.types);
      source.contributions=[...generated.contributions,...(source.contributions??[])];
    }
    const module=operationFor(fragment);
    const [example]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
      encoding:'utf8',input:JSON.stringify([{xml:`e2e/fixtures/xml/${path}`,internalTypes:true}])}));
    const inputs={owner:example.owner,name:example.name};
    const factBindings=Object.fromEntries(Object.entries(factIndexes)
      .filter(([name])=>Object.hasOwn(fragment.inputs,name)));
    modules.push(fragment,source,module);
    const sourceId=`${source.id}.${id}`;
    factSources.push({id:sourceId,entry:source.id,xml:example.xml,inputs});
    cases.push({id:'source-internal-info-'+id,entry:module.id,xml:example.xml,yaml:'',
      inputs,source:example.source,factBindings,factSourceEntries:[sourceId]});
  }
  const configuration=cases.find(row=>row.id==='source-internal-info-configuration-cf');
  const existingContained=configuration?.xml.match(/<xr:ContainedObject>[\s\S]*?<\/xr:ContainedObject>/)?.[0];
  if(!existingContained)throw new Error('Real Configuration ContainedObject is missing');
  const extraContained=existingContained
    .replace(/<xr:ClassId>[^<]+<\/xr:ClassId>/,'<xr:ClassId>00000000-0000-0000-0000-000000000123</xr:ClassId>')
    .replace(/<xr:ObjectId>[^<]+<\/xr:ObjectId>/,'<xr:ObjectId>00000000-0000-0000-0000-000000000456</xr:ObjectId>');
  const extraXml=configuration.xml.replace(/(<\/[^>]*InternalInfo>)/,extraContained+'$1');
  if(extraXml===configuration.xml)throw new Error('Real Configuration InternalInfo boundary is missing');
  const configurationSource=factSources.find(row=>row.id===configuration.factSourceEntries[0]);
  if(!configurationSource)throw new Error('Real Configuration fact source is missing');
  const addConfigurationVariation=(suffix,xml,retainedYAML)=>{
    if(xml===configuration.xml)throw new Error(`Configuration ${suffix} did not change the XML`);
    const id=configuration.factSourceEntries[0]+'.'+suffix;
    factSources.push({...configurationSource,id,xml});
    cases.push({...configuration,id:'source-internal-info-configuration-'+suffix,xml,
      yaml:undefined,retainedYAML,noRaw:true,factSourceEntries:[id]});
  };
  addConfigurationVariation('extra-contained',extraXml,
    ['ВнутренниеОбъекты:','  - Класс: 00000000-0000-0000-0000-000000000123']);
  const reorderedXml=configuration.xml.replace(
    /(<xr:ContainedObject>[\s\S]*?<\/xr:ContainedObject>)(\s*)(<xr:ContainedObject>[\s\S]*?<\/xr:ContainedObject>)/,
    '$3$2$1');
  addConfigurationVariation('reordered-contained',reorderedXml,['ВнутренниеОбъекты:']);
  const exchange=cases.find(row=>row.id==='source-internal-info-exchange-plan-cf');
  const original=exchange?.xml.match(/<xr:GeneratedType\b[\s\S]*?<\/xr:GeneratedType>/)?.[0];
  if(!original)throw new Error('Real ExchangePlan GeneratedType is missing');
  const xml=exchange.xml.replace(original,`${original}${original}`);
  const rows=[...xml.matchAll(/<xr:GeneratedType name="([^"]+)" category="([^"]+)">([\s\S]*?)<\/xr:GeneratedType>/g)]
    .map(([,name,category,body])=>({name,category,
      typeId:body.match(/<xr:TypeId>([^<]+)<\/xr:TypeId>/)?.[1],
      valueId:body.match(/<xr:ValueId>([^<]+)<\/xr:ValueId>/)?.[1]}));
  if(rows.length!==6 || rows.some(row=>!row.typeId||!row.valueId))throw new Error('Unexpected real GeneratedType rows');
  const sourceId=exchange.factSourceEntries[0]+'.repeated';
  const originalSource=factSources.find(row=>row.id===exchange.factSourceEntries[0]);
  if(!originalSource)throw new Error('Real ExchangePlan fact source is missing');
  const extraAttributeXml=exchange.xml.replace(original,
    original.replace('<xr:GeneratedType ', '<xr:GeneratedType extra="fixture-attribute" '));
  if(extraAttributeXml===exchange.xml)throw new Error('GeneratedType attribute mutation failed');
  const extraAttributeSourceId=exchange.factSourceEntries[0]+'.extra-attribute';
  factSources.push({...originalSource,id:extraAttributeSourceId,xml:extraAttributeXml});
  cases.push({...exchange,id:'source-internal-info-exchange-plan-extra-attribute',
    xml:extraAttributeXml,yaml:undefined,
    annotation:'ВнутренниеТипы: !xml/raw',retainedYAML:['      Категория: Ref'],
    factSourceEntries:[extraAttributeSourceId]});
  factSources.push({...originalSource,id:sourceId,xml});
  cases.push({...exchange,id:'source-internal-info-exchange-plan-repeated',xml,
    yaml:'ВнутренниеТипы:\n'+rows.map(row=>
      `  - Имя: ${row.name}\n    Категория: ${row.category}\n    Тип: ${row.typeId}\n    Значение: ${row.valueId}`).join('\n'),
    factSourceEntries:[sourceId],noRaw:true});
  return {modules,cases,factSources};
}
