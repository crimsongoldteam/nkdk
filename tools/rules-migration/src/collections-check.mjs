import {enumValueCases} from './enum-value-cases.mjs';
import {internalInfoCases} from './internal-info-cases.mjs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fixture,xml,yaml as expected} from '../test/fixtures/array-collection.mjs';
import {declarations as unifiedDeclarations,cases as unifiedCases} from '../test/fixtures/unified-record.mjs';
import {emitCollections} from './collection-emission.mjs';
import {candidateCatalog,dependencyFiles,yaml} from './candidate-catalog.mjs';
import {writeFocused} from './focused-output.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
process.chdir(root);
const {graph,entries}=fixture(),{catalog}=candidateCatalog();
const enumValues=enumValueCases(catalog);
const internalInfo=internalInfoCases(catalog);
const emitted=emitCollections(graph,entries,catalog);
if(emitted.results[0].status!=='candidate')throw new Error(JSON.stringify(emitted.results));
const indexedEntries=structuredClone(entries);
indexedEntries.find(entry=>entry.symbol==='ItemRules').properties.push({name:'numerator',status:'static-parameters',parameters:{type:'MetadataItemLink',xml:'Numerator',xmlParents:['Properties'],yaml:'Нумератор',metadataTarget:{kind:'object',roots:['DocumentNumerator']}}});
const indexed=emitCollections(graph,indexedEntries,catalog);
if(indexed.results[0].status!=='candidate')throw new Error(JSON.stringify(indexed.results));
const computedFacts=structuredClone(emitted.modules[2]);
computedFacts.id='test.collection.computed-facts';
computedFacts.contributions=[{index:'test.computed',forEach:{in:{field:'items'},as:'row'},key:{concat:[{literal:'Нум'},{get:{of:{var:'row'},field:'name'}}]},value:{get:{of:{var:'row'},field:'name'}}}];
const computedConsumer={format:'nkdk-declarations/1',kind:'object',id:'test.collection.computed-consumer',inputs:{derived:{index:'test.computed'}},value:{kind:'record',fields:[{name:'name',type:{kind:'scalar',scalar:'text'}}]},representations:{xml:{kind:'record',fields:[{field:'name',path:['Root','Name']}]},yaml:{kind:'mapping',fields:[{field:'name',key:'Name'}]}},constraints:[{id:'derived-exists',appliesTo:['xml-import','yaml-validation'],assert:{present:{lookup:{in:{input:'derived'},key:{field:'name'}}}},diagnostic:{code:'test.derived-missing',severity:'error',at:{field:'name'},message:'Missing computed name'}}]};
// The dependent source intentionally precedes its producers in the manifest.
const chainedSource=structuredClone(computedConsumer);
chainedSource.id='test.collection.chained-source';
chainedSource.contributions=[{index:'test.chained',key:{field:'name'},value:{match:{value:{lookup:{in:{input:'derived'},key:{field:'name'}}},present:{as:'found',then:{var:'found'}},absent:{literal:''}}}}];
const chainedConsumer=structuredClone(computedConsumer);
chainedConsumer.id='test.collection.chained-consumer';
chainedConsumer.inputs.derived={index:'test.chained'};
chainedConsumer.constraints[0].assert={match:{value:{lookup:{in:{input:'derived'},key:{field:'name'}}},present:{as:'found',then:{eq:[{var:'found'},{literal:'Первый'}]}},absent:{literal:false}}};
const namedGraph=structuredClone(graph);
namedGraph.edges[0].mapping.yamlAsArray=false;
namedGraph.edges[0].mapping.keyField='name';
namedGraph.registrations[0].parameters.yamlAsArray=false;
namedGraph.registrations[0].parameters.keyField='name';
const named=emitCollections(namedGraph,entries,catalog);
if(named.results[0].status!=='candidate')throw new Error(JSON.stringify(named.results));
const textEntries=structuredClone(entries);
textEntries.find(entry=>entry.symbol==='ItemRules').properties.unshift({name:'synonym',status:'static-parameters',parameters:{type:'I8nText',xml:'Synonym',xmlParents:['Properties'],yaml:'Синоним',excludeIfEqualNameYAML:true}});
const textCollections=[graph,namedGraph].map(source=>emitCollections(source,textEntries,catalog));
const implicitEntries=structuredClone(textEntries),implicitGraph=structuredClone(namedGraph);
const implicitName=implicitEntries.find(entry=>entry.symbol==='ItemRules').properties.find(property=>property.name==='name');
implicitName.name='code';delete implicitName.parameters.yaml;
implicitGraph.edges[0].mapping.keyField='code';implicitGraph.registrations[0].parameters.keyField='code';
textCollections.push(emitCollections(implicitGraph,implicitEntries,catalog));
for(const result of textCollections)if(result.results[0].status!=='candidate')throw new Error(JSON.stringify(result.results));
const textXML='<Root xmlns:v8="http://v8.1c.ru/8.1/data/core"><Items><Item><Properties><Synonym><v8:item><v8:lang>ru</v8:lang><v8:content>Первый</v8:content></v8:item></Synonym><Name>Первый</Name><Enabled>true</Enabled></Properties></Item><Item><Properties><Synonym><v8:item><v8:lang>ru</v8:lang><v8:content>Второй</v8:content></v8:item></Synonym><Name>Второй</Name><Enabled>false</Enabled></Properties></Item></Items></Root>';
named.modules[0].constraints=[{id:'key-policy',appliesTo:['xml-import','yaml-validation'],assert:{not:{eq:[{field:'name'},{literal:'forbidden'}]}},diagnostic:{code:'test.key-policy',severity:'error',at:{field:'name'},message:'Reserved key'}}];
const identified=structuredClone(textCollections[1].modules);
identified.forEach((module,index)=>{module.id=`test.identified-text.${index}`;module.inputs.identities={type:{kind:'index',key:{kind:'scalar',scalar:'text'},value:{kind:'scalar',scalar:'text'}}};});
identified[0].value.fields.push({name:'token',type:{kind:'scalar',scalar:'text'}});
identified[0].representations.xml.fields.push({field:'token',path:[],attribute:'token'});
(identified[0].presence??=[]).push({target:{field:'token'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{lookup:{in:{input:'identities'},key:{field:'name'}}}}}});
identified[1].imports.item=identified[0].id;identified[1].value.item.bind.identities={input:'identities'};
identified[2].imports.items=identified[1].id;identified[2].value.fields[0].type.bind.identities={input:'identities'};
identified[2].inputs.identities={index:'test.identified-text'};
identified[2].contributions=[{index:'test.identified-text',forEach:{in:{field:'items'},as:'row'},key:{get:{of:{var:'row'},field:'name'}},value:{get:{of:{var:'row'},field:'token'}}}];
let token=0;const identifiedXML=textXML.replaceAll('<Item>',()=>`<Item token="identity-${++token}">`);
const identifiedInputs={defaultLanguage:'ru',registeredLanguages:['ru','en']};
const uuidEntries=structuredClone(textEntries);
uuidEntries.find(entry=>entry.symbol==='ItemRules').properties.push({name:'uuid',status:'static-parameters',parameters:{type:'uuid',xml:'_uuid',xmlParents:[],xmlOnly:true}});
const automaticIdentity=emitCollections(namedGraph,uuidEntries,catalog);
if(automaticIdentity.results[0].status!=='candidate')throw new Error(JSON.stringify(automaticIdentity.results));
const automaticIdentityEntry=automaticIdentity.results[0].declaration;
const automaticIdentityXML=identifiedXML.replaceAll(' token=',' uuid=');
const automaticIdentityInputs={...identifiedInputs,component:'cf',owner:'parent-uuid'};

