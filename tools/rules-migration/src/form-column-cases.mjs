import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {emitCollections} from './collection-emission.mjs';
import {yaml} from './candidate-catalog.mjs';
import {reconstructionProfiles} from './reconstruction-profiles.mjs';
import {sourceProjection} from './source-projection.mjs';

// Complete source row, isolated placement: not a complete FormAttribute owner.
export function formColumnCases(catalog) {
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json'));
  const edge=graph.edges.find(edge=>edge.owner.symbol==='FormAttributeRules' && edge.property==='columns');
  const child=entries.find(entry=>entry.path===edge.item.path && entry.symbol===edge.item.symbol);
  const owner={path:'tests/migration/column-placement',symbol:'ColumnPlacement',comparison:{status:'keys-match'},
    properties:[{name:'columns',status:'static-parameters',parameters:{type:edge.type,xml:'Column',xmlParents:['Columns'],yaml:'Колонки'}}]};
  const profilePath='tools/rules-migration/profiles/form-column-identity.yaml';
  const profile=yaml.load(readFileSync(profilePath,'utf8'));
  const reconstruction=reconstructionProfiles([profile],graph,entries);
  const emitted=emitCollections({...graph,edges:[{...edge,owner:{path:owner.path,symbol:owner.symbol}}]},[...entries,owner],catalog,
    {f:'http://v8.1c.ru/8.3/xcf/logform'}, {defaultXmlNamespace:'f',deferOwnerContributions:true,
      reconstructedFields:reconstruction.fields,itemXmlNamespaces:reconstruction.xmlNamespaces});
  if(emitted.results[0].status!=='candidate')throw new Error(JSON.stringify(emitted.results));
  const numberData=structuredClone(catalog.get('source.form-column-row-data'));
  const numberFacts=structuredClone(catalog.get('source.form-column-identities'));
  const source={...numberData,kind:'object',id:'contract.form-column-number-source',
    inputs:numberFacts.inputs,contributions:numberFacts.contributions,
    namespaces:{f:'http://v8.1c.ru/8.3/xcf/logform'}};
  source.representations.xml.fields[0].path=['f:Columns'];
  const fixture='packages/rules/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.xml';
  const extracted=JSON.parse(execFileSync('python3',['-c',
    "import json,sys,re; text=open(sys.argv[1]).read(); print(json.dumps(re.findall(r'<Column\\b.*?</Column>',text,re.S),ensure_ascii=False))",fixture],{encoding:'utf8'}));
  if(extracted.length!==2)throw new Error('Changed independent mixed column fixture');
  const namespace='xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xs="http://www.w3.org/2001/XMLSchema"';
  const inputs={component:'cf',owner:'FormProbe',parent:'Атрибут.График',defaultLanguage:'ru',registeredLanguages:['ru','en'],roles:[]};
  const sources=extracted.map((xml,index)=>({id:'form-column-number-'+index,entry:source.id,
    xml:`<Columns ${namespace}>${xml}</Columns>`,inputs:{component:inputs.component,owner:inputs.owner,parent:inputs.parent}}));
  const common={entry:emitted.results[0].declaration,inputs,factBindings:{numbers:'metadata.form-attribute-identities'},
    factSourceEntries:sources.map(row=>row.id),source:[{path:fixture},{path:profilePath}],
    xmlQNamePaths:[['Columns','Column','Type'].map(name=>'{http://v8.1c.ru/8.3/xcf/logform}'+name)
      .concat('{http://v8.1c.ru/8.1/data/core}Type')],adaptation:'Unchanged complete Column subtree; synthetic Columns placement; parent context and identities explicitly prepared. FormAttribute assembly is separate.'};
  const cases=extracted.map((xml,index)=>({...common,id:'form-column-real-'+index,xml:`<Columns ${namespace}>${xml}</Columns>`,
    yaml:index===0?'Колонки:\n  Отступ:\n    Тип: Строка':'Колонки:\n  Сумма:\n    Тип: Число(10, 2)',
    noRaw:true,retainedYAML:[index===0?'  Отступ:':'  Сумма:']}));
  for(const [id,replacement,annotation] of [
    ['missing','', '    id: !xml/raw'],
    ['empty','id=""', '    id: !xml/raw'],
    ['non-numeric','id="oops"', '    id: !xml/raw'],
  ])cases.push({...common,id:'form-column-id-'+id,
    xml:`<Columns ${namespace}>${extracted[0].replace('id="1"',replacement)}</Columns>`,annotation});
  cases.push({...common,id:'form-column-id-mismatch',xml:`<Columns ${namespace}>${extracted[0].replace('id="1"','id="99"')}</Columns>`,annotation:'    id: !xml/raw'});
  const duplicate=extracted.join('').replace('name="Сумма"','name="Отступ"');
  const duplicateSource={...sources[0],id:'form-column-numbers-repeated',xml:`<Columns ${namespace}>${duplicate}</Columns>`};
  sources.push(duplicateSource);
  cases.push({...common,id:'form-column-repeated-names',xml:duplicateSource.xml,
    factSourceEntries:[duplicateSource.id],annotation:'Колонки: !xml/raw'});
  const emptyName=extracted[0].replace('name="Отступ"','name=""');
  const emptySource={...sources[0],id:'form-column-number-empty-name',xml:`<Columns ${namespace}>${emptyName}</Columns>`};
  sources.push(emptySource);
  cases.push({...common,id:'form-column-empty-name',xml:emptySource.xml,factSourceEntries:[emptySource.id]});
  const groupEdge=graph.edges.find(row=>row.owner.symbol==='FormAttributeRules' && row.property==='additionalColumns');
  const groupRegistration=graph.registrations.find(row=>row.type===groupEdge.type);
  const groupOwner={...owner,properties:[{name:'additionalColumns',status:'static-parameters',
    parameters:{type:groupEdge.type,xml:groupEdge.mapping.xml,xmlParents:['Columns'],yaml:groupEdge.mapping.yaml}}]};
  const columnList=emitted.modules.find(module=>module.value.kind==='sequence');
  const groupModes=structuredClone(catalog.get('source.form-additional-group-modes-data'));
  groupModes.id='contract.form-column-group-modes';groupModes.kind='object';
  const text={kind:'scalar',scalar:'text'};
  const modeInput={type:{kind:'index',key:{kind:'record',fields:['component','owner','origin','parent','name'].map(name=>({name,type:text}))},value:text}};
  const modeKey={record:{component:{input:'component'},owner:{input:'owner'},origin:{literal:'current'},parent:{input:'parent'},name:{field:groupEdge.mapping.keyField}}};
  const groups=emitCollections({...graph,edges:[{...groupEdge,owner:{path:groupOwner.path,symbol:groupOwner.symbol}}]},
    [...entries,groupOwner],catalog,{f:'http://v8.1c.ru/8.3/xcf/logform'},
    {defaultXmlNamespace:'f',deferOwnerContributions:true,collectionValues:{[edge.type]:{module:columnList,inputs:{groupModes:modeInput},
      bindings:{parent:{if:{or:[{eq:[{field:groupEdge.mapping.keyField},{literal:''}]},{eq:[{require:{lookup:{in:{input:'groupModes'},key:modeKey}}},{literal:'positional'}]}]},
        then:{logicalAddress:{parent:{input:'parent'},parts:[{literal:groupRegistration.parameters.configurationIndexUidSegment},{collectionPosition:true}]}},
        else:{logicalAddress:{parent:{input:'parent'},parts:[{literal:groupRegistration.parameters.configurationIndexUidSegment},{field:groupEdge.mapping.keyField}]}}}}}}});
  if(groups.results[0].status!=='candidate')throw new Error(JSON.stringify(groups.results));
  const groupXML=readFileSync(fixture,'utf8').match(/<AdditionalColumns\b[\s\S]*?<\/AdditionalColumns>/)?.[0];
  if(!groupXML)throw new Error('Changed independent additional-column fixture');
  const modeSource={id:'form-column-group-mode-source',entry:groupModes.id,xml:`<Columns ${namespace}>${groupXML}</Columns>`,
    inputs:{component:inputs.component,owner:inputs.owner,parent:inputs.parent,origin:'current'}};
  sources.push(modeSource);
  const groupSource={...sources[1],id:'form-column-numbers-additional',inputs:{...sources[1].inputs,
    parent:inputs.parent+'.'+groupRegistration.parameters.configurationIndexUidSegment+'.ГрафикНачислений'}};
  sources.push(groupSource);
  cases.push({...common,id:'form-additional-column-real',entry:groups.results[0].declaration,
    xml:`<Columns ${namespace}>${groupXML}</Columns>`,factSourceEntries:[groupSource.id,modeSource.id],factBindings:{...common.factBindings,groupModes:'metadata.form-additional-group-address-modes'},
    xmlQNamePaths:[['Columns','AdditionalColumns','Column','Type'].map(name=>'{http://v8.1c.ru/8.3/xcf/logform}'+name)
      .concat('{http://v8.1c.ru/8.1/data/core}Type')],
    yaml:'ДополнительныеКолонки:\n  ГрафикНачислений:\n    Сумма:\n      Тип: Число(10, 2)',noRaw:true});
  const groupList=groups.modules.find(module=>module.value.kind==='sequence');
  const container={format:'nkdk-declarations/1',kind:'object',id:'contract.form-column-container',
    namespaces:{f:'http://v8.1c.ru/8.3/xcf/logform'},
    imports:{ordinary:columnList.id,additional:groupList.id},inputs:structuredClone(groupList.inputs),
    value:{kind:'record',fields:['ordinary','additional'].map(name=>({name,type:{use:name,
      bind:Object.fromEntries(Object.keys((name==='ordinary'?columnList:groupList).inputs).map(name=>[name,{input:name}]))}}))},
    representations:{xml:{kind:'record',fields:['ordinary','additional'].map(field=>({field,path:['f:Columns']}))},
      yaml:{kind:'mapping',fields:[{field:'ordinary',key:'Колонки'},{field:'additional',key:'ДополнительныеКолонки'}]}}};
  const containerXML=readFileSync(fixture,'utf8').match(/<Columns>[\s\S]*?<\/Columns>/)?.[0];
  if(!containerXML)throw new Error('Changed independent column container fixture');
  cases.push({...common,id:'form-column-shared-container',entry:container.id,
    xml:containerXML.replace('<Columns>',`<Columns ${namespace}>`),factSourceEntries:[sources[0].id,groupSource.id,modeSource.id],factBindings:{...common.factBindings,groupModes:'metadata.form-additional-group-address-modes'},
    xmlQNamePaths:[...common.xmlQNamePaths,...cases.find(row=>row.id==='form-additional-column-real').xmlQNamePaths],
    yaml:'Колонки:\n  Отступ:\n    Тип: Строка\nДополнительныеКолонки:\n  ГрафикНачислений:\n    Сумма:\n      Тип: Число(10, 2)',noRaw:true});
  const attributeOwner=entries.find(row=>row.symbol==='FormAttributeRules');
  const attached=sourceProjection(attributeOwner,new Map([...catalog,...emitted.modules.map(module=>[module.id,module]),
    ...groups.modules.map(module=>[module.id,module])]),{properties:['columns','additionalColumns'],
    id:'working.form-attribute-column-properties',root:'Attribute',namespaces:{f:'http://v8.1c.ru/8.3/xcf/logform'},
    defaultXmlNamespace:'f',collectionValues:{[edge.type]:{module:columnList},[groupEdge.type]:{module:groupList}}});
  const attachedCase=cases.find(row=>row.id==='form-column-shared-container');
  cases.push({...attachedCase,id:'form-attribute-columns-source-owner',entry:attached.value.id,
    xml:`<Attribute ${namespace}>${containerXML}</Attribute>`,reverseYAML:attachedCase.yaml,
    xmlQNamePaths:attachedCase.xmlQNamePaths.map(path=>['{http://v8.1c.ru/8.3/xcf/logform}Attribute',...path]),
    yamlEdits:[{yaml:[{from:'Тип: Строка',to:'Тип: Строка(10)',count:1}],
      xml:[{from:'<v8:Length>0</v8:Length>',to:'<v8:Length>10</v8:Length>',count:1}]}],
    adaptation:'Actual FormAttributeRules columns/additionalColumns parameters attach complete declared collections. FormAttribute assembly is separate.'});
  const sourceOwnerCase=cases.at(-1);
  cases.push({...sourceOwnerCase,id:'form-attribute-columns-source-owner-invalid-id',
    xml:sourceOwnerCase.xml.replace('id="1"','id="oops"'),yaml:undefined,reverseYAML:undefined,
    noRaw:false,annotation:'    id: !xml/raw'});
  const liveYAML='Реквизиты:\n  График:\n    Тип: ТаблицаЗначений\n    Колонки:\n      Отступ: {Тип: Строка}\n    ДополнительныеКолонки:\n      ГрафикНачислений:\n        Сумма: {Тип: "Число(10, 2)"}\nПрочиеНастройки: {ПроизвольноеПоле: true}';
  const liveSource={id:'form-column-live-yaml',entry:'metadata.public-form-column-requests',yaml:liveYAML,
    inputs:{component:inputs.component,owner:inputs.owner},
    snapshotYAML:'Реквизиты:\n  График:\n    Колонки:\n      Отступ: {}\n    ДополнительныеКолонки:\n      ГрафикНачислений:\n        Сумма: {}'};
  sources.push(liveSource);
  cases.push({...cases.find(row=>row.id==='form-column-shared-container'),id:'form-column-from-public-yaml',
    factSourceEntries:[liveSource.id,modeSource.id]});
  const publicModes={id:'form-column-public-group-modes',entry:'metadata.public-form-additional-group-modes',
    yaml:liveYAML,inputs:liveSource.inputs,
    snapshotYAML:'Реквизиты:\n  График:\n    ДополнительныеКолонки:\n      ГрафикНачислений: {}'};
  sources.push(publicModes);
  cases.push({...cases.find(row=>row.id==='form-column-shared-container'),id:'form-column-public-yaml-only',
    factSourceEntries:[liveSource.id,publicModes.id]});
  const reservationContract=structuredClone(catalog.get('metadata.form-id-reservations'));
  reservationContract.id='contract.form-column-reservations';
  reservationContract.contributions=reservationContract.contributions.filter(row=>row.index==='metadata.form-attribute-identities');
  const reservation={id:'form-column-historical-reservations',entry:reservationContract.id,
    yaml:'attributes: "1"\ncolumns: "2"\nattribute: "7"',inputs:liveSource.inputs};
  sources.push(reservation);
  const reservedXML=cases.find(row=>row.id==='form-column-shared-container').xml.replace('id="1"','id="3"').replace('id="2"','id="4"');
  cases.push({...cases.find(row=>row.id==='form-column-shared-container'),id:'form-column-public-yaml-with-reserves',
    xml:reservedXML,factSourceEntries:[liveSource.id,reservation.id,publicModes.id]});
  const foreignReservation={...reservation,id:'form-column-foreign-reservations',inputs:{...reservation.inputs,owner:'OtherForm'}};
  sources.push(foreignReservation);
  cases.push({...cases.find(row=>row.id==='form-column-shared-container'),id:'form-column-public-yaml-other-owner',
    factSourceEntries:[liveSource.id,foreignReservation.id,publicModes.id]});
  const emptyGroupSource={...liveSource,id:'form-column-public-empty-table',
    yaml:'Реквизиты:\n  График:\n    ДополнительныеКолонки:\n      "":\n        Сумма: {Тип: "Число(10, 2)"}'};
  delete emptyGroupSource.snapshotYAML;
  sources.push(emptyGroupSource);
  const emptyModeSource={...publicModes,id:'form-column-empty-table-modes',yaml:emptyGroupSource.yaml,
    snapshotYAML:'Реквизиты:\n  График:\n    ДополнительныеКолонки:\n      "": {}'};
  sources.push(emptyModeSource);
  const emptyGroupCase=cases.find(row=>row.id==='form-additional-column-real');
  cases.push({...emptyGroupCase,id:'form-additional-column-empty-table',
    xml:emptyGroupCase.xml.replace('table="ГрафикНачислений"','table=""').replace('id="2"','id="1"'),
    yaml:'ДополнительныеКолонки:\n  "":\n    Сумма:\n      Тип: Число(10, 2)',factSourceEntries:[emptyGroupSource.id,emptyModeSource.id]});
  const repeatedGroupXML=groupXML+groupXML.replace('id="2"','id="3"');
  const repeatedModes={...modeSource,id:'form-column-repeated-table-modes',xml:`<Columns ${namespace}>${repeatedGroupXML}</Columns>`};
  const repeatedNumbers=[0,1].map(position=>({...groupSource,id:'form-column-repeated-table-number-'+position,
    xml:groupSource.xml.replace('id="2"',`id="${position+2}"`),inputs:{...groupSource.inputs,
      parent:inputs.parent+'.'+groupRegistration.parameters.configurationIndexUidSegment+`[${position}]`}}));
  sources.push(repeatedModes,...repeatedNumbers);
  cases.push({...emptyGroupCase,id:'form-additional-column-repeated-table',xml:repeatedModes.xml,
    yaml:undefined,noRaw:false,annotation:'ДополнительныеКолонки: !xml/raw',
    factSourceEntries:[repeatedModes.id,...repeatedNumbers.map(row=>row.id)]});
  const repeatedFixture='tests/migration/fixtures/form-repeated-table.yaml';
  const repeatedYAML=readFileSync(repeatedFixture,'utf8');
  const fullRepeatedYAML='Реквизиты:\n  График:\n'+repeatedYAML.split('\n').map(line=>'    '+line).join('\n');
  const repeatedPublic={...liveSource,id:'form-column-public-repeated-tables',yaml:fullRepeatedYAML};
  delete repeatedPublic.snapshotYAML;
  const repeatedPublicModes={...publicModes,id:'form-column-public-repeated-table-modes',yaml:fullRepeatedYAML};
  delete repeatedPublicModes.snapshotYAML;
  sources.push(repeatedPublic,repeatedPublicModes);
  cases.push({...cases.find(row=>row.id==='form-additional-column-repeated-table'),id:'form-additional-column-repeated-table-public-yaml',
    source:[...common.source,{path:repeatedFixture}],reverseYAML:repeatedYAML,expectedFacts:[{index:'metadata.form-additional-group-address-modes',key:[inputs.component,'ГрафикНачислений','current',inputs.owner,inputs.parent],value:'positional'}],factSourceEntries:[repeatedPublic.id,repeatedPublicModes.id,reservation.id]});
  const storedCase=cases.find(row=>row.id==='form-column-shared-container');
  cases.push({...storedCase,id:'form-column-public-yaml-retains-existing',
    factSourceEntries:[liveSource.id,sources[0].id,groupSource.id,reservation.id,modeSource.id]});
  const renamedLive={...liveSource,id:'form-column-public-renamed',yaml:liveYAML.replaceAll('Отступ','Новый')};
  delete renamedLive.snapshotYAML;
  sources.push(renamedLive);
  cases.push({...storedCase,id:'form-column-public-yaml-new-name',
    xml:storedCase.xml.replaceAll('Отступ','Новый').replace('id="1"','id="3"'),yaml:storedCase.yaml.replaceAll('Отступ','Новый'),
    factSourceEntries:[renamedLive.id,sources[0].id,groupSource.id,reservation.id,modeSource.id]});
  const completeRequests={...liveSource,id:'form-public-number-requests',entry:'metadata.public-form-number-requests'};
  sources.push(completeRequests);
  cases.push({...storedCase,id:'form-column-with-attribute-number-request',
    xml:storedCase.xml.replace(/id="([12])"/g,(_,id)=>`id="${Number(id)+1}"`),
    factSourceEntries:[completeRequests.id,publicModes.id],
    expectedFacts:[{index:'metadata.form-attribute-identities',key:[inputs.component,inputs.parent,inputs.owner],value:'1'}]});
  const jointCase=cases.find(row=>row.id==='form-column-with-attribute-number-request');
  const changedIds=(xml,ids)=>xml.replace(/id="([12])"/g,(_,id)=>`id="${ids[Number(id)-1]}"`);
  cases.push({...jointCase,id:'form-joint-number-reserves',xml:changedIds(storedCase.xml,[4,5]),
    expectedFacts:[{index:'metadata.form-attribute-identities',key:[inputs.component,inputs.parent,inputs.owner],value:'3'}],
    factSourceEntries:[completeRequests.id,publicModes.id,reservation.id]});
  const attributeHistory={id:'form-attribute-existing-number',entry:'metadata.current-form-attribute-file-source',
    yaml:'Реквизиты:\n  - Имя: График\n    Идентификатор: "9"',inputs:liveSource.inputs};
  sources.push(attributeHistory);
  cases.push({...storedCase,id:'form-joint-number-retains-attribute',
    expectedFacts:[{index:'metadata.form-attribute-identities',key:[inputs.component,inputs.parent,inputs.owner],value:'9'}],
    factSourceEntries:[completeRequests.id,publicModes.id,attributeHistory.id]});
  const multipleRequests={...completeRequests,id:'form-number-two-attributes',
    yaml:liveYAML.replace('ПрочиеНастройки:', '  Второй:\n    Колонки:\n      Новый: {Тип: Булево}\nПрочиеНастройки:')};
  delete multipleRequests.snapshotYAML;
  const multipleModes={...publicModes,id:'form-number-two-attribute-modes',yaml:multipleRequests.yaml};
  delete multipleModes.snapshotYAML;
  sources.push(multipleRequests,multipleModes);
  cases.push({...jointCase,id:'form-joint-number-two-attributes',
    expectedFacts:[...jointCase.expectedFacts,
      {index:'metadata.form-attribute-identities',key:[inputs.component,'Атрибут.Второй',inputs.owner],value:'4'},
      {index:'metadata.form-attribute-identities',key:[inputs.component,'Атрибут.Второй.Колонка.Новый',inputs.owner],value:'5'}],
    factSourceEntries:[multipleRequests.id,multipleModes.id]});
  const emptyAttribute={...completeRequests,id:'form-number-empty-attribute',yaml:'Реквизиты:\n  "":\n    Колонки:\n      Отступ: {Тип: Строка}'};
  delete emptyAttribute.snapshotYAML;
  const emptyAttributeModes={...publicModes,id:'form-number-empty-attribute-modes',yaml:emptyAttribute.yaml};
  delete emptyAttributeModes.snapshotYAML;
  sources.push(emptyAttribute,emptyAttributeModes);
  cases.push({...cases.find(row=>row.id==='form-column-real-0'),id:'form-joint-number-empty-attribute',
    inputs:{...inputs,parent:'Атрибут[0]'},xml:changedIds(cases.find(row=>row.id==='form-column-real-0').xml,[2,3]),
    expectedFacts:[{index:'metadata.form-attribute-identities',key:[inputs.component,'Атрибут[0]',inputs.owner],value:'1'}],
    factSourceEntries:[emptyAttribute.id,emptyAttributeModes.id]});
  const repeatedAttributeFixture='tests/migration/fixtures/form-repeated-attributes.yaml';
  const repeatedAttributes={...completeRequests,id:'form-number-repeated-attributes',yaml:readFileSync(repeatedAttributeFixture,'utf8')};
  delete repeatedAttributes.snapshotYAML;
  const repeatedAttributeGroups={...publicModes,id:'form-number-repeated-attribute-groups',yaml:repeatedAttributes.yaml};
  delete repeatedAttributeGroups.snapshotYAML;
  sources.push(repeatedAttributes,repeatedAttributeGroups);
  for(const position of [0,1])cases.push({...cases.find(row=>row.id==='form-column-real-0'),id:'form-joint-number-repeated-attribute-'+position,
    inputs:{...inputs,parent:`Атрибут[${position}]`},xml:changedIds(cases.find(row=>row.id==='form-column-real-0').xml,[position*2+2,0]),
    factSourceEntries:[repeatedAttributes.id,repeatedAttributeGroups.id],source:[...common.source,{path:repeatedAttributeFixture}],
    expectedFacts:[
      {index:'metadata.form-attribute-address-modes',key:[inputs.component,'Повтор','current',inputs.owner],value:'positional'},
      {index:'metadata.form-attribute-identities',key:[inputs.component,`Атрибут[${position}]`,inputs.owner],value:String(position*2+1)}]});
  const repeatedGroupedFixture='tests/migration/fixtures/form-repeated-attributes-with-groups.yaml';
  const repeatedGrouped={...repeatedAttributes,id:'form-number-repeated-attributes-with-groups',yaml:readFileSync(repeatedGroupedFixture,'utf8')};
  const repeatedGroupedModes={...repeatedAttributeGroups,id:'form-number-repeated-attribute-group-modes',yaml:repeatedGrouped.yaml};
  sources.push(repeatedGrouped,repeatedGroupedModes);
  for(const position of [0,1])cases.push({...cases.find(row=>row.id==='form-additional-column-real'),id:'form-joint-number-repeated-attribute-group-'+position,
    inputs:{...inputs,parent:`Атрибут[${position}]`},
    xml:cases.find(row=>row.id==='form-additional-column-real').xml.replace('ГрафикНачислений','G').replace('id="2"',`id="${position*3+3}"`),
    yaml:'ДополнительныеКолонки:\n  G:\n    Сумма:\n      Тип: Число(10, 2)',
    factSourceEntries:[repeatedGrouped.id,repeatedGroupedModes.id],source:[...common.source,{path:repeatedGroupedFixture}],
    expectedFacts:[{index:'metadata.form-additional-group-address-modes',key:[inputs.component,'G','current',inputs.owner,`Атрибут[${position}]`],value:'named'},
      {index:'metadata.form-attribute-identities',key:[inputs.component,`Атрибут[${position}]`,inputs.owner],value:String(position*3+1)}]});
  const attributeProfilePath='tools/rules-migration/profiles/form-attribute-identity.yaml';
  const attributeProfile=yaml.load(readFileSync(attributeProfilePath,'utf8'));
  reconstructionProfiles([attributeProfile],graph,entries);
  const attributeIdentity={format:'nkdk-declarations/1',kind:'object',id:'contract.form-attribute-identity',
    namespaces:{f:'http://v8.1c.ru/8.3/xcf/logform'},inputs:attributeProfile.binding.inputs,
    value:{kind:'record',fields:['name','id'].map(name=>({name,type:{kind:'scalar',scalar:'text'}}))},
    representations:{xml:{kind:'record',fields:['name','id'].map(field=>({field,path:['f:Attribute'],attribute:field}))},
      yaml:{kind:'mapping',fields:[{field:'name',key:'Имя'}]}},
    presence:[{target:{field:'id'},yaml:{missing:{denotes:attributeProfile.binding.expression}}}]};
  const identityCase={id:'form-attribute-id-from-joint-requests',entry:attributeIdentity.id,
    xml:`<Attribute ${namespace} name="График" id="1"/>`,yaml:'Имя: График',
    inputs:liveSource.inputs,factBindings:common.factBindings,factSourceEntries:[completeRequests.id,publicModes.id],noRaw:true,
    source:[{path:fixture},{path:attributeProfilePath}],adaptation:'Identity-only projection from actual name/id; FormAttribute assembly is separate.'};
  cases.push(identityCase,{...identityCase,id:'form-attribute-id-from-history',xml:identityCase.xml.replace('id="1"','id="9"'),
    factSourceEntries:[completeRequests.id,publicModes.id,attributeHistory.id]},
    {...identityCase,id:'form-attribute-id-mismatch',xml:identityCase.xml.replace('id="1"','id="99"'),yaml:undefined,noRaw:false,annotation:'id: !xml/raw'});
  const publicEntries=new Set(['metadata.public-form-column-requests','metadata.public-form-number-requests','metadata.public-form-additional-group-modes']);
  const modeSources=new Map(),modeIds=new Map();
  for(const source of sources.filter(row=>publicEntries.has(row.entry))) {
    const key=JSON.stringify({yaml:source.yaml,inputs:source.inputs});
    if(!modeSources.has(key))modeSources.set(key,{id:'form-attribute-modes-'+createHash('sha256').update(key).digest('hex').slice(0,16),
      entry:'metadata.public-form-attribute-modes',yaml:source.yaml,inputs:source.inputs});
    modeIds.set(source.id,modeSources.get(key).id);
  }
  for(const row of cases)row.factSourceEntries=[...new Set([...row.factSourceEntries,...row.factSourceEntries.flatMap(id=>modeIds.has(id)?[modeIds.get(id)]:[])])];
  sources.push(...modeSources.values());
  return {modules:[...emitted.modules,...groups.modules,...attached.modules,groupModes,container,source,catalog.get(liveSource.entry),catalog.get(publicModes.entry),catalog.get(completeRequests.entry),catalog.get(attributeHistory.entry),attributeIdentity,catalog.get('metadata.public-form-attribute-modes'),reservationContract],cases,factSources:sources};
}
