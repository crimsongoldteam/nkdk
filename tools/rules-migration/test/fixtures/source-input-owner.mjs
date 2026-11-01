import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {candidateCatalog,yaml} from '../../src/candidate-catalog.mjs';
import {inputByStringOperation} from '../../src/input-by-string-operation.mjs';
import {assembleRecordStateOwner} from '../../src/source-record-owner.mjs';
import {bindPreparedOwnerIndexes} from '../../src/owner-index-requirements.mjs';
import {baseReferenceSource} from '../../src/owner-base-state.mjs';
import {selectContracts} from '../../src/focused-catalog.mjs';
import {ownerStateSections} from '../../src/owner-state-sections.mjs';
import {numericOwnerFragment} from '../../src/numeric-owner-fragment.mjs';
import {sourceOwnerXmlRoute} from '../../src/owner-root-source.mjs';

// Integration only: reuse independent, accepted InputByString expectations and
// source fixtures. The production adapter, not this test, assembles the owner.
const {catalog}=candidateCatalog();
const original=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries
 .find(row=>row.symbol==='MetadataCatalogRules');
const source={...original,properties:original.properties.filter(row=>[
 'xmlRoot','inputByString','codeLength','descriptionLength','codeType',
 'codeAllowedLength','hierarchical','hierarchyType','extendedConfigurationObject','objectModule','managerModule',
].includes(row.name))};
const assembly=assembleRecordStateOwner(source,catalog,{id:'test.source-input-owner'});
const owner=bindPreparedOwnerIndexes(assembly.owner,assembly.indexRequirements);
const base=baseReferenceSource(assembly.state.module,owner.id+'.base-source');
const matrix=inputByStringOperation(catalog);
export const declarations=[...matrix.modules,...assembly.modules.filter(row=>row!==assembly.owner),owner,base];
export const factSources=[...matrix.factSources];
export const cases=['e2e-input-by-string-catalog-cf','e2e-input-by-string-catalog-adopted-cfe'].map(id=>{
 const accepted=matrix.cases.find(row=>row.id===id);
 const fixture=`e2e/fixtures/xml/${accepted.inputs.adopted?'cfe/all-extension':'cf'}/Catalogs/СправочникПолный.xml`;
 const full=readFileSync(fixture,'utf8');
 const [projection]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  encoding:'utf8',input:JSON.stringify([{xml:fixture,ownerFields:{
   propertyStates:accepted.inputs.adopted?['CodeLength','DescriptionLength','CodeType']:[],
   properties:['CodeLength','DescriptionLength','CodeType','CodeAllowedLength','InputByString','Hierarchical','HierarchyType',
    ...(accepted.inputs.adopted?['ExtendedConfigurationObject']:[])].map(xml=>({xml,optional:['InputByString','Hierarchical','HierarchyType'].includes(xml)})),
  }}]),
 }));
 const xml=projection.xml.replace('<ns0:MetaDataObject ','<ns0:MetaDataObject version="2.20" ');
 const expected=yaml.load(accepted.yaml);
 // Canonical order follows the checked source owner; values come from the
 // existing accepted case and the independent fixture's allowed length.
 const ordered={};
 for(const key of ['ВводПоСтроке','ДлинаКода','ДлинаНаименования'])if(Object.hasOwn(expected,key))ordered[key]=expected[key];
 if(accepted.inputs.adopted)ordered.ДопустимаяДлинаКода='Переменная';
 if(!accepted.inputs.adopted) {
  const reference=readFileSync('e2e/fixtures/nkdk/cf/Справочник/СправочникПолный/Свойства.yaml','utf8').match(/^Иерархический: (.+)$/m)?.[1];
  if(reference!=='Истина')throw new Error('Changed independent hierarchy expectation');
  ordered.Иерархический=reference;
 }
 if(Object.hasOwn(expected,'ТипКода'))ordered.ТипКода=expected.ТипКода;
 const baseId=owner.id+'.base-'+accepted.inputs.component;
 factSources.push({id:baseId,entry:base.id,xml:full,
  inputs:{component:accepted.inputs.component,owner:accepted.inputs.owner}});
 return {...accepted,id:'source-owner-'+id,entry:owner.id,xml,
  yaml:yaml.dump(ordered,{noRefs:true}),reverseYAML:undefined,
  inputs:Object.fromEntries(Object.entries(accepted.inputs).map(([key,value])=>['state_'+key,value])),
  factBindings:assembly.indexRequirements.bindings,
  factSourceEntries:[...accepted.factSourceEntries,baseId],noRaw:true};
});