const nested={format:'nkdk-declarations/1',kind:'value',id:'test.collection.nested',presence:[{target:'self',xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}}],value:{kind:'record',fields:[{name:'text',type:{kind:'scalar',scalar:'text'}}]},representations:{xml:{kind:'record',fields:[{field:'text',path:['Text']}]},yaml:{kind:'mapping',fields:[{field:'text',key:'Текст'}]}}};
const composed=structuredClone(named.modules);
composed[0].id='test.collection.composed.item';
composed[0].imports.nested=nested.id;
composed[0].value.fields.push({name:'nested',type:{use:'nested'}});
composed[0].representations.xml.fields.push({field:'nested',path:['Properties','Nested']});
composed[0].representations.yaml.fields.push({field:'nested',key:'Вложенное'});
composed[1].id='test.collection.composed.list';composed[1].imports.item=composed[0].id;
composed[2].id='test.collection.composed.property';composed[2].imports.items=composed[1].id;
const grouped=structuredClone(composed);
grouped[0].id='test.collection.grouped.item';
grouped[0].value.fields.find(field=>field.name==='name').type={kind:'scalar',scalar:'text'};
grouped[0].value.fields.unshift({name:'token',type:{kind:'scalar',scalar:'text'}});
grouped[0].representations.xml.fields.unshift({field:'token',path:['Properties'],attribute:'token'});
grouped[0].representations.yaml.fields.unshift({field:'token',key:'Token'});
grouped[0].presence=[{target:{field:'token'},xml:{missing:{denotes:{absent:true}}},yaml:{default:{field:'name'}}}];
grouped[1].id='test.collection.grouped.list';grouped[1].imports.item=grouped[0].id;
grouped[2].id='test.collection.grouped.property';grouped[2].imports.items=grouped[1].id;
const groupedCommon=structuredClone(grouped);
groupedCommon[0].id='test.collection.grouped-common.item';
groupedCommon[0].value.fields.find(field=>field.name==='name').type=structuredClone(named.modules[0].value.fields.find(field=>field.name==='name').type);
groupedCommon[1].id='test.collection.grouped-common.list';groupedCommon[1].imports.item=groupedCommon[0].id;
groupedCommon[2].id='test.collection.grouped-common.property';groupedCommon[2].imports.items=groupedCommon[1].id;
const xmlOnly=structuredClone(groupedCommon);
xmlOnly[0].id='test.collection.xml-only.item';
xmlOnly[0].representations.yaml.fields=xmlOnly[0].representations.yaml.fields.filter(field=>field.field!=='token');
xmlOnly[1].id='test.collection.xml-only.list';xmlOnly[1].imports.item=xmlOnly[0].id;
xmlOnly[2].id='test.collection.xml-only.property';xmlOnly[2].imports.items=xmlOnly[1].id;
const xmlOnlyScalar=structuredClone(xmlOnly[0]);
xmlOnlyScalar.id='test.xml-only.scalar';xmlOnlyScalar.kind='object';
xmlOnlyScalar.value.fields=xmlOnlyScalar.value.fields.filter(field=>field.name!=='nested');
xmlOnlyScalar.representations.xml.fields=xmlOnlyScalar.representations.xml.fields.filter(field=>field.field!=='nested').map(field=>({...field,path:['Root',...field.path]}));
xmlOnlyScalar.representations.yaml.fields=xmlOnlyScalar.representations.yaml.fields.filter(field=>field.field!=='nested');
xmlOnlyScalar.constraints.push({id:'hidden-policy',appliesTo:['yaml-validation'],assert:{not:{eq:[{field:'token'},{literal:'blocked-token'}]}},diagnostic:{code:'test.hidden-policy',severity:'error',at:{field:'token'},message:'Restored token is reserved'}});
const declarations=[...internalInfo.modules,...enumValues.modules,...unifiedDeclarations,xmlOnlyScalar,...xmlOnly,...groupedCommon,...grouped,...emitted.modules,...named.modules,...composed,nested,...indexed.modules,...textCollections.flatMap(result=>result.modules),...identified,...automaticIdentity.modules,computedFacts,computedConsumer,chainedSource,chainedConsumer,catalog.get('migration.metadata-root-index')];
const modules=[...declarations,...dependencyFiles(declarations,catalog)];
const files=Object.fromEntries(modules.map(m=>[m.id+'.yaml',yaml.dump(m,{noRefs:true})]));
const entry=emitted.results[0].declaration;
const paths=writeFocused(join(root,'rust/target/collection-emission-check'),files,{factSources:[...internalInfo.factSources,...enumValues.factSources,{entry:automaticIdentityEntry,xml:automaticIdentityXML,inputs:automaticIdentityInputs},{entry:chainedSource.id,yaml:"Name: НумПервый"},{entry:identified[2].id,xml:identifiedXML,inputs:identifiedInputs},{entry:'migration.metadata-root-index',xml:'<Root><Kind>DocumentNumerator</Kind><Name>Общий</Name><Identity>shared</Identity></Root>'},{entry:computedFacts.id,xml:'<Root><Items><Item><Properties><Name>Первый</Name><Enabled>true</Enabled></Properties></Item></Items></Root>'},{entry:computedFacts.id,yaml:'Элементы: [{Имя: Второй, Включено: Ложь}]'}],cases:[...internalInfo.cases,...enumValues.cases,
  {id:'generated-dependent-index',entry:chainedConsumer.id,factBindings:{derived:'test.chained'},xml:'<Root><Name>НумПервый</Name></Root>',yaml:'Name: НумПервый',rejectedYAML:['Name: НумВторой']},
  {id:'automatically-generated-uuid',entry:automaticIdentityEntry,inputs:automaticIdentityInputs,factBindings:{identities:'metadata.own-identities'},xml:automaticIdentityXML,yaml:'Элементы:\n  Первый:\n    Включено: Истина\n  Второй:\n    Включено: Ложь'},
  {id:'generated-identity-and-synonym',entry:identified[2].id,inputs:identifiedInputs,factBindings:{identities:'test.identified-text'},xml:identifiedXML,yaml:'Элементы:\n  Первый:\n    Включено: Истина\n  Второй:\n    Включено: Ложь'},
  ...['Первый','Второй'].map((name,index)=>({id:`generated-computed-index-${index}`,entry:computedConsumer.id,factBindings:{derived:'test.computed'},xml:`<Root><Name>Нум${name}</Name></Root>`,yaml:`Name: Нум${name}`,rejectedYAML:['Name: Первый','Name: НумОтсутствует']})),
  ...textCollections.map((result,index)=>({id:`generated-local-name-${index}`,entry:result.results[0].declaration,inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},xml:textXML,yaml:index===0?expected:'Элементы:\n  Первый:\n    Включено: Истина\n  Второй:\n    Включено: Ложь'})),
  {id:'generated-shared-index',entry:indexed.results[0].declaration,factBindings:{roots:'metadata.roots'},xml:xml.replaceAll('</Properties>','<Numerator>DocumentNumerator.Общий</Numerator></Properties>'),yaml:'Элементы:\n  - Имя: Первый\n    Включено: Истина\n    Нумератор: Общий\n  - Имя: Второй\n    Включено: Ложь\n    Нумератор: Общий',rejectedYAML:['Элементы: [{Имя: Первый, Включено: Истина, Нумератор: Отсутствует}]']},
  ...unifiedCases,
  {id:'xml-only-scalar-normal',entry:xmlOnlyScalar.id,xml:'<Root><Properties token="Первый"><Name>Первый</Name><Enabled>true</Enabled></Properties></Root>',yaml:'Имя: Первый\nВключено: Истина',rejectedYAML:['Имя: Первый\nВключено: Истина\nToken: other','Имя: Первый\nВключено: Истина\ntoken: other','Имя: blocked-token\nВключено: Истина']},
  {id:'xml-only-scalar-mismatch',entry:xmlOnlyScalar.id,xml:'<Root><Properties token="other"><Name>Первый</Name><Enabled>true</Enabled></Properties></Root>',annotation:'token: !xml/raw'},
  {id:'xml-only-scalar-absent',entry:xmlOnlyScalar.id,xml:'<Root><Properties><Name>Первый</Name><Enabled>true</Enabled></Properties></Root>',annotation:'token: !xml/raw'},
  {id:'xml-only-grouped-normal',entry:xmlOnly[2].id,xml:xml.replace('<Properties>','<Properties token="Первый">').replace('<Properties>','<Properties token="Второй">').replaceAll('</Enabled>','</Enabled><Nested><Text>Данные</Text></Nested>'),yaml:'Элементы:\n  Первый:\n    Включено: Истина\n    Вложенное:\n      Текст: Данные\n  Второй:\n    Включено: Ложь\n    Вложенное:\n      Текст: Данные'},
  {id:'xml-only-grouped-mismatch',entry:xmlOnly[2].id,xml:xml.replaceAll('<Properties>','<Properties token="other">').replaceAll('</Enabled>','</Enabled><Nested><Text>Данные</Text></Nested>'),annotation:'    token: !xml/raw'},
  {id:'xml-only-grouped-absent',entry:xmlOnly[2].id,xml:xml.replaceAll('</Enabled>','</Enabled><Nested><Text>Данные</Text></Nested>'),annotation:'    token: !xml/raw'},
  {id:'named-grouped-missing-attribute',entry:grouped[2].id,xml:xml.replaceAll('</Enabled>','</Enabled><Nested><Text>Данные</Text></Nested>'),annotation:'    token: !xml/raw'},
  {id:'named-grouped-invalid-key',entry:grouped[2].id,xml:xml.replace('Первый','forbidden').replaceAll('</Enabled>','</Enabled><Nested><Text>Данные</Text></Nested>'),annotation:'Элементы: !xml/raw'},
  ...[grouped,groupedCommon].map((modules,index)=>({id:`named-grouped-key-${index}`,entry:modules[2].id,xml:xml.replace('<Properties>','<Properties token="Первый">').replace('<Properties>','<Properties token="other">').replaceAll('</Enabled>','</Enabled><Nested><Text>Данные</Text></Nested>'),yaml:'Элементы:\n  Первый:\n    Включено: Истина\n    Вложенное:\n      Текст: Данные\n  Второй:\n    Token: other\n    Включено: Ложь\n    Вложенное:\n      Текст: Данные'})),
  {id:'named-composed-preservation',entry:composed[2].id,xml:xml.replaceAll('</Enabled>','</Enabled><Nested extra="x"><Text>Данные</Text></Nested>'),annotation:'    Вложенное: !xml/raw',reverseYAML:'Элементы:\n  Первый:\n    Включено: Истина\n    Вложенное: !xml/raw\n      $значение:\n        Текст: Данные\n      $xml:\n        _extra: x\n  Второй:\n    Включено: Ложь\n    Вложенное: !xml/raw\n      $значение:\n        Текст: Данные\n      $xml:\n        _extra: x'},
  {id:'named-composed-one-anomaly',entry:composed[2].id,xml:xml.replaceAll('</Enabled>','</Enabled><Nested><Text>Данные</Text></Nested>').replace('<Nested>','<Nested extra="x">'),annotation:'    Вложенное: !xml/raw',retainedYAML:['    Вложенное:'],reverseYAML:'Элементы:\n  Первый:\n    Включено: Истина\n    Вложенное: !xml/raw\n      $значение:\n        Текст: Данные\n      $xml:\n        _extra: x\n  Второй:\n    Включено: Ложь\n    Вложенное:\n      Текст: Данные'},
  {id:'named-composed-invalid-key',entry:composed[2].id,xml:xml.replace('Первый','forbidden').replaceAll('</Enabled>','</Enabled><Nested><Text>Данные</Text></Nested>'),annotation:'Элементы: !xml/raw'},
  {id:'named-composed-records',entry:composed[2].id,xml:xml.replaceAll('</Enabled>','</Enabled><Nested><Text>Данные</Text></Nested>'),yaml:'Элементы:\n  Первый:\n    Включено: Истина\n    Вложенное:\n      Текст: Данные\n  Второй:\n    Включено: Ложь\n    Вложенное:\n      Текст: Данные'},
  {id:'generated-named-records',entry:named.results[0].declaration,xml,rejectedYAML:['Элементы: {forbidden: {Включено: Истина}}','Элементы: {Первый: {Имя: Второй, Включено: Истина}}','Элементы: {Первый: {}, Первый: {}}'],yaml:'Элементы:\n  Первый:\n    Включено: Истина\n  Второй:\n    Включено: Ложь'},
  {id:'generated-named-invalid-key',entry:named.results[0].declaration,xml:xml.replace('Первый','forbidden'),annotation:'Элементы: !xml/raw'},
  {id:'generated-named-missing-key',entry:named.results[0].declaration,xml:xml.replace(/<Name>[^<]+<\/Name>/g,''),annotation:'Элементы: !xml/raw'},
  {id:'generated-named-duplicate',entry:named.results[0].declaration,xml:xml.replace('Второй','Первый'),annotation:'Элементы: !xml/raw'},
  {id:'generated-named-invalid-field',entry:named.results[0].declaration,xml:xml.replace('<Enabled>true</Enabled>','<Enabled>broken</Enabled>'),annotation:'    Enabled: !xml/raw'},
  {id:'generated-empty-mapping',entry:named.results[0].declaration,xml:'<Root><Items/></Root>',yaml:'Элементы: {}'},
  {id:'generated-array-records',entry,xml,yaml:expected},
  {id:'generated-array-repeated-names',entry,xml:xml.replace('Второй','Первый'),yaml:expected.replace('Второй','Первый')},
  {id:'generated-empty-array',entry,xml:'<Root><Items/></Root>',yaml:'Элементы: []'},
]});
const result=spawnSync('cargo',['run','--offline','--locked','--manifest-path','../tools/rules-migration/runtime/Cargo.toml','--target-dir','target/migration-contracts','-j','1','--',paths.cases],{
 cwd:join(root,'rust'),stdio:'inherit',env:{...process.env,NKDK_MIGRATION_CATALOG:paths.catalog,CARGO_INCREMENTAL:'0',CARGO_PROFILE_DEV_DEBUG:'0',CARGO_PROFILE_TEST_DEBUG:'0'}});
if(result.error)throw result.error;
process.exitCode=result.status??1;
