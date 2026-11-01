import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {yaml} from './candidate-catalog.mjs';
import {sourceProjection,relativeSourceProjection} from './source-projection.mjs';
import {dataSetFieldCases} from './data-set-field-cases.mjs';
import {calculatedFieldsCases} from './calculated-fields-cases.mjs';
import {dcsParameterCase} from './dcs-parameter-case.mjs';

function collectionFromCase(family,id) {
 const row=family.cases.find(row=>row.id===id);
 const owner=family.modules.find(module=>module.id===row?.entry);
 if(owner?.value?.fields?.length!==1)throw new Error('Expected one checked collection boundary');
 const type=owner.value.fields[0].type;
 const module=family.modules.find(module=>module.id===owner.imports[type.use]);
 if(module?.value?.kind!=='sequence')throw new Error('Expected a prepared collection');
 return {module,row};
}

// The converter remains general; this fixture assembly exercises several
// existing source registrations together, using independent legacy examples.
export function dynamicListCollectionComposition(owner,catalog,queryCase) {
 const families=[dataSetFieldCases(catalog),calculatedFieldsCases(catalog),dcsParameterCase(catalog)];
 const selections=[['fields','data-set-field-registered-form-collection'],
  ['calculatedFields','calculated-fields-real-0'],['parameters','real-dynamic-list-dcs-parameters-whole']];
 const chosen=selections.map(([property,id],index)=>({property,...collectionFromCase(families[index],id)}));
 const modules=new Map(families.flatMap(family=>family.modules).map(module=>[module.id,module]));
 const combined=new Map([...catalog,...modules]);
 const path='e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml';
 const source=readFileSync(path,'utf8');
 const namespaceAttributes=[...source.match(/<Form\b([^>]*)>/)[1].matchAll(/\bxmlns(?::([\w.-]+))?="([^"]+)"/g)];
 const namespaces=Object.fromEntries(namespaceAttributes.map(match=>[match[1]??'form',match[2]]));
 const collectionValues=Object.fromEntries(chosen.map(({property,module})=>[
  owner.properties.find(row=>row.name===property).parameters.type,{module}]));
 const projection=sourceProjection(owner,combined,{properties:[...selections.map(([property])=>property),'customQuery','queryText'],
  id:'working.dynamic-list-collection-composition',root:'Settings',namespaces,defaultXmlNamespace:'form',
  collectionValues,deferOwnerContributions:true});
 if(projection.ownerRequirements?.length!==3)throw new Error('Lost collection operation requirements');
 const attribute=source.match(/<Attribute name="ПроизвольныйЗапрос"[^>]*>([\s\S]*?)<\/Attribute>/)?.[1];
 const settings=attribute?.match(/<Settings\b[^>]*>([\s\S]*?)<\/Settings>/)?.[1];
 if(!settings)throw new Error('Missing real owner Settings');
 const elements=[...settings.matchAll(/<(Field|CalculatedField|Parameter|QueryText|ManualQuery)\b[^>]*>[\s\S]*?<\/\1>/g)].map(match=>match[0]);
 if(elements.filter(text=>text.startsWith('<Field')).length!==10)throw new Error('Changed field fixture inventory');
 const wrap=body=>`<Settings ${namespaceAttributes.map(match=>match[0]).join(' ')} xsi:type="DynamicList">${body}</Settings>`;
 const yamlPath='e2e/fixtures/nkdk/cf/ОбщаяФорма/ДинамическийСписок/Свойства.yaml';
 const fields=readFileSync(yamlPath,'utf8').match(/^        Поля:\n((?:^          .*\n)+)/m)?.[1];
 if(!fields)throw new Error('Missing independent field expectations');
 const records=yaml.load(fields.split('\n').map(line=>line.slice(10)).join('\n'));
 const order=['Вид','ПутьКДанным','Поле','ОграничениеИспользования'];
 if(records.some(row=>Object.keys(row).some(key=>!order.includes(key))))throw new Error('Field expectation needs review');
 const expectedFields=yaml.dump({Поля:records.map(row=>Object.fromEntries(order.filter(key=>Object.hasOwn(row,key)).map(key=>[key,row[key]])))},
  {noRefs:true,lineWidth:-1}).trimEnd();
 const expected=[chosen[1].row.yaml,queryCase.yaml,expectedFields,chosen[2].row.yaml].join('\n');
 const base={id:'dynamic-list-collections-together',entry:projection.value.id,xml:wrap(elements.join('')),yaml:expected,
  inputs:{...chosen[0].row.inputs,...queryCase.inputs},factBindings:chosen[0].row.factBindings,
  yamlDocuments:queryCase.yamlDocuments,noRaw:false,
  xmlQNamePaths:[...chosen[1].row.xmlQNamePaths,...chosen[2].row.xmlQNamePaths],
  source:[{path},{path:yamlPath},{path:owner.path},...queryCase.source],
  adaptation:'Three real registered collections, ManualQuery and QueryText together; other owner properties and yamlPath operation contributions remain separate'};
 const empty={...base,id:'dynamic-list-collections-absent',xml:wrap(elements.filter(text=>/^<(ManualQuery|QueryText)\b/.test(text)).join('')),
  yaml:queryCase.yaml};
 const malformed=base.xml.replace('<dcssch:useRestriction>true</dcssch:useRestriction>','<dcssch:useRestriction>oops</dcssch:useRestriction>');
 if(malformed===base.xml)throw new Error('Missing real parameter boolean');
 const annotation=families[2].cases.find(row=>row.id==='real-dynamic-list-dcs-parameter-invalid-boolean')?.annotation;
 if(!annotation)throw new Error('Missing independent parameter anomaly expectation');
 const complete=sourceProjection(owner,combined,{properties:owner.properties.filter(row=>!row.parameters.runtimeOnly).map(row=>row.name),
  id:'working.dynamic-list-complete-value',root:'Settings',namespaces,defaultXmlNamespace:'form',
  collectionValues,deferOwnerContributions:true});
 const library=relativeSourceProjection(owner,combined,{properties:complete.value.yamlOrder,
  id:'common.dynamic-list',namespaces,defaultXmlNamespace:'form',collectionValues,deferOwnerContributions:true});
 if(projection.ownerRequirements.some(row=>!complete.ownerRequirements.some(requirement=>
  requirement.property===row.property && requirement.indexAddressing===row.indexAddressing)))
  throw new Error('Complete value lost collection operation requirements');
 const expectedText=readFileSync(yamlPath,'utf8');
 const independentBody=name=>{
  const section=expectedText.match(new RegExp('^    '+name+':\\n((?:^      .*\\n)+)','m'))?.[1];
  const independent=section?.match(/^      ДинамическийСписок:\n((?:^        .*\n)+)/m)?.[1];
  if(!independent)throw new Error('Missing independent DynamicList expectation: '+name);
  return independent.split('\n').map(line=>line.slice(8)).join('\n');
 };
 const rootLines=name=>independentBody(name).split('\n').filter(line=>/^\S/.test(line));
 const retained=rootLines('ПроизвольныйЗапрос');
 const full={...base,id:'dynamic-list-complete-value',entry:complete.value.id,xml:wrap(settings),yaml:undefined,
  retainedYAML:retained,reverseYAML:independentBody('ПроизвольныйЗапрос'),adaptation:'All serializable source properties together; independent complete e2e YAML for export; yamlPath operation contributions remain separate'};
 const minimumAttribute=source.match(/<Attribute name="ПроизвольныйЗапросМинимум"[^>]*>([\s\S]*?)<\/Attribute>/)?.[1];
 const minimumSettings=minimumAttribute?.match(/<Settings\b[^>]*>([\s\S]*?)<\/Settings>/)?.[1];
 if(!minimumSettings)throw new Error('Missing independent minimum DynamicList XML');
 const minimum={...full,id:'dynamic-list-complete-value-minimum',xml:wrap(minimumSettings),
  inputs:{...base.inputs,parentName:'ПроизвольныйЗапросМинимум'},retainedYAML:rootLines('ПроизвольныйЗапросМинимум'),
  reverseYAML:independentBody('ПроизвольныйЗапросМинимум'),
  yamlDocuments:[{path:['ДинамическийСписок','ПроизвольныйЗапросМинимум.query'],
   text:readFileSync('e2e/fixtures/nkdk/cf/ОбщаяФорма/ДинамическийСписок/ДинамическийСписок/ПроизвольныйЗапросМинимум.query','utf8')}]};
 for(const module of [...projection.modules,...complete.modules,...library.modules]) {
  if(modules.has(module.id) && !isDeepStrictEqual(modules.get(module.id),module))
    throw new Error('Conflicting composed declaration: '+module.id);
  modules.set(module.id,module);
 }
 const attributeOwner=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries.find(row=>row.symbol==='FormAttributeRules');
 const attached=sourceProjection(attributeOwner,new Map([...combined,...modules]),{properties:['dynamicList'],
  id:'working.dynamic-list-common-owner',root:'Attribute',namespaces,defaultXmlNamespace:'form'});
 for(const module of attached.modules) {
  if(modules.has(module.id) && !isDeepStrictEqual(modules.get(module.id),module))
    throw new Error('Conflicting composed declaration: '+module.id);
  modules.set(module.id,module);
 }
 const bad={...full,id:'dynamic-list-complete-value-invalid-neighbour',
  xml:full.xml.replace('<dcssch:useRestriction>true</dcssch:useRestriction>','<dcssch:useRestriction>oops</dcssch:useRestriction>'),annotation,reverseYAML:undefined};
 const owned=[full,minimum,bad].map(row=>({...row,id:row.id.replace('complete-value','common-owner'),entry:attached.value.id,
  xml:`<Attribute xmlns="${namespaces.form}">${row.xml}</Attribute>`,
  retainedYAML:['ДинамическийСписок:',...row.retainedYAML.map(line=>'  '+line)],
  reverseYAML:row.reverseYAML===undefined?undefined:'ДинамическийСписок:\n'+row.reverseYAML.split('\n').map(line=>line?'  '+line:line).join('\n'),
  ...(row.annotation?{annotation:'  '+row.annotation}:{}),
  xmlQNamePaths:row.xmlQNamePaths.map(path=>[`{${namespaces.form}}Attribute`,...path]),
  yamlEdits:[...(row===minimum?[]:JSON.parse(readFileSync('tests/migration/dynamic-list-yaml-edits.json','utf8'))),row===minimum?{
   yaml:[{from:'  ПроизвольныйЗапрос: Истина\n',to:'',count:1}],
   xml:[{from:'<ManualQuery>true</ManualQuery>',to:'<ManualQuery>false</ManualQuery>',count:1}]
  }:{
   yaml:[{from:'  АвтоЗаполнениеДоступныхПолей: Ложь\n',to:'',count:1}],
   xml:[{from:'<AutoFillAvailableFields>false</AutoFillAvailableFields>',to:'',count:1}]
  }],
  adaptation:'Real FormAttributeRules.dynamicList property imports the public common; edited YAML keeps sibling XML state; other attribute properties and project addressing remain separate'}));
 return {modules:[...modules.values()],factSources:families[0].factSources,
  cases:[base,empty,{...base,id:'dynamic-list-collections-invalid-neighbour',xml:malformed,yaml:undefined,
   annotation,retainedYAML:['Поля:','ВычисляемыеПоля:','ПроизвольныйЗапрос: Истина']},full,minimum,bad,...owned],
  ownerRequirements:complete.ownerRequirements};
}