// Absence is a separate view operation: it must not try to unwrap a missing
// stateful scalar. Read only the base relation from the same immutable XML.
const adopted=cases.find(row=>row.inputs.state_adopted);
const [missing]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
 encoding:'utf8',input:JSON.stringify([{xml:'e2e/fixtures/xml/cfe/all-extension/Catalogs/СправочникПолный.xml',
  ownerFields:{propertyStates:['CodeLength','DescriptionLength','CodeType'],
   properties:[{xml:'ExtendedConfigurationObject'}]}}]),
}));
cases.push({...adopted,id:'source-owner-input-dependencies-absent',
 xml:missing.xml.replace('<ns0:MetaDataObject ','<ns0:MetaDataObject version="2.20" '),yaml:''});

// One in-memory state variation checks the new attachment and neighboring rows;
// immutable XML fixtures and their ordinary-value expectations stay unchanged.
const notifiedRow='<s:PropertyState xmlns:s="http://v8.1c.ru/8.3/xcf/readable"><s:Property>CodeAllowedLength</s:Property><s:State>Notify</s:State></s:PropertyState>';
const withHistory=(xml,row)=>{
 if(xml.match(/<((?:\w+:)?InternalInfo)\s*(\/)?>/)?.[2])
  return xml.replace(/<((?:\w+:)?InternalInfo)\s*\/>/,'<$1>'+row+'</$1>');
 if(!/<\/(?:\w+:)?InternalInfo>/.test(xml))throw new Error('Missing fixture history');
 return xml.replace(/(<\/(?:\w+:)?InternalInfo>)/,row+'$1');
};
const statesId=adopted.factSourceEntries.find(id=>id.endsWith('-states'));
const states=factSources.find(row=>row.id===statesId);
if(!states)throw new Error('Missing independent state fact source');
factSources.push({...states,id:statesId+'-notice',xml:withHistory(states.xml,notifiedRow)});
cases.push({...adopted,id:'source-owner-scalar-notify',xml:withHistory(adopted.xml,notifiedRow),
 yaml:adopted.yaml.replace('ДопустимаяДлинаКода: Переменная','ДопустимаяДлинаКода: !проверять'),
 factSourceEntries:adopted.factSourceEntries.map(id=>id===statesId?statesId+'-notice':id)});

const moduleRows=['ObjectModule','ManagerModule'].map(name=>
 '<s:PropertyState xmlns:s="http://v8.1c.ru/8.3/xcf/readable"><s:Property>'+name+'</s:Property><s:State>Extended</s:State></s:PropertyState>').join('');
cases.push({...adopted,id:'source-owner-module-sections',xml:withHistory(adopted.xml,moduleRows),
 yaml:adopted.yaml.replace('ТипКода:', 'Изменять:\n  - МодульОбъекта\n  - МодульМенеджера\nТипКода:'),
 rejectedYAML:[adopted.yaml+'Изменять: [МодульОбъекта, МодульОбъекта]\n',adopted.yaml+'Изменять: [ЧужойМодуль]\n']});
const repeatedModules=['ManagerModule','ObjectModule','ManagerModule'];
const repeatedRows=repeatedModules.map(name=>
 '<s:PropertyState xmlns:s="http://v8.1c.ru/8.3/xcf/readable"><s:Property>'+name+'</s:Property><s:State>Extended</s:State></s:PropertyState>').join('');
