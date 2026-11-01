import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {emitCandidates} from './emit.mjs';
import {sourceContract} from './source-contract.mjs';

const namespace='http://v8.1c.ru/8.3/xcf/logform';
const core='http://v8.1c.ru/8.1/data/core';
const qnames=[[`{${namespace}}Parameters`,`{${namespace}}Parameter`,`{${namespace}}Type`,`{${core}}Type`]];
const wrap=body=>`<Parameters xmlns="${namespace}" xmlns:v8="${core}" xmlns:xs="http://www.w3.org/2001/XMLSchema">${body}</Parameters>`;

export function formParametersCases(catalog) {
 const module=catalog.get('migration.form-parameters');
 if(!module)throw new Error('Missing form parameter declaration');
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 const original=extraction.entries.find(row=>row.symbol==='ClientApplicationFormRules');
 const emitted=emitCandidates([{...original,properties:original.properties.filter(row=>row.name==='parameters')}],catalog);
 const local=new Map([...catalog,...emitted.modules.map(row=>[row.id,row])]);
 const source=sourceContract(emitted.entries[0],'Form',local,'Form');
 const fixture='packages/rules/metadata/forms/commonObjects/formParameter/__fixtures__/';
 const full=readFileSync(fixture+'full.xml','utf8');
 const simple=(id,body,yaml)=>({id,entry:module.id,xml:wrap(body),yaml,noRaw:true,xmlQNamePaths:qnames});
 const cases=[
  simple('form-parameters-full',full,'Параметры:\n  КлючевойПараметр:\n    Тип: Булево\n    Ключевой: Истина\n  Параметр:\n    Тип: Булево'),
  simple('form-parameters-untyped',readFileSync(fixture+'withoutType.xml','utf8'),'Параметры:\n  ПараметрБезТипа:'),
  simple('form-parameters-false','<Parameter name="Обычный"><Type/><KeyParameter>false</KeyParameter></Parameter>','Параметры:\n  Обычный:\n    Ключевой: Ложь'),
  {id:'form-parameters-invalid-key',entry:module.id,xml:wrap('<Parameter name="Ошибочный"><Type/><KeyParameter>oops</KeyParameter></Parameter><Parameter name="Соседний"><Type/></Parameter>'),annotation:'    KeyParameter: !xml/raw',retainedYAML:['  Соседний:']},
  simple('form-parameters-empty','','Параметры: {}'),
  simple('form-parameters-order','<Parameter name="Второй"><Type/></Parameter><Parameter name="Первый"><Type/></Parameter>','Параметры:\n  Второй:\n  Первый:'),
  {id:'form-parameters-duplicates',entry:module.id,xml:wrap('<Parameter name="Повтор"><Type/></Parameter><Parameter name="Повтор"><Type/></Parameter>'),annotation:'Параметры: !xml/raw'},
  {...simple('form-parameters-type-prefix-alias',full,'Параметры:\n  КлючевойПараметр:\n    Тип: Булево\n    Ключевой: Истина\n  Параметр:\n    Тип: Булево'),xml:wrap(full).replaceAll('xs:', 'schema:').replace('xmlns:xs=', 'xmlns:schema=')},
 ];
 for(const [xmlRoot,yamlRoot] of [['cf','cf'],['cfe/all-extension','cfe/Расширение_All']])
 for(const name of ['ФормаСохранения','ФормаЗагрузки']) {
  const [row]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{encoding:'utf8',input:JSON.stringify([{
   xml:`e2e/fixtures/xml/${xmlRoot}/SettingsStorages/ХранилищеНастроекВсеСвойства/Forms/${name}/Ext/Form.xml`,
   yaml:`e2e/fixtures/nkdk/${yamlRoot}/ХранилищеНастроек/ХранилищеНастроекВсеСвойства/Формы/${name}/Форма.yaml`,
   sourceRoot:true,root:'Form',namespace,fields:source.fields.map(field=>({
    xml:field.xmlPath[1],namespace:field.namespace,qname:field.qname,yaml:field.yaml,
   })),
  }])}));
  cases.push({...row,id:`form-parameters-e2e-${xmlRoot.split('/')[0]}-${name}`,entry:source.entry,noRaw:true});
 }
 return {modules:[module,...source.modules],cases,factSources:[]};
}
