import { sourceContract } from './source-contract.mjs';
import { propertyContract,propertyContractSignature } from './property-contract.mjs';
import { execFileSync } from 'node:child_process';
import { ownerContracts } from './owner-contracts.mjs';
import { i8nContracts } from './i8n-contracts.mjs';
import { readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { yaml,dependencyFiles } from './candidate-catalog.mjs';
import { writeCandidates } from './candidate-output.mjs';
import { loadSources } from './source-snapshot.mjs';
import { literalTables,booleanExpectations,literalFixture } from './test-cases.mjs';
const manifest=JSON.parse(readFileSync('tests/migration/rules-candidates/manifest.json','utf8'));
loadSources(manifest.sourceHashes);
for (const [name,contents] of Object.entries(manifest.generatedFiles)) if(readFileSync(`tests/migration/rules-candidates/${name}`,'utf8') !== contents) throw new Error(`Modified candidate: ${name}`);
for (const item of manifest.declarationHashes) if(createHash('sha256').update(readFileSync(item.path)).digest('hex') !== item.sha256) throw new Error(`Stale declaration: ${item.path}`);
const catalog=new Map(Object.values(manifest.generatedFiles).map(text=>{const m=yaml.load(text);return [m.id,m];}));
const sources=[],cases=[],selected=[],pendingRows=[],derivedProjections=[];
const derivedTexts=new Map();
function source(path) {const text=readFileSync(path,'utf8');sources.push({path,sha256:createHash('sha256').update(text).digest('hex')});return text;}
const rootSnapshot=JSON.parse(source('tests/migration/metadata-root-index-inventory.json'));
function select(owner,field,container) {
 const e=manifest.entries.find(e=>e.symbol===owner);
 const p=e?.projections.find(p=>p.fields.includes(field));
 if(!p)throw new Error(`Missing projection ${owner}.${field}`);
 if(p.fields.length===1 && !container) {selected.push(catalog.get(p.id));return p.id;}
 const derived=propertyContract(p,field,catalog,container);
 selected.push(derived.module);catalog.set(derived.module.id,derived.module);derivedTexts.set(derived.module.id,yaml.dump(derived.module));derivedProjections.push(derived.source);return derived.module.id;
}
const requiredLanguage=select('MetadataLanguageRules','languageCode');
const [languageFixture]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Languages/Русский.xml',yaml:'e2e/fixtures/nkdk/cf/Язык/Русский.yaml',fields:[{xml:'LanguageCode',yaml:'КодЯзыка'}]}]),encoding:'utf8'}));
source('packages/rules/metadata/appliedObjects/metadataLanguage/rules.ts');
cases.push({id:'required-language-code',entry:requiredLanguage,...languageFixture,rejectedYAML:['{}'],contract:'Immutable e2e language code and required property from rules.ts; absence in YAML must be diagnosed'});
cases.push({id:'required-language-code-missing-xml',entry:requiredLanguage,xml:'<Properties/>',annotation:'LanguageCode: !xml/raw',source:languageFixture.source,adaptation:'Remove the required field in memory to check the approved inferred anomaly contract; source fixtures are unchanged'});
const buttonFixturePath='e2e/fixtures/xml/cf/FilterCriteria/КритерийОтбораВсеСвойства/Forms/ФормаСписка/Ext/Form.xml';
const buttonYAMLPath='e2e/fixtures/nkdk/cf/КритерийОтбора/КритерийОтбораВсеСвойства/Формы/ФормаСписка/Форма.yaml';
const [requiredButtonXML]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{xml:buttonFixturePath,propertySelector:'.//{http://v8.1c.ru/8.3/xcf/logform}Button[@name="Команда1"]/{http://v8.1c.ru/8.3/xcf/logform}Type',root:'Type'}]),encoding:'utf8'}));
if(!source(buttonYAMLPath).includes('ТипКнопки: ОбычнаяКнопка'))throw new Error('Changed independent button kind');
cases.push({id:'required-button-kind',entry:select('ButtonRules','type'),...requiredButtonXML,yaml:'Вид: ОбычнаяКнопка',rejectedYAML:['{}'],source:[...requiredButtonXML.source,{path:buttonYAMLPath}],adaptation:'Isolated property uses the rules.ts key Вид; the form owner exposes the same enum as ТипКнопки. Owner key disambiguation is not tested by this projection.'});
const bool=select('PredefinedExtDimensionTypeRules','turnover');
const string=select('AdditionalIndexItemRules','table');
const number=select('ButtonRules','width');
const enumeration=select('ButtonRules','representation');
const text=select('InputFieldRules','title');
const formatted=select('ExtendedTooltipRules','title');
const synonym=select('MetadataCommonTemplateRules','synonym');
const sharedProfiles=[];
for(const symbol of ['MetadataDocumentRules','MetadataDocumentJournalRules']) {
 const entry=manifest.entries.find(entry=>entry.symbol===symbol);
 const projection=entry.projections.find(projection=>projection.fields.includes('synonym'));
 const derived=propertyContract(projection,'synonym',catalog);
 const signature=propertyContractSignature(derived.module);
 if(signature!==propertyContractSignature(catalog.get(synonym)))throw new Error(`Synonym profile changed: ${symbol}; review its independent expectations`);
 sharedProfiles.push({source:derived.source,coveredBy:synonym,signatureSHA256:createHash('sha256').update(signature).digest('hex'),scope:'Isolated property contract and required inputs; owner composition remains separate'});
}
const base='packages/rules/metadata/commonObjects/';
const purposesEntry=select('MetadataConfigurationRules','usePurposes');
const purposeSources=['rust/crates/compiled-rules/tests/sequences.rs',base+'usePurposes/toYAML.test.ts'];
for(const path of purposeSources)source(path);
for(const [id,values,expected,entry=purposesEntry] of [
 ['default',['PlatformApplication'],''],
 ['mobile',['MobilePlatformApplication'],'НазначенияИспользования: МобильноеПриложение'],
 ['both',['PlatformApplication','MobilePlatformApplication'],'НазначенияИспользования: ПлатформаИМобильноеПриложение'],
 ['order',['MobilePlatformApplication','PlatformApplication'],'НазначенияИспользования:\n  - MobilePlatformApplication\n  - PlatformApplication'],
 ['repeat',['PlatformApplication','PlatformApplication'],'НазначенияИспользования:\n  - PlatformApplication\n  - PlatformApplication'],
 ['unknown',['Future'],'НазначенияИспользования: !xml/invalid\n  - Future'],
 ['without-default',['PlatformApplication'],'НазначенияИспользования:\n  - PlatformApplication',select('MetadataCommonFormRules','usePurposes')],
])cases.push({id:`purposes-${id}`,entry,xml:'<Properties xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:app="http://v8.1c.ru/8.2/managed-application/core"><UsePurposes>'+values.map(value=>`<v8:Value xsi:type="app:ApplicationUsePurpose">${value}</v8:Value>`).join('')+'</UsePurposes></Properties>',yaml:expected,source:purposeSources.map(path=>({path})),contract:'Existing approved collection matrix and actual owner presence profile: exact shortcuts, order, repeats and inferred unknown-value annotation; without a declared default the platform list retains its meaning explicitly'});
const dateEntry=select('GroupItemFieldRules','periodAdditionBegin');
const dateSource=base+'dateTime/toYAML.test.ts';
const dateOriginal=source(dateSource);
source('rust/declarations/probes/date-time-default.yaml');
for(const [id,value,expected] of [
 ['midnight','1990-12-01T00:00:00','01.12.1990'],
 ['time','1990-12-01T08:30:00','01.12.1990 08:30'],
 ['default','0001-01-01T00:00:00',null],
]) {
 if(expected && (!dateOriginal.includes(value) || !dateOriginal.includes(expected)))throw new Error('Changed independent date expectations');
 cases.push({id:`calendar-${id}`,entry:dateEntry,xml:`<dcsset:periodAdditionBegin xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:dateTime">${value}</dcsset:periodAdditionBegin>`,yaml:expected?`НачалоПериода: ${expected}`:'',source:[{path:dateSource},{path:'rust/declarations/probes/date-time-default.yaml'}],contract:'Original date expectations and accepted canonical date default, applied to the actual typed namespaced property'});
}
const boundedEntry=select('MetadataExchangePlanRules','descriptionLength');
const boundSources=[base+'number/toJSONSchema.test.ts','packages/rules/metadata/appliedObjects/metadataExchangePlan/rules.ts'];
for(const path of boundSources)source(path);
for(const [value,invalid] of [[0,true],[1,false],[1.5,false],[25,false],[250,false],[251,true]])cases.push({id:`number-bound-${value}`,entry:boundedEntry,xml:`<Properties><DescriptionLength>${value}</DescriptionLength></Properties>`,yaml:value===25?'':`ДлинаНаименования: ${invalid?'!xml/invalid ':''}${value}`,source:boundSources.map(path=>({path})),contract:'Legacy number schema permits 1..250 inclusive, including fractions; the original owner default is 25. Out-of-range data retains its exact value under the agreed inferred invalid annotation'});
const choiceEntry=select('ClientApplicationFormRules','reportResult');
const choicePath=base+'stringOrNumber/fromXML.test.ts';
const choiceTable=literalTables(choicePath,source(choicePath)).tables[0];
if(choiceTable.rows[2]?.[1]!=='42' || choiceTable.rows[3]?.[1]!==42 || !choiceTable.rows[3]?.[0].includes('xs:decimal'))throw new Error('Changed independent string-or-number literals');
for(const [index,typed] of [[2,false],[3,true]]) {
 const [original,value]=choiceTable.rows[index];
 const xml=original.replaceAll('Value','ReportResult').replace('<ReportResult','<ReportResult xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"');
 const expected=typed?'РезультатОтчета: !xml/raw\n'+yaml.dump({'$значение':value,'$xml':{'_{http://www.w3.org/2001/XMLSchema-instance}type':'{http://www.w3.org/2001/XMLSchema}decimal','#text':'42'}}).trimEnd().split('\n').map(line=>'  '+line).join('\n'):yaml.dump({'РезультатОтчета':value}).trimEnd();
 cases.push({id:`string-or-number-${typed?'number':'text'}`,entry:choiceEntry,xml,yaml:expected,source:[choiceTable.source],contract:'Independent legacy literal preserves text versus number; the existing scalar-choice raw contract retains the noncanonical numeric XML type'});
}
const formTagProjection=manifest.entries.find(row=>row.symbol==='ClientApplicationFormRules')?.projections.find(row=>row.fields.includes('autoTitle'));
if(formTagProjection?.sourceTag!=='Form')throw new Error('Form property lost its XML source tag');
const formTagYAML='e2e/fixtures/nkdk/cf/КритерийОтбора/КритерийОтбораВсеСвойства/Формы/ФормаСписка/Форма.yaml';
const formTagExpected=source(formTagYAML).split('\n').find(line=>line.startsWith('АвтоЗаголовок:'));
if(!formTagExpected)throw new Error('Missing independent tagged form expectation');
const [formTagXML]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/FilterCriteria/КритерийОтбораВсеСвойства/Forms/ФормаСписка/Ext/Form.xml',propertySelector:'./{http://v8.1c.ru/8.3/xcf/logform}AutoTitle',root:'AutoTitle'}]),encoding:'utf8'}));
cases.push({id:'form-file-auto-title',entry:select('ClientApplicationFormRules','autoTitle'),xml:formTagXML.xml,yaml:formTagExpected,sourceTag:formTagProjection.sourceTag,source:[...formTagXML.source,{path:formTagYAML}],adaptation:'Select AutoTitle from the Form-tagged XML source and remove its root namespace for the relative property projection'});
const settingsNamespace='http://v8.1c.ru/8.1/data-composition-system/settings';
const viewModes=[...new Set([...source(formTagYAML).matchAll(/^\s*РежимОтображения: (.+)$/gm)].map(match=>match[1]))];
if(viewModes.length!==1)throw new Error('Ambiguous independent view mode expectation');
const [qualifiedXML]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{xml:formTagXML.source[0].path,propertySelector:`.//{http://v8.1c.ru/8.3/xcf/logform}Attribute[@name='Список']//{${settingsNamespace}}filter/{${settingsNamespace}}viewMode`,root:`{${settingsNamespace}}viewMode`}]),encoding:'utf8'}));
const qualifiedEntry=select('FilterRules','viewMode');
for(const alternatePrefix of [false,true])cases.push({id:`qualified-view-mode-${alternatePrefix?'alias':'original'}`,entry:qualifiedEntry,xml:alternatePrefix?qualifiedXML.xml.replaceAll('dcsset:','setting:').replaceAll('xmlns:dcsset=','xmlns:setting='):qualifiedXML.xml,yaml:`РежимОтображения: ${viewModes[0]}`,source:[...qualifiedXML.source,{path:formTagYAML}],adaptation:'Select the settings filter viewMode from the original form; all existing view-mode YAML values agree; an alternate XML prefix retains the same namespace URI'});
const formSource=sourceContract(manifest.entries.find(row=>row.symbol==='ClientApplicationFormRules'),'Form',catalog,'Form');
for(const module of formSource.modules) {catalog.set(module.id,module);derivedTexts.set(module.id,yaml.dump(module));}
selected.push(catalog.get(formSource.entry));derivedProjections.push(formSource.source);
if(formSource.fields.some(field=>field.xmlPath.length!==2))throw new Error('Form source contract needs direct child paths');
const metadataSource=sourceContract(manifest.entries.find(row=>row.symbol==='ClientApplicationFormRules'),'Metadata',catalog);
for(const module of metadataSource.modules) {catalog.set(module.id,module);derivedTexts.set(module.id,yaml.dump(module));}
selected.push(catalog.get(metadataSource.entry));derivedProjections.push(metadataSource.source);
if(metadataSource.fields.some(field=>field.xmlPath.length!==3 || field.xmlPath[0]!=='Form' || field.xmlPath[1]!=='Properties'))throw new Error('Unexpected metadata source property path');
for(const [id,xml,yamlPath] of [
 ['form-source-properties',formTagXML.source[0].path,formTagYAML],
 ['document-form-source','e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства/Forms/ФормаДокументаВсеСвойства/Ext/Form.xml','e2e/fixtures/nkdk/cf/Документ/ДокументВсеСвойства/Формы/ФормаДокументаВсеСвойства/Форма.yaml'],
 ['journal-form-source','e2e/fixtures/xml/cf/DocumentJournals/ЖурналДокументовВсеСвойства/Forms/ФормаСписка/Ext/Form.xml','e2e/fixtures/nkdk/cf/ЖурналДокументов/ЖурналДокументовВсеСвойства/Формы/ФормаСписка/Форма.yaml'],
 ['catalog-form-source','e2e/fixtures/xml/cf/Catalogs/СправочникКомандныйИнтерфейс/Forms/ФормаЭлемента/Ext/Form.xml','e2e/fixtures/nkdk/cf/Справочник/СправочникКомандныйИнтерфейс/Формы/ФормаЭлемента/Форма.yaml'],
]) {
 const formSourceOwner=rootSnapshot.forms.find(row=>row.source===xml.replace('/Ext/Form.xml','.xml'));
 if(!formSourceOwner || createHash('sha256').update(source(formSourceOwner.source)).digest('hex')!==formSourceOwner.sha256)throw new Error('Missing or stale form owner');
 const [data]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{xml,yaml:yamlPath,sourceRoot:true,root:'Form',namespace:'http://v8.1c.ru/8.3/xcf/logform',fields:formSource.fields.map(field=>({xml:field.xmlPath[1],yaml:field.yaml}))}]),encoding:'utf8'}));
 cases.push({id,entry:formSource.entry,...data,source:[...data.source,{path:formSourceOwner.source,sha256:formSourceOwner.sha256}],sourceTag:'Form',inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en'],ownerName:formSourceOwner.name},adaptation:'Combine supported properties of the Form XML source in declaration order; full source remainder is explicitly omitted'});
 const [metadata]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{xml:formSourceOwner.source,yaml:yamlPath,fields:metadataSource.fields.map(field=>({xml:field.xmlPath[2],yaml:field.yaml}))}]),encoding:'utf8'}));
 const metadataInputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],ownerName:formSourceOwner.name};
 cases.push({id:id+'-metadata',entry:metadataSource.entry,...metadata,xml:`<Form>${metadata.xml}</Form>`,xmlQNamePaths:metadata.xmlQNamePaths.map(path=>['Form',...path]),sourceTag:'Metadata',inputs:Object.fromEntries(Object.entries(metadataInputs).filter(([name])=>catalog.get(metadataSource.entry).inputs?.[name])),adaptation:'Select the independent Metadata source Properties and retain the declared Form wrapper; bind the same language and owner-name context as its source object; do not mix fields from Ext/Form.xml'});
}
const implicitSource='packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts';
source(implicitSource);
for(const [owner,field,xmlName,key,defaultYAML] of [['TableRules','autoInsertNewRow','AutoInsertNewRow','АвтоВводНовойСтроки',true],['InputFieldRules','autoCellHeight','AutoCellHeight','АвтоВысотаЯчейки',false]]) {
 const entry=select(owner,field,'Element');
 for(const value of [false,true])cases.push({id:`implicit-${field}-${value}`,entry,xml:value?`<Element><${xmlName}>true</${xmlName}></Element>`:'<Element/>',yaml:value===defaultYAML?'':`${key}: ${value?'Истина':'Ложь'}`,source:[{path:implicitSource}],contract:'Missing XML restores its own declared value; missing YAML restores the independent YAML default. Relative property path bound to an Element wrapper'});
}
const bp=base+'boolean/fromXML.test.ts',yp=base+'boolean/toYAML.test.ts';
const bt=booleanExpectations(bp,source(bp)),yt=booleanExpectations(yp,source(yp));
for(const row of bt.filter(r=>typeof r.input==='string')) {
 const out=yt.find(r=>r.input===row.expected);if(!out)throw new Error('Missing boolean expectation');
 cases.push({id:`boolean-${row.input}`,entry:bool,source:[row.source,out.source],xml:`<Turnover>${row.input}</Turnover>`,yaml:row.expected?`Оборотный: ${out.expected}`:'',adaptation:'Property name and declared default omission'});
}
for(const [family,entry,root,key] of [['string',string,'Table','Таблица'],['number',number,'Width','Ширина']]) {
 const path=base+family+'/atomicConversion.test.ts', tables=literalTables(path,source(path));
 const rows=tables.tables[0].rows;
 for(const [index,[xml,value]] of rows.entries()) {
  if((typeof value!=='string'&&typeof value!=='number')||xml.includes('xsi:')) {pendingRows.push({path,table:0,row:index,reason:'Empty, typed or unresolved legacy scalar contract'});continue;}
  cases.push({id:`${family}-${index}`,entry,source:[tables.tables[0].source],xml:xml.replaceAll('Value',root),yaml:yaml.dump({[key]:value}).trimEnd(),adaptation:'Property XML/YAML names only'});
 }
}
const enumPath='packages/rules/metadata/systemEnumerations/atomicConversion.test.ts';
const enumSource=source(enumPath);
if(createHash('sha256').update(enumSource).digest('hex') !== 'fc366eedc2f4bb90d81aec5c2c96997e80f0321899a43f0a8368886432e03175') throw new Error('Reviewed enum test changed; re-extract its independent contract');
cases.push({id:'enumeration-text',entry:enumeration,source:[{path:enumPath}],xml:'<Representation>Text</Representation>',yaml:'Отображение: Текст',adaptation:'Reviewed literal Text ↔ Текст assertion; property names only'});
const ip=base+'i8nText/__fixtures__/legacy/data.ts';
const fixture=literalFixture(ip,source(ip),'i8nTextFixtures');
for(const [index,row] of fixture.data.entries()) {
 if(typeof row.xml!=='string'||!row.xml.includes('<v8:lang>ru</v8:lang>')) {pendingRows.push({path:ip,fixture:'i8nTextFixtures',row:index,reason:'Absence or missing default language needs approved semantic comparison'});continue;}
 cases.push({id:`i8n-${index}`,entry:text,source:[fixture.source],xml:row.xml.replace('<Title>','<Title xmlns:v8="http://v8.1c.ru/8.1/data/core">'),yaml:yaml.dump({'Заголовок':row.fullYAML}).trimEnd(),inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en','de'],ownerName:'НесовпадающееИмя'},adaptation:'Explicit namespace from legacy context; fullYAML literal expectation'});
}
for(const value of ['9007199254740993','9007199254740993.125'])cases.push({id:`exact-${value}`,entry:number,xml:`<Width>${value}</Width>`,yaml:`Ширина: ${value}`,source:[{path:'rust/crates/compiled-rules/tests/scalars.rs'}],contract:'Approved exact decimals; intentionally differs from TS binary floating point'});
for(const value of ['', '0',' true '])cases.push({id:`boolean-anomaly-${JSON.stringify(value)}`,entry:bool,xml:`<Turnover>${value}</Turnover>`,yaml:'Turnover: !xml/raw\n'+yaml.dump({'$xml':value}).trimEnd().split('\n').map(line=>'  '+line).join('\n'),...(value===''?{reverseYAML:'Turnover: !xml/raw\n  $xml: {}'}:{}),source:[{path:'rust/crates/conversion-core/tests/raw_property.rs'},{path:'rust/crates/conversion-core/src/xml/tree/patch.rs'}],contract:'Approved inferred anomaly without semantic value uses physical XML key; existing raw_property contract with full literal payload expectation; independent reverse and cold XML restoration'});
source('rust/crates/conversion-core/tests/raw_property.rs');
source('rust/crates/conversion-core/src/xml/tree/patch.rs');
source('rust/crates/compiled-rules/tests/scalars.rs');
cases.push(...i8nContracts(JSON.parse(source('tests/migration/i8n-full-round-trip-observations.json')),text));
cases.push(...i8nContracts(JSON.parse(source('tests/migration/i8n-full-round-trip-observations.json')),synonym,2));
cases.push({id:'i8n-absent-with-known-name',entry:synonym,xml:'<Properties/>',yaml:'Синоним: !xml/raw\n  $значение: {}\n  $xml: null',inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en'],ownerName:'TestName'},source:[{path:'rust/declarations/common/i8n-text.yaml'}],contract:'Empty mapping denotes absent meaning; raw null removes the declared default empty XML element; omitted YAML derives the known name'});
const formattedPath=base+'formattedI8nText/__fixtures__/data.ts';
const formattedFixture=literalFixture(formattedPath,source(formattedPath),'formattedI8nTextFixtures');
const formattedSeen=new Set();
for(const [index,row] of formattedFixture.data.entries()) {
 if(typeof row.xml!=='string') {pendingRows.push({path:formattedPath,fixture:'formattedI8nTextFixtures',row:index,reason:'No standalone XML fixture'});continue;}
 const identity=JSON.stringify([row.xml,row.valueYAML]);if(formattedSeen.has(identity))continue;formattedSeen.add(identity);
 cases.push({id:`formatted-${index}`,entry:formatted,source:[formattedFixture.source],xml:row.xml.replace('<Title ', '<Title xmlns:v8="http://v8.1c.ru/8.1/data/core" '),yaml:yaml.dump({'Заголовок':row.valueYAML}).trimEnd(),inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en','de'],ownerName:'НесовпадающееИмя'},adaptation:'Literal valueYAML expectation and XML fixture; property YAML name and explicit inherited namespace only; identical fixture pairs consolidated'});
}
const formattedOrdinary=formattedFixture.data.find(row=>row.text?.formatted===false && typeof row.valueYAML?.Текст==='string' && typeof row.xml==='string');
if(!formattedOrdinary)throw new Error('Missing independent formatted attribute fixture');
cases.push({id:'formatted-missing-attribute',entry:formatted,source:[formattedFixture.source,{path:'rust/crates/rule-compiler/tests/generate_collection.rs'}],xml:formattedOrdinary.xml.replace(' formatted="false"','').replace('<Title>','<Title xmlns:v8="http://v8.1c.ru/8.1/data/core">'),yaml:'Заголовок: !xml/raw\n'+yaml.dump({'$значение':formattedOrdinary.valueYAML,'$xml':{'_formatted':null}}).trimEnd().split('\n').map(line=>'  '+line).join('\n'),inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en','de'],ownerName:'НесовпадающееИмя'},contract:'Existing generated collection regression: missing formatted attribute preserves meaning and records attribute deletion'});
source('rust/crates/rule-compiler/tests/generate_collection.rs');
const indexTest='packages/rules/metadata/commonObjects/additionalIndex/fromXMLToYAML.integration.test.ts';
const indexExpected=literalFixture(indexTest,source(indexTest),'expected').data[0];
const indexFixture='packages/rules/metadata/commonObjects/additionalIndex/__fixtures__/full.xml';
source(indexFixture);
for(const [field,xmlName,key] of [['indexedFields','IndexedFields','ИндексируемыеПоля'],['additionalFields','AdditionalFields','ДополнительныеПоля']]) {
 const entry=select('AdditionalIndexItemRules',field);
 const [xml]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{xml:indexFixture,propertySelector:'.//{http://v8.1c.ru/8.3/xcf/extrnprops}'+xmlName,root:xmlName}]),encoding:'utf8'}));
 cases.push({id:`index-${field}`,entry,...xml,yaml:yaml.dump({[key]:indexExpected[key]}).trimEnd(),contract:'Original full.xml subtree and literal integration-test expectation; property wrapper namespace is supplied by the future owner'});
}
const owners=ownerContracts(manifest,catalog,rootSnapshot);
const httpDefault=owners.cases.find(row=>row.id==='e2e-properties-МетодПоУмолчанию');
if(!httpDefault?.yaml.split('\n').includes('HTTPМетод: GET'))throw new Error('Changed independent HTTP method default expectation');
httpDefault.reverseYAML=httpDefault.yaml.split('\n').filter(line=>line!=='HTTPМетод: GET').join('\n');
httpDefault.adaptation+='; independently omit the HTTP method in reverse input: XML restores GET while forward YAML retains an explicit GET';
selected.push(...owners.modules);
cases.push(...owners.cases);
const stringAttribute=owners.cases.find(row=>row.id==='e2e-properties-СтроковыйРеквизит');
const fixedTypeSource='packages/rules/metadata/commonObjects/fillValue/effectiveType.test.ts';
if(!stringAttribute?.xml.includes('<v8:AllowedLength>Variable</v8:AllowedLength>') ||
   !stringAttribute.yaml.includes('Тип: Строка(10)') ||
   !source(fixedTypeSource).includes('allowedLength: "Fixed"'))throw new Error('Changed independent fixed-string source');
cases.push({...stringAttribute,
  id:'fill-value-fixed-string',
  xml:stringAttribute.xml.replace('<v8:AllowedLength>Variable</v8:AllowedLength>','<v8:AllowedLength>Fixed</v8:AllowedLength>'),
  yaml:stringAttribute.yaml.replace('Тип: Строка(10)','Тип: ФиксированнаяСтрока(10)'),
  rejectedYAML:[
    'Тип: Строка(abc)',
    'Тип: Строка(0)',
    'Тип: Строка(10, 2)',
    'Тип: ФиксированнаяСтрока(0)',
    'Тип: Число(abc)',
    'Тип: Число(0)',
    'Тип: ПоложительноеЧисло(10, abc)',
  ],
  source:[...stringAttribute.source,{path:fixedTypeSource}],
  adaptation:'Use immutable e2e string attribute with the Fixed qualifier established by the existing FillValue type test; reverse export uses freshly prepared inputs without an XML reference',
});
const formEntry=select('MetadataDocumentJournalRules','defaultForm');
const formOwner=owners.cases.find(row=>row.id==='e2e-properties-ЖурналДокументовВсеСвойства');
const formInputs=Object.fromEntries(Object.keys(catalog.get(formEntry).inputs??{}).filter(key=>key!=='roots').map(key=>[key,formOwner.inputs[key]]));
const configurationYAML='e2e/fixtures/nkdk/cf/Конфигурация.yaml';
const commonExpected=source(configurationYAML).split('\n').find(line=>line.startsWith('ОсновнаяФормаОтчета:'));
if(!commonExpected)throw new Error('Missing independent common-form expectation');
const [commonXML]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Configuration.xml',propertySelector:'.//{http://v8.1c.ru/8.3/MDClasses}DefaultReportForm',root:'DefaultForm'}]),encoding:'utf8'}));
cases.push({id:'form-common-target',entry:formEntry,xml:`<Properties>${commonXML.xml}</Properties>`,yaml:commonExpected.replace('ОсновнаяФормаОтчета:','ОсновнаяФорма:'),inputs:formInputs,factBindings:{roots:'metadata.roots'},source:[...commonXML.source,{path:configurationYAML}],adaptation:'Existing Configuration common-form reference and YAML expectation; only property names and wrapper adapted to the candidate'});
const foreign=`Document.Other.Form.${formInputs.forms[0]}`;
cases.push({id:'form-foreign-owner',entry:formEntry,xml:`<Properties><DefaultForm>${foreign}</DefaultForm></Properties>`,yaml:`DefaultForm: !xml/raw\n  $xml: ${foreign}`,inputs:formInputs,factBindings:{roots:'metadata.roots'},contract:'The omitted owner slot differs from its restored default: no shortened semantic value is valid; preserve the complete source property as established by text-pattern defaults'});
for(const [id,xml,yaml] of [['missing','<Properties/>','DefaultForm: !xml/raw\n  $xml: null'],['empty','<Properties><DefaultForm/></Properties>','']])cases.push({id:`form-${id}`,entry:formEntry,xml,yaml,inputs:formInputs,factBindings:{roots:'metadata.roots'},contract:'Declared default empty XML and missing source are distinct; generic preservation restores source absence'});
const numerator=select('MetadataDocumentRules','numerator');
const documentLinks=select('MetadataDocumentJournalRules','registeredDocuments');
const journalYAML='e2e/fixtures/nkdk/cf/ЖурналДокументов/ЖурналДокументовВсеСвойства/Свойства.yaml';
const journalBlock=source(journalYAML).match(/^РегистрируемыеДокументы:\n((?:  - [^\n]+\n)+)/m)?.[1];
if(!journalBlock)throw new Error('Missing independent journal document list');
const journalNames=journalBlock.trimEnd().split('\n').map(line=>line.slice(4));
if(journalNames.length!==2)throw new Error('Journal permutation requires two independent fixture values');
const repeatedNames=[journalNames[1],journalNames[0],journalNames[1]];
const typedLinksXML=(property,paths)=>`<Properties xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><${property}>${paths.map(path=>`<xr:Item xsi:type="xr:MDObjectRef">${path}</xr:Item>`).join('')}</${property}></Properties>`;
cases.push({id:'journal-document-order-and-repeats',entry:documentLinks,xml:typedLinksXML('RegisteredDocuments',repeatedNames.map(name=>`Document.${name}`)),yaml:'РегистрируемыеДокументы:\n'+repeatedNames.map(name=>`  - ${name}`).join('\n'),factBindings:{roots:'metadata.roots'},source:[{path:journalYAML}],contract:'Reordering and repeating independently known e2e targets must preserve sequence occurrences'});
const externalTarget=rootSnapshot.basedOnMetadata.find(row=>row.path.startsWith('ExternalDataSource.'));
if(!externalTarget || createHash('sha256').update(source(externalTarget.source)).digest('hex')!==externalTarget.sha256)throw new Error('Missing or stale external table link');
const externalYAML='e2e/fixtures/nkdk/cf/Справочник/СправочникПолный/Свойства.yaml';
const externalExpected=source(externalYAML).split('\n').find(line=>line.startsWith('  - ВнешнийИсточникДанных.'));
if(!externalExpected)throw new Error('Missing independent external table YAML');
cases.push({id:'based-on-external-table',entry:select('MetadataDocumentRules','basedOn'),xml:typedLinksXML('BasedOn',[externalTarget.path]),yaml:'ВводитсяНаОсновании:\n'+externalExpected,factBindings:{roots:'metadata.roots',children:'metadata.children'},source:[{path:externalTarget.source},{path:externalYAML}],contract:'Existing e2e link and independent YAML bind the common declaration to a root identity followed by a child-table lookup'});
const numeratorYAML='e2e/fixtures/nkdk/cf/Документ/ДокументСНумератором/Свойства.yaml';
const numeratorExpected=source(numeratorYAML).split('\n').find(line=>line.startsWith('Нумератор:'));
if(!numeratorExpected)throw new Error('Missing independent numerator expectation');
const [numeratorXML]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Documents/ДокументСНумератором.xml',propertySelector:'.//{http://v8.1c.ru/8.3/MDClasses}Numerator',root:'Numerator'}]),encoding:'utf8'}));
cases.push({id:'numerator-existing',entry:numerator,xml:`<Properties>${numeratorXML.xml}</Properties>`,yaml:numeratorExpected,factBindings:{roots:'metadata.roots'},source:[...numeratorXML.source,{path:numeratorYAML}],contract:'Existing e2e numerator reference with an independently prepared metadata index'});
cases.push({id:'numerator-missing-target',entry:numerator,xml:'<Properties><Numerator>DocumentNumerator.Missing</Numerator></Properties>',yaml:'Нумератор: !xml/invalid Missing',factBindings:{roots:'metadata.roots'},contract:'A well-formed reference to an absent numerator is a semantic anomaly'});
const group=select('MetadataCommonCommandRules','group');
cases.push({id:'group-typed-wrapper',entry:group,xml:'<Properties xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"><Group xsi:type="xr:MDObjectRef">NavigationPanelImportant</Group></Properties>',yaml:'Группа: !xml/raw\n'+yaml.dump({'$значение':'ПанельНавигацииВажное','$xml':{'_{http://www.w3.org/2001/XMLSchema-instance}type':'{http://v8.1c.ru/8.3/xcf/readable}MDObjectRef','#text':'NavigationPanelImportant'}}).trimEnd().split('\n').map(line=>'  '+line).join('\n'),factBindings:{roots:'metadata.roots'},contract:'Exceptional typed wrapper uses the existing raw subtree contract; ordinary spelling comes from e2e CommonCommand'});
cases.push({id:'group-missing-target',entry:group,xml:'<Properties><Group>CommandGroup.Missing</Group></Properties>',yaml:'Группа: !xml/invalid ГруппаКоманд.Missing',factBindings:{roots:'metadata.roots'},source:[{path:'rust/crates/compiled-rules/tests/path_lexicons.rs'}],contract:'Existing absent-target constraint becomes a semantic anomaly; no special object handler'});
source('rust/crates/compiled-rules/tests/path_lexicons.rs');
const groupObservations=JSON.parse(source('tests/migration/command-group-e2e.json'));
for(const row of groupObservations.rows)if(createHash('sha256').update(readFileSync(row.source)).digest('hex')!==row.sha256)throw new Error(`Stale command Group observation: ${row.source}`);
const factSources=[];
const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(const [collection,kinds,fields] of [
 ['roots',['CommandGroup','CommonForm','DocumentNumerator','Document','ChartOfAccounts','ExternalDataSource','ExchangePlan','Catalog','ChartOfCharacteristicTypes','BusinessProcess','ChartOfCalculationTypes','Task'],['kind','name','identity']],
 ['children',['Table'],['kind','name','parent','identity']],
]) {
 const providerText=source(`rust/declarations/probes/metadata-${collection==='roots'?'root':'child'}-index.yaml`),provider=yaml.load(providerText);
 catalog.set(provider.id,provider);derivedTexts.set(provider.id,providerText);selected.push(provider);
 for(const row of rootSnapshot[collection].filter(row=>kinds.includes(row.kind))) {
  if(createHash('sha256').update(readFileSync(row.source)).digest('hex')!==row.sha256)throw new Error(`Changed indexed fixture: ${row.source}`);
  sources.push({path:row.source,sha256:row.sha256});
  factSources.push({entry:provider.id,xml:'<Root>'+fields.map(field=>{const tag=field[0].toUpperCase()+field.slice(1);return `<${tag}>${escape(row[field])}</${tag}>`;}).join('')+'</Root>',source:row.source});
 }
}
const modules=[...selected,...dependencyFiles(selected,catalog)];
const files=Object.fromEntries(modules.map(m=>[m.id+'.yaml',derivedTexts.get(m.id)??manifest.generatedFiles[m.id+'.yaml']]));
writeCandidates('tests/migration/rules-contract-catalog',files,{status:'test-only',derivedProjections,entries:selected.map(m=>m.id)});
const result={version:1,status:'limited-profile; original tests retained',derivedProjections,sharedProfiles,factSources,sources,cases,pendingRows,pending:['Dynamic test helpers and unselected tables','I8nText profiles absent from one-property candidates; complete-owner integration','Typed scalar XML and old invalid-input exceptions','Date timezone, invalid and empty-state contracts need candidate coverage','Full owners and other collection families; e2e integration'],xmlEquality:'Namespace-aware structure; no source XML reference passed to reverse operation'};
writeFileSync('tests/migration/rules-contract-cases.json',JSON.stringify(result,null,2)+'\n');
console.log(`${cases.length} independent cases; ${modules.length} declarations`);