cases.push({...adopted,id:'source-owner-module-section-history',xml:withHistory(adopted.xml,repeatedRows),
 yaml:adopted.yaml.replace('ТипКода:',
 'Изменять:\n  - МодульОбъекта\n  - МодульМенеджера\nСостояния:\n'+
 repeatedModules.map(name=>'  - Property: '+name+'\n    State: Extended\n').join('')+'ТипКода:')});

// A real child command proves the same registration-driven section contract.
// Its external callback path is a separate owner-attachment obligation.
function sectionFixture({symbol,id,xml,xmlItems,propertyStates,ownerName}) {
 const registered=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries.find(row=>row.symbol===symbol);
 const route=sourceOwnerXmlRoute(registered);
 const history=numericOwnerFragment(id,route,[],catalog,[],registered);
 delete history.inputs.states;delete history.inputs.baseNumbers;delete history.inputs.owner;
 delete history.imports.number;
 const section=ownerStateSections(history,registered,catalog);
 section.module.kind='object';
 section.module.inputs.ownerName={type:{kind:'scalar',scalar:'text'}};
 section.module.value.fields.push({name:'name',type:{kind:'scalar',scalar:'text'}});
 section.module.representations.xml.fields.push({field:'name',path:[...route,'md:Properties','md:Name']});
 section.module.presence.push({target:{field:'name'},yaml:{missing:{denotes:{input:'ownerName'}}}});
 declarations.push(section.module,...section.declarations);
 const [projection]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  encoding:'utf8',input:JSON.stringify([{xml,xmlItems,ownerFields:{propertyStates,properties:[{xml:'Name'}]}}]),
 }));
 if(projection.ownerPath!==route.at(-1).slice(3)+'.'+ownerName)throw new Error('Changed independent section owner identity');
 return {entry:id,xml:projection.xml,inputs:{adopted:true,compatibilityMode:'Version8_3_27',ownerName},
  noRaw:true,factSourceEntries:[]};
}
const commandCase=sectionFixture({symbol:'MetadataCommandRules',id:'test.command-section-history',
 xml:'e2e/fixtures/xml/cfe/all-extension/Catalogs/СправочникПолный.xml',
 xmlItems:[{type:'Command',name:'ПолнаяКоманда'}],propertyStates:['CommandModule'],ownerName:'ПолнаяКоманда'});
const commandYAML=readFileSync('e2e/fixtures/nkdk/cfe/Расширение_All/Справочник/СправочникПолный/Свойства.yaml','utf8')
 .match(/^Команды:\n([\s\S]*?)(?=^\S|(?![\s\S]))/m)?.[1]
 ?.match(/^  ПолнаяКоманда:\n([\s\S]*?)(?=^  \S|(?![\s\S]))/m)?.[1];
const commandExpected=commandYAML?.match(/^    Изменять:\n((?:      - .+\n)+)/m)?.[1]
 .trim().split('\n').map(line=>line.trim().slice(2));
if(JSON.stringify(commandExpected)!==JSON.stringify(['МодульКоманды']))throw new Error('Changed independent command section expectation');
cases.push({...commandCase,id:'source-owner-e2e-command-section',yaml:yaml.dump({Изменять:commandExpected},{noRefs:true})});
const packageCase=sectionFixture({symbol:'MetadataXDTOPackageRules',id:'test.package-section-history',
 xml:'e2e/fixtures/xml/cfe/all-extension/XDTOPackages/ПакетXDTOВсеСвойства.xml',
 propertyStates:['Package'],ownerName:'ПакетXDTOВсеСвойства'});
const packageExpected=readFileSync('e2e/fixtures/nkdk/cfe/Расширение_All/ПакетXDTO/ПакетXDTOВсеСвойства/Свойства.yaml','utf8')
 .match(/^Изменять:\n([\s\S]*)$/m)?.[0];
