import { ownerContext } from './fixture-context.mjs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

export function ownerContracts(manifest,catalog,snapshot) {
  const requests=[],modules=[];
  for(const [symbol,xmlFolder,yamlFolder,nameBase=yamlFolder] of [
    ['MetadataExternalDataSourceTableRules','ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables','ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойства/Таблицы','Таблица'],
    ['MetadataDocumentJournalCommandRules','DocumentJournals','ЖурналДокументов'],
    ['MetadataCommonCommandRules','CommonCommands','ОбщаяКоманда'],
    ['MetadataDocumentRules','Documents','Документ'],
    ['MetadataDocumentJournalRules','DocumentJournals','ЖурналДокументов'],
    ['MetadataWebServiceRules','WebServices','WebСервис'],
    ['MetadataWebSocketClientRules','WebSocketClients','WebSocketКлиент'],
    ['MetadataDocumentAttributeRules','Documents','Документ'],
    ['MetadataWebServiceOperationRules','WebServices','WebСервис'],
    ['MetadataWebServiceParameterRules','WebServices','WebСервис'],
    ['MetadataHTTPServiceMethodRules','HTTPServices','HTTPСервис'],
    ['MetadataConfigurationRules','Configuration','Конфигурация'],
    ['MetadataCommonFormRules','CommonForms','ОбщаяФорма'],
  ]) {
    const owner=manifest.entries.find(entry=>entry.symbol===symbol);
    const projection=owner?.projections.find(p=>p.root==='Properties');
    if(!projection)throw new Error(`Missing candidate ${symbol}`);
    modules.push(catalog.get(projection.id));
    const fields=projection.fragments.flatMap(id=>{
      const fragment=catalog.get(id);
      return fragment.representations.xml.fields.map(field=>{
        if(field.path.length!==2 || field.path[0]!=='Properties')throw new Error('Unsupported fixture projection path');
        const value=fragment.value.fields.find(value=>value.name===field.field);
        const common=catalog.get(fragment.imports[value.type.use]);
        return {xml:field.path[1],qname:common.representations?.xml?.kind==='qname',yaml:fragment.representations.yaml.fields.find(y=>y.field===field.field).key};
      });
    });
    if(symbol==='MetadataDocumentJournalCommandRules') {
      const name='Команда1';
      requests.push({entry:projection.id,name,fields,xmlItems:[{type:'Command',name}],yamlPath:['Команды',name],xml:'e2e/fixtures/xml/cf/DocumentJournals/ЖурналДокументовВсеСвойства.xml',yaml:'e2e/fixtures/nkdk/cf/ЖурналДокументов/ЖурналДокументовВсеСвойства/Свойства.yaml'});
      continue;
    }
    if(symbol==='MetadataConfigurationRules') {
      requests.push({entry:projection.id,name:'Конфигурация',fields,xml:'e2e/fixtures/xml/cf/Configuration.xml',yaml:'e2e/fixtures/nkdk/cf/Конфигурация.yaml'});
      continue;
    }
    if(symbol==='MetadataCommonFormRules') {
      requests.push({entry:projection.id,name:'Button',fields,xml:'e2e/fixtures/xml/cf/CommonForms/Button.xml',yaml:'e2e/fixtures/nkdk/cf/ОбщаяФорма/Button/Свойства.yaml'});
      continue;
    }
    if(symbol==='MetadataDocumentAttributeRules') {
      for(const name of ['СтроковыйРеквизит','РеквизитБулево','ПолныйРеквизит'])requests.push({entry:projection.id,name,fields,xmlItems:[{type:'Attribute',name}],yamlPath:['Реквизиты',name],xml:'e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства.xml',yaml:'e2e/fixtures/nkdk/cf/Документ/ДокументВсеСвойства/Свойства.yaml'});
      continue;
    }
    if(symbol==='MetadataHTTPServiceMethodRules') {
      for(const suffix of ['ПоУмолчанию','ВсеСвойства']) {
        const name='Метод'+suffix;
        requests.push({entry:projection.id,name,fields,xmlItems:[{type:'URLTemplate',name:'ШаблонURLВсеСвойства'},{type:'Method',name}],yamlPath:['ШаблоныURL','ШаблонURLВсеСвойства','Методы',name],xml:'e2e/fixtures/xml/cf/HTTPServices/HTTPСервисВсеСвойства.xml',yaml:'e2e/fixtures/nkdk/cf/HTTPСервис/HTTPСервисВсеСвойства/Свойства.yaml'});
      }
      continue;
    }
    if(['MetadataWebServiceOperationRules','MetadataWebServiceParameterRules'].includes(symbol)) {
      const operation=symbol==='MetadataWebServiceOperationRules';
      for(const suffix of ['ПоУмолчанию','ВсеСвойства']) {
        const name=(operation?'Операция':'Параметр')+suffix;
        const xmlItems=operation?[{type:'Operation',name}]:[{type:'Operation',name:'ОперацияВсеСвойства'},{type:'Parameter',name}];
        const yamlPath=operation?['Операции',name]:['Операции','ОперацияВсеСвойства','Параметры',name];
        requests.push({entry:projection.id,name,fields,xmlItems,yamlPath,xml:'e2e/fixtures/xml/cf/WebServices/WebСервисВсеСвойства.xml',yaml:'e2e/fixtures/nkdk/cf/WebСервис/WebСервисВсеСвойства/Свойства.yaml'});
      }
      continue;
    }
    for(const suffix of ['ПоУмолчанию','ВсеСвойства']) {
      const name=nameBase+suffix;
      requests.push({entry:projection.id,name,fields,xml:`e2e/fixtures/xml/cf/${xmlFolder}/${name}.xml`,yaml:`e2e/fixtures/nkdk/cf/${yamlFolder}/${name}/Свойства.yaml`});
    }
  }
  for(const request of requests) {
    if(!catalog.get(request.entry).inputs?.owner)continue;
    const context=ownerContext(snapshot,request.xml,request.name);
    for(const row of context.sources)if(createHash('sha256').update(readFileSync(row.source)).digest('hex')!==row.sha256)throw new Error(`Stale owner context: ${row.source}`);
    request.context=context;
  }
  const results=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify(requests),encoding:'utf8'}));
  const cases=results.map((result,index)=>{
    const request=requests[index],definition=catalog.get(request.entry);
    const values={defaultLanguage:'ru',registeredLanguages:['ru','en'],ownerName:request.name,...request.context?.values};
    const factBindings=Object.fromEntries(['roots','children'].filter(name=>definition.inputs?.[name]).map(name=>[name,`metadata.${name}`]));
    return {id:`e2e-properties-${request.name}`,entry:request.entry,...result,
      source:[...result.source,...(request.context?.sources??[]).map(row=>({path:row.source,sha256:row.sha256}))],
      ...(Object.keys(factBindings).length?{factBindings}:{}),
      inputs:Object.fromEntries(Object.entries(values).filter(([name])=>Object.hasOwn(definition.inputs??{},name))),
      adaptation:'Select supported direct Properties children; remove MDClasses namespace only; select original YAML blocks in declaration order; omitted fields remain unaccepted'};
  });
  return {modules,cases};
}