if(packageExpected?.trim()!=='Изменять:\n  - Пакет')throw new Error('Changed independent package section expectation');
cases.push({...packageCase,id:'source-owner-e2e-package-section',yaml:packageExpected,
 rejectedYAML:['Изменять: [Пакет]\nПроверять: [Пакет]\n','Изменять: !xml/invalid\n  - Пакет\n']});
cases.push({...packageCase,id:'source-owner-package-section-notify',
 xml:packageCase.xml.replace(/(<(?:\w+:)?State>)Extended/, '$1Notify'),yaml:'Проверять:\n  - Пакет\n'});
const conflictRow='<s:PropertyState xmlns:s="http://v8.1c.ru/8.3/xcf/readable"><s:Property>Package</s:Property><s:State>Notify</s:State></s:PropertyState>';
cases.push({...packageCase,id:'source-owner-package-section-conflict',xml:withHistory(packageCase.xml,conflictRow),
 noRaw:false,yaml:'Изменять: !xml/invalid\n  - Пакет\nПроверять:\n  - Пакет\n'});

// The same compiled predicates must work for arbitrary declared rows, without
// metadata names, state modes, resources, or private converter branches.
const rowId='test.virtual-label',listId='test.virtual-labels',genericId='test.virtual-label-owner';
declarations.push({format:owner.format,kind:'value',id:rowId,
 value:{kind:'record',fields:[{name:'label',type:{kind:'scalar',scalar:'text'}}]},
 representations:{xml:{kind:'record',fields:[{field:'label',path:['Label']}]},yaml:{kind:'projection',field:'label'}}},
 {format:owner.format,kind:'value',id:listId,imports:{row:rowId},
 value:{kind:'sequence',item:{use:'row'}},representations:{xml:{kind:'element-sequence',path:['Item']},yaml:{kind:'sequence'}}},
 {format:owner.format,kind:'object',id:genericId,imports:{labels:listId},
 value:{kind:'record',fields:[{name:'marker',type:{kind:'scalar',scalar:'text'}},{name:'labels',type:{use:'labels'}}]},
 representations:{xml:{kind:'record',fields:[{field:'marker',path:['Root','Marker']}]},
 yaml:{kind:'mapping',fields:[{field:'marker',key:'Marker'},{field:'labels',key:'Labels'}]}},
 presence:[{target:{field:'labels'},xml:{missing:{denotes:{sequence:[{record:{label:{literal:'alpha'}}},{record:{label:{literal:'beta'}}}]}}},
 yaml:{missing:{denotes:{sequence:[]}}}}],
 constraints:[{id:'unique-known-labels',appliesTo:['yaml-validation'],
 assert:{each:{in:{field:'labels'},as:'labelRow',where:{and:[
 {or:['alpha','beta'].map(name=>({eq:[{get:{of:{var:'labelRow'},field:'label'}},{literal:name}]}))},
 {one:{in:{field:'labels'},as:'otherRow',where:{eq:[{get:{of:{var:'otherRow'},field:'label'}},{get:{of:{var:'labelRow'},field:'label'}}]}}}]} }},
 diagnostic:{code:'labels.invalid',severity:'error',at:{field:'labels'},message:'Unknown or repeated label'}}]});
cases.push({id:'source-owner-virtual-label-predicates',entry:genericId,xml:'<Root><Marker>ok</Marker></Root>',
 yaml:'Marker: ok\nLabels:\n  - alpha\n  - beta\n',noRaw:true,factSourceEntries:[],
 rejectedYAML:['Marker: ok\nLabels: [alpha, alpha]\n','Marker: ok\nLabels: [unknown]\n',
 'Marker: ok\nLabels: !xml/invalid [alpha, beta]\n']});

// Keep the shared runner small: only these selected cases and their fact readers,
// rather than every independent InputByString scenario and its generators.
const local=new Map([...catalog,...declarations.map(row=>[row.id,row])]);
const selected=selectContracts({cases,factSources},local,cases.map(row=>row.id));
declarations.splice(0,declarations.length,...selected.modules);
factSources.splice(0,factSources.length,...selected.manifest.factSources);
