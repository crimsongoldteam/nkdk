import { sourceContract } from './source-contract.mjs';
import { propertyContract,propertyContractSignature } from './property-contract.mjs';
import { execFileSync } from 'node:child_process';
import { ownerContracts } from './owner-contracts.mjs';
import { i8nContracts } from './i8n-contracts.mjs';
import { readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { yaml,dependencyFiles,candidateCatalog } from './candidate-catalog.mjs';
import { writeCandidates } from './candidate-output.mjs';
import { loadSources } from './source-snapshot.mjs';
import { literalTables,booleanExpectations,literalFixture } from './test-cases.mjs';
import {standardMemberPolicies,standardFillPolicyInputs,standardFillProfileExpressions} from './standard-fill-source.mjs';
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
for (const [property,xmlName] of [
 ['choiceParameterLinks','ChoiceParameterLinks'],
 ['choiceParameters','ChoiceParameters'],
]) {
 const entry=select('MetadataDocumentAttributeRules',property);
 cases.push({id:`document-attribute-${property}-empty`,entry,
   xml:`<Properties><${xmlName}/></Properties>`,yaml:'',
   source:[{path:'packages/rules/metadata/appliedObjects/metadataDocument/childRules.ts'}],
   contract:'A declared record collection uses its owner XML empty-element contract to denote absence; YAML export restores the element without a reference'});
}
for (const [property,xmlName] of [
 ['linkByType','LinkByType'],
 ['binaryDataStorageLocationUseField','BinaryDataStorageLocationUseField'],
]) {
 const entry=select('MetadataDocumentAttributeRules',property);
 const rawEmpty=property==='binaryDataStorageLocationUseField';
 cases.push({id:`document-attribute-${property}-empty`,entry,
   xml:`<Properties><${xmlName}/></Properties>`,
   yaml:rawEmpty?`${xmlName}: !xml/raw\n  $xml: ''`:'',
   source:[{path:'packages/rules/metadata/appliedObjects/metadataDocument/childRules.ts'}],
   contract:rawEmpty?'An empty source link differs from the owner default of omitted XML; generic raw preservation restores it':'A text-pattern reference can have defaults for its fields and a separate absence rule for the whole value'});
}
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
// Every ordinary FillValue owner uses the same common declaration. Keep the
// original e2e XML/YAML pairs as the independent source of expectations.
const baseCatalog=candidateCatalog().catalog;
const fillValueProfile=baseCatalog.get('common.fill-value-profile');
catalog.set(fillValueProfile.id,fillValueProfile);
selected.push(fillValueProfile);
const fillValueFamilies=[
 ['common-attribute','CommonAttributes/ОбщийРеквизитВсеСвойства.xml','ОбщийРеквизит/ОбщийРеквизитВсеСвойства.yaml',null,[]],
 ['task-attribute','Tasks/ЗадачаВсеСвойства.xml','Задача/ЗадачаВсеСвойства/Свойства.yaml',['Attribute','РеквизитВсеСвойства'],['Реквизиты','РеквизитВсеСвойства']],
 ['task-addressing','Tasks/ЗадачаВсеСвойства.xml','Задача/ЗадачаВсеСвойства/Свойства.yaml',['AddressingAttribute','РеквизитАдресацииВсеСвойства'],['РеквизитыАдресации','РеквизитАдресацииВсеСвойства']],
 ['register-attribute','InformationRegisters/РегистрСведенийВсеСвойстваНезависимый.xml','РегистрСведений/РегистрСведенийВсеСвойстваНезависимый/Свойства.yaml',['Attribute','РеквизитВсеСвойства'],['Реквизиты','РеквизитВсеСвойства']],
 ['register-dimension','InformationRegisters/РегистрСведенийВсеСвойстваНезависимый.xml','РегистрСведений/РегистрСведенийВсеСвойстваНезависимый/Свойства.yaml',['Dimension','ИзмерениеВсеСвойства'],['Измерения','ИзмерениеВсеСвойства']],
 ['register-resource','InformationRegisters/РегистрСведенийВсеСвойстваНезависимый.xml','РегистрСведений/РегистрСведенийВсеСвойстваНезависимый/Свойства.yaml',['Resource','РесурсВсеСвойства'],['Ресурсы','РесурсВсеСвойства']],
 ['accounting-flag','ChartsOfAccounts/ПланСчетовВсеСвойства.xml','ПланСчетов/ПланСчетовВсеСвойства/Свойства.yaml',['AccountingFlag','ПризнакУчетаВсеСвойства'],['ПризнакиУчета','ПризнакУчетаВсеСвойства']],
 ['ext-accounting-flag','ChartsOfAccounts/ПланСчетовВсеСвойства.xml','ПланСчетов/ПланСчетовВсеСвойства/Свойства.yaml',['ExtDimensionAccountingFlag','ПризнакУчетаСубконтоВсеСвойства'],['ПризнакиУчетаСубконто','ПризнакУчетаСубконтоВсеСвойства']],
 ['external-field','ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства.xml','ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойства/Таблицы/ТаблицаВсеСвойства/Свойства.yaml',['Field','ПолеВсеСвойства'],['Поля','ПолеВсеСвойства']],
 ['external-cube-dimension','ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml','ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойства/Кубы/КубВсеСвойства/Свойства.yaml',['Dimension','ИзмерениеВсеСвойства'],['Измерения','ИзмерениеВсеСвойства']],
];
const fillValueRequests=fillValueFamilies.map(([,xmlPath,yamlPath,item,yamlPathParts])=>({
 xml:`e2e/fixtures/xml/cf/${xmlPath}`,yaml:`e2e/fixtures/nkdk/cf/${yamlPath}`,
 ...(item?{xmlItems:[{type:item[0],name:item[1]}]}:{}),yamlPath:yamlPathParts,
 fields:[{xml:'Type',yaml:'Тип',qname:true},{xml:'FillValue',yaml:'ЗначениеЗаполнения'}],
}));
const fillValueFixtures=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify(fillValueRequests),encoding:'utf8'}));
for(const [index,fixture] of fillValueFixtures.entries()) {
 const [family]=fillValueFamilies[index];
 const expectedYAML=family==='external-field'
   ? 'Тип: ДвоичныеДанные\nЗначение: !xml/raw\n  $значение: \'\'\n  $xml:\n    _{http://www.w3.org/2001/XMLSchema-instance}type: \'{http://v8.1c.ru/8.1/data/core}Null\''
   : fixture.yaml.replace(/^ЗначениеЗаполнения:/m,'Значение:');
 cases.push({id:`fill-value-family-${family}`,entry:fillValueProfile.id,
   xml:fixture.xml.replace('<Properties','<Root').replace('</Properties>','</Root>').replaceAll('<FillValue','<Value').replaceAll('</FillValue>','</Value>'),
   yaml:expectedYAML,
   xmlQNamePaths:fixture.xmlQNamePaths.map(path=>['Root',...path.slice(1)]),
   source:fixture.source,inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},
   adaptation:'Preserve the original Type/FillValue pair and change only the outer wrapper and FillValue property names to the common profile; export without an XML reference'+(family==='external-field'?'; generic raw XML uses expanded namespace names and explicitly records the empty semantic value, unlike the existing lexical owner YAML':''),
 });
}
const standardFillProfile=baseCatalog.get('common.standard-attribute-fill-value');
catalog.set(standardFillProfile.id,standardFillProfile);
selected.push(standardFillProfile);
const standardFillWrapper={format:'nkdk-declarations/1',kind:'object',id:'contract.standard-attribute-fill-value',
 namespaces:{xr:'http://v8.1c.ru/8.3/xcf/readable'},imports:{fill:standardFillProfile.id},
 inputs:structuredClone(standardFillProfile.inputs),
 compose:[{use:'fill',bind:Object.fromEntries(Object.keys(standardFillProfile.inputs).map(name=>[name,{input:name}]))}],
 value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}},
};
catalog.set(standardFillWrapper.id,standardFillWrapper);
selected.push(standardFillWrapper);
const standardXMLPath='e2e/fixtures/xml/cf/Catalogs/СправочникПолный.xml';
const standardYAMLPath='e2e/fixtures/nkdk/cf/Справочник/СправочникПолный/Свойства.yaml';
const standardYAML=source(standardYAMLPath);
const standardPolicyPaths=[
 'packages/runtime/metadata/standardMembers/declarations.ts',
 'packages/rules/metadata/appliedObjects/metadataCatalog/standardMembers.ts',
];
const standardPolicySources=Object.fromEntries(standardPolicyPaths.map(path=>[path,source(path)]));
const standardPolicies=standardMemberPolicies(standardPolicySources,'Справочник');
const standardPolicyProvenance=standardPolicyPaths.map(path=>({path,sha256:createHash('sha256').update(standardPolicySources[path]).digest('hex')}));
const standardRootNames=baseCatalog.get('common.path-root')?.enum;
if(!standardRootNames)throw new Error('Missing declared metadata root vocabulary');
const mdNamespace='http://v8.1c.ru/8.3/MDClasses';
const xrNamespace='http://v8.1c.ru/8.3/xcf/readable';
const standardFactNames=['CodeType','CodeLength','CodeAllowedLength','DescriptionLength'];
let standardFacts;
for(const [internal,name,expected] of [
 ['Ref','Ссылка',null],
 ['Owner','Владелец','Справочник.СправочникВладелец.ПредопределенноеЗначение'],
 ['Parent','Родитель','Справочник.СправочникПолный.ПустаяСсылка'],
 ['Code','Код',null],
 ['DeletionMark','ПометкаУдаления',null],
 ['Description','Наименование',null],
]) {
 if(expected!==null && (!standardYAML.includes(`  ${name}:`) || !standardYAML.includes(`    ЗначениеЗаполнения: ${expected}`)))throw new Error(`Changed independent standard attribute ${name}`);
 const [fixture]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{
   xml:standardXMLPath,propertySelector:`.//{${xrNamespace}}StandardAttribute[@name='${internal}']/{${xrNamespace}}FillValue`,root:`{${xrNamespace}}FillValue`,
   context:[...standardFactNames.map(fact=>({name:fact[0].toLowerCase()+fact.slice(1),selector:`.//{${mdNamespace}}Properties/{${mdNamespace}}${fact}`})),
     {name:'owners',selector:`.//{${mdNamespace}}Properties/{${mdNamespace}}Owners/{${xrNamespace}}Item`,many:true}],
 }]),encoding:'utf8'}));
 if(standardFacts===undefined)standardFacts=fixture.context;
 else if(JSON.stringify(standardFacts)!==JSON.stringify(fixture.context))throw new Error('Changed standard owner facts between members');
 const member=standardPolicies.get(internal);
 if(!member)throw new Error(`Missing source standard member: ${internal}`);
 const policyInputs=standardFillPolicyInputs(member,fixture.context,standardRootNames);
 cases.push({id:`fill-value-standard-${internal.toLowerCase()}`,entry:standardFillWrapper.id,
   xml:`<xr:StandardAttribute xmlns:xr="${xrNamespace}">${fixture.xml}</xr:StandardAttribute>`,yaml:expected===null?'':`ЗначениеЗаполнения: ${expected}`,
   inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en'],componentKind:'configuration',...policyInputs},source:[...fixture.source,{path:standardYAMLPath},...standardPolicyProvenance],
   adaptation:'Select the immutable standard-attribute FillValue subtree and its independent owner YAML scalar; retain the xr namespace and test reverse export without a source XML reference',
 });
}
const documentPolicyPaths=[
 ...standardPolicyPaths.slice(0,1),
 'packages/runtime/rule-kit.ts',
 'packages/rules/metadata/standardMembers/declarations.ts',
 'packages/rules/metadata/appliedObjects/metadataDocument/standardMembers.ts',
];
const documentPolicySources=Object.fromEntries(documentPolicyPaths.map(path=>[path,source(path)]));
const documentPolicies=standardMemberPolicies(documentPolicySources,'Документ');
const documentPolicyProvenance=documentPolicyPaths.map(path=>({path,sha256:createHash('sha256').update(documentPolicySources[path]).digest('hex')}));
const documentStandardXMLPath='e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства.xml';
const documentStandardYAMLPath='e2e/fixtures/nkdk/cf/Документ/ДокументВсеСвойства/Свойства.yaml';
if(!source(documentStandardYAMLPath).includes('СтандартныеРеквизиты:\n  Дата:'))throw new Error('Changed independent document standard Date');
const [documentDateFixture]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{
 xml:documentStandardXMLPath,propertySelector:`.//{${xrNamespace}}StandardAttribute[@name='Date']/{${xrNamespace}}FillValue`,root:`{${xrNamespace}}FillValue`,
}]),encoding:'utf8'}));
const documentDateCase={id:'fill-value-standard-document-date',entry:standardFillWrapper.id,
 xml:`<xr:StandardAttribute xmlns:xr="${xrNamespace}">${documentDateFixture.xml}</xr:StandardAttribute>`,yaml:'',
 inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en'],componentKind:'configuration',
   ...standardFillPolicyInputs(documentPolicies.get('Date'),{},standardRootNames)},
 source:[...documentDateFixture.source,{path:documentStandardYAMLPath},...documentPolicyProvenance],
 adaptation:'Select the real document Date standard-attribute FillValue and derive its effective calendar policy from the document declaration',
};
cases.push(documentDateCase);
cases.push({...documentDateCase,id:'fill-value-standard-document-date-wrong-kind',
 xml:documentDateCase.xml.replace('xsi:nil="true" />','xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">Текст</xr:FillValue>'),
 yaml:'ЗначениеЗаполнения: Текст',diagnostics:['fill-value.type-mismatch'],
 adaptation:'The document declares a calendar Date; an observed string XML value must survive the round-trip with a type diagnostic',
});
const standardOwner=cases.find(row=>row.id==='fill-value-standard-owner');
const standardWithName={format:'nkdk-declarations/1',kind:'object',id:'contract.standard-attribute-with-name',
 namespaces:{xr:xrNamespace},imports:{fill:standardFillProfile.id,name:'common.standard-attribute-name'},
 inputs:structuredClone(standardFillProfile.inputs),
 compose:[{use:'fill',bind:Object.fromEntries(Object.keys(standardFillProfile.inputs).map(name=>[name,{input:name}]))}],
 value:{kind:'record',fields:[{name:'name',type:{use:'name'}}]},
 representations:{xml:{kind:'record',fields:[{field:'name',path:['xr:StandardAttribute'],attribute:'name'}]},
   yaml:{kind:'mapping',fields:[{field:'name',key:'Имя'}]}},
};
catalog.set(standardWithName.id,standardWithName);
selected.push(standardWithName);
cases.push({...standardOwner,id:'fill-value-standard-owner-with-name',entry:standardWithName.id,
 xml:standardOwner.xml.replace('<xr:StandardAttribute ','<xr:StandardAttribute name="Owner" '),
 yaml:`${standardOwner.yaml}\nИмя: Владелец`,
 adaptation:'Compose the reusable FillValue fragment with the independently observed standard-attribute name; the common text table converts the XML name to YAML and back',
});
const standardNamesSource='e2e/fixtures/xml/cf/Catalogs/СправочникПолный.xml';
const standardNamesYaml='e2e/fixtures/nkdk/cf/Справочник/СправочникПолный/Свойства.yaml';
const observedStandardNames=['Owner','Parent'];
for(const name of observedStandardNames)if(!source(standardNamesSource).includes(`<xr:StandardAttribute name="${name}">`))throw new Error(`Missing e2e standard member ${name}`);
const standardNamesText=source(standardNamesYaml);
for(const name of ['Владелец','Родитель'])if(!standardNamesText.includes(`  ${name}:`))throw new Error(`Missing e2e standard YAML key ${name}`);
const standardNameItem={format:'nkdk-declarations/1',kind:'value',id:'contract.standard-name-item',
 namespaces:{xr:xrNamespace},imports:{name:'common.standard-attribute-name'},
 value:{kind:'record',fields:[{name:'name',type:{use:'name'}}]},
 representations:{xml:{kind:'record',fields:[{field:'name',path:[],attribute:'name'}]},
   yaml:{kind:'mapping',fields:[{field:'name',key:'Имя'}]}},
};
const standardNameList={format:'nkdk-declarations/1',kind:'value',id:'contract.standard-name-list',
 namespaces:{xr:xrNamespace},imports:{item:standardNameItem.id},
 value:{kind:'sequence',item:{use:'item'}},
 representations:{xml:{kind:'element-sequence',path:['xr:StandardAttribute']},yaml:{kind:'record-mapping',key:'name'}},
};
const standardNames={format:'nkdk-declarations/1',kind:'object',id:'contract.standard-names',
 namespaces:{xr:xrNamespace},imports:{items:standardNameList.id},
 value:{kind:'record',fields:[{name:'items',type:{use:'items'}}]},
 representations:{xml:{kind:'record',fields:[{field:'items',path:['StandardAttributes']}]},
   yaml:{kind:'mapping',fields:[{field:'items',key:'СтандартныеРеквизиты'}]}},
};
for(const module of [standardNameItem,standardNameList,standardNames]){catalog.set(module.id,module);selected.push(module);}
cases.push({id:'standard-attribute-translated-mapping-keys',entry:standardNames.id,
 xml:`<StandardAttributes xmlns:xr="${xrNamespace}">${observedStandardNames.map(name=>`<xr:StandardAttribute name="${name}"/>`).join('')}</StandardAttributes>`,
 yaml:'СтандартныеРеквизиты:\n  Владелец: {}\n  Родитель: {}',
 source:[{path:standardNamesSource},{path:standardNamesYaml}],
 adaptation:'Project two observed e2e standard attribute names as a complete named collection; omit independent member fields to isolate shared XML attribute and YAML mapping key translation',
});
const canonicalNamesInput={type:{kind:'sequence',item:{kind:'scalar',scalar:'text'}}};
const canonicalList={...structuredClone(standardNameList),id:'contract.standard-canonical-names-list',
 inputs:{canonicalNames:canonicalNamesInput},
 presence:[{target:'self',xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{map:{in:{input:'canonicalNames'},as:'name',value:{record:{name:{var:'name'}}}}}}}}]};
const canonicalOwner={...structuredClone(standardNames),id:'contract.standard-canonical-names-owner',
 imports:{items:canonicalList.id},inputs:{canonicalNames:structuredClone(canonicalNamesInput)}};
canonicalOwner.value.fields[0].type.bind={canonicalNames:{input:'canonicalNames'}};
for(const module of [canonicalList,canonicalOwner]){catalog.set(module.id,module);selected.push(module);}
cases.push({id:'standard-attribute-canonical-names-from-empty-yaml',entry:canonicalOwner.id,
 xml:`<StandardAttributes xmlns:xr="${xrNamespace}">${observedStandardNames.map(name=>`<xr:StandardAttribute name="${name}"/>`).join('')}</StandardAttributes>`,
 yaml:'СтандартныеРеквизиты:\n  Владелец: {}\n  Родитель: {}',reverseYAML:'',
 inputs:{canonicalNames:observedStandardNames},source:[{path:standardNamesSource},{path:standardNamesYaml}],
 adaptation:'The two observed standard member names remain explicit on import; with an empty YAML owner the declarative canonical member list must restore their XML elements',
});
if(standardPolicies.get('Owner')?.fillValue?.policy!=='ownerReference' ||
   (standardPolicies.get('Parent')?.fillValue?.policy??'notSpecified')!=='notSpecified'){
 throw new Error('Changed independent standard Owner/Parent FillValue policies');
}
function namedStandardFillDeclaration(prefix,members){
 const profile=standardFillProfileExpressions(members);
 const item=structuredClone(standardFillProfile);
 item.id=`${prefix}-item`;
 item.kind='value';
 for(const name of Object.keys(profile.expressions))delete item.inputs[name];
 for(const name of profile.factInputs)item.inputs[name]={type:{kind:'scalar',scalar:'text'}};
 for(const field of item.representations.xml.fields){
   if(field.path[0]!=='xr:StandardAttribute')throw new Error('Changed standard FillValue boundary');
   field.path=field.path.slice(1);
 }
 item.imports.name='common.standard-attribute-name';
 item.value.fields.unshift({name:'name',type:{use:'name'}});
 for(const field of Object.keys(profile.expressions))item.value.fields.push({name:field,type:{kind:'scalar',scalar:'text'}});
 item.representations.xml.fields.unshift({field:'name',path:[],attribute:'name'});
 item.representations.yaml.fields.unshift({field:'name',key:'Имя'});
 for(const [field,denotes] of Object.entries(profile.expressions)){
   item.presence.push({target:{field},xml:{missing:{denotes:structuredClone(denotes)}},yaml:{missing:{denotes:structuredClone(denotes)}}});
 }
 function useRowProfile(value){
   if(Array.isArray(value))return value.map(useRowProfile);
   if(value && typeof value==='object'){
     if(profile.expressions[value.input] && Object.keys(value).length===1)return {field:value.input};
     return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,useRowProfile(child)]));
   }
   return value;
 }
 item.constraints=useRowProfile(item.constraints);
 item.presence[0]=useRowProfile(item.presence[0]);
 item.constraints.push({id:'known-standard-member',appliesTo:['xml-import','yaml-validation'],
   assert:{or:[...members.keys()].map(name=>({eq:[{field:'name'},{literal:name}]}))},
   diagnostic:{code:'standard-member.unknown',severity:'warning',at:{field:'name'},message:'Неизвестный стандартный реквизит владельца'}});
 const list={...structuredClone(standardNameList),id:`${prefix}-list`,
   imports:{item:item.id},inputs:structuredClone(item.inputs)};
 list.value.item.bind=Object.fromEntries(Object.keys(item.inputs).map(name=>[name,{input:name}]));
 const owner={...structuredClone(standardNames),id:`${prefix}-owner`,
   imports:{items:list.id},inputs:structuredClone(item.inputs)};
 owner.value.fields[0].type.bind=Object.fromEntries(Object.keys(item.inputs).map(name=>[name,{input:name}]));
 for(const module of [item,list,owner]){catalog.set(module.id,module);selected.push(module);}
 return {owner,profile};
}
const {owner:standardFillNamedOwner,profile:standardProfile}=namedStandardFillDeclaration('contract.standard-fill-named',standardPolicies);
const namedInputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],componentKind:'configuration',owners:standardOwner.inputs.owners,
 ...Object.fromEntries(standardProfile.factInputs.map(name=>[name,standardFacts[name]??'']))};
cases.push({id:'standard-attribute-named-owner-fill-value',entry:standardFillNamedOwner.id,
 xml:`<StandardAttributes xmlns:xr="${xrNamespace}">${standardOwner.xml.replace('<xr:StandardAttribute ','<xr:StandardAttribute name="Owner" ')}</StandardAttributes>`,
 yaml:`СтандартныеРеквизиты:\n  Владелец:\n    ${standardOwner.yaml}`,
 inputs:namedInputs,source:standardOwner.source,
 adaptation:'Retain the observed catalog Owner name and FillValue inside one named record; omit independent sibling fields to verify composition with the reusable FillValue declaration',
});
const standardParent=cases.find(row=>row.id==='fill-value-standard-parent');
cases.push({id:'standard-attribute-named-mixed-fill-values',entry:standardFillNamedOwner.id,
 xml:`<StandardAttributes xmlns:xr="${xrNamespace}">${[
   ['Owner',standardOwner],['Parent',standardParent],
 ].map(([name,row])=>row.xml.replace('<xr:StandardAttribute ',`<xr:StandardAttribute name="${name}" `)).join('')}</StandardAttributes>`,
 yaml:`СтандартныеРеквизиты:\n  Владелец:\n    ${standardOwner.yaml}\n  Родитель:\n    ${standardParent.yaml}`,
 inputs:namedInputs,source:[...standardOwner.source,...standardParent.source],
 adaptation:'Two observed members in one named collection have different FillValue policies; each row must use its own declaration-derived policy',
});
const standardNamedCode=cases.find(row=>row.id==='fill-value-standard-code');
cases.push({id:'standard-attribute-named-code-wrong-kind',entry:standardFillNamedOwner.id,
 xml:`<StandardAttributes xmlns:xr="${xrNamespace}">${standardNamedCode.xml
   .replace('<xr:StandardAttribute ','<xr:StandardAttribute name="Code" ')
   .replace('xsi:nil="true" />','xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">Текст</xr:FillValue>')}</StandardAttributes>`,
 yaml:'СтандартныеРеквизиты:\n  Код:\n    ЗначениеЗаполнения: Текст',
 inputs:namedInputs,diagnostics:['fill-value.type-mismatch'],source:standardNamedCode.source,
 adaptation:'The real catalog Code has a numeric owner-defined type; an observed typed string value in the same named collection must be retained and diagnosed',
});
const stringCodeXMLPath='e2e/fixtures/xml/cf/Catalogs/СправочникВладелец.xml';
const [stringCodeFixture]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify([{
 xml:stringCodeXMLPath,propertySelector:`.//{${xrNamespace}}StandardAttribute[@name='Code']/{${xrNamespace}}FillValue`,root:`{${xrNamespace}}FillValue`,
 context:standardFactNames.map(fact=>({name:fact[0].toLowerCase()+fact.slice(1),selector:`.//{${mdNamespace}}Properties/{${mdNamespace}}${fact}`})),
}]),encoding:'utf8'}));
if(stringCodeFixture.context.codeType!=='String' || stringCodeFixture.context.codeLength!=='9')throw new Error('Changed independent string Code owner facts');
const stringNamedInputs={...namedInputs,...Object.fromEntries(standardProfile.factInputs.map(name=>[name,stringCodeFixture.context[name]??'']))};
cases.push({id:'standard-attribute-named-string-code-too-long',entry:standardFillNamedOwner.id,
 xml:`<StandardAttributes xmlns:xr="${xrNamespace}"><xr:StandardAttribute name="Code">${stringCodeFixture.xml
   .replace('xsi:nil="true" />','xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">ABCDEFGHIJ</xr:FillValue>')}</xr:StandardAttribute></StandardAttributes>`,
 yaml:'СтандартныеРеквизиты:\n  Код:\n    ЗначениеЗаполнения: ABCDEFGHIJ',
 inputs:stringNamedInputs,diagnostics:['fill-value.string-length'],source:[...stringCodeFixture.source,...standardPolicyProvenance],
 adaptation:'The string Code and length 9 come from a second immutable catalog e2e owner; a ten-character value tests its independent owner-bound policy',
});
const {owner:documentFillNamedOwner,profile:documentProfile}=namedStandardFillDeclaration('contract.document-standard-fill-named',documentPolicies);
const documentNamedInputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],componentKind:'configuration',owners:[],
 ...Object.fromEntries(documentProfile.factInputs.map(name=>[name,'']))};
const documentDateWrongKind=cases.find(row=>row.id==='fill-value-standard-document-date-wrong-kind');
cases.push({id:'standard-attribute-named-document-date-wrong-kind',entry:documentFillNamedOwner.id,
 xml:`<StandardAttributes xmlns:xr="${xrNamespace}">${documentDateWrongKind.xml
   .replace('<xr:StandardAttribute ','<xr:StandardAttribute name="Date" ')}</StandardAttributes>`,
 yaml:`СтандартныеРеквизиты:\n  Дата:\n    ${documentDateWrongKind.yaml}`,
 inputs:documentNamedInputs,diagnostics:documentDateWrongKind.diagnostics,source:documentDateWrongKind.source,
 adaptation:'Generate the same named FillValue declaration from document standard members; the real Date wrapper with a text value must retain XML and report a calendar mismatch',
});
cases.push({id:'standard-attribute-named-foreign-member',entry:standardFillNamedOwner.id,
 xml:`<StandardAttributes xmlns:xr="${xrNamespace}">${documentDateCase.xml
   .replace('<xr:StandardAttribute ','<xr:StandardAttribute name="Date" ')}</StandardAttributes>`,
 yaml:'СтандартныеРеквизиты:\n  Дата: {}',inputs:namedInputs,diagnostics:['standard-member.unknown'],
 source:[...documentDateCase.source,...standardPolicyProvenance],
 adaptation:'Date is an observed document standard member but not a catalog member; the catalog declaration must infer a diagnostic and retain the typed member XML',
});
const catalogRefRow=cases.find(row=>row.id==='fill-value-standard-ref');
cases.push({id:'standard-attribute-named-forbidden-value',entry:standardFillNamedOwner.id,
 xml:`<StandardAttributes xmlns:xr="${xrNamespace}">${catalogRefRow.xml
   .replace('<xr:StandardAttribute ','<xr:StandardAttribute name="Ref" ')
   .replace('xsi:nil="true" />','xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">Текст</xr:FillValue>')}</StandardAttributes>`,
 yaml:'СтандартныеРеквизиты:\n  Ссылка:\n    ЗначениеЗаполнения: Текст',inputs:namedInputs,diagnostics:['fill-value.forbidden'],
 source:[...catalogRefRow.source,...standardPolicyProvenance],
 adaptation:'The observed Ref element normally has nil FillValue; a typed value inside the named collection must remain data and be diagnosed by its source-derived forbidden policy',
});
const standardDefaultSource='packages/rules/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.integration.test.ts';
if(!source(standardDefaultSource).includes('Catalog.СправочникВладелец.EmptyRef'))throw new Error('Changed independent standard Owner default');
cases.push({...standardOwner,id:'fill-value-standard-owner-implicit',
 xml:standardOwner.xml.replace('Catalog.СправочникВладелец.ПредопределенноеЗначение','Catalog.СправочникВладелец.EmptyRef'),
 yaml:'',inputs:{...standardOwner.inputs,owners:['Справочник.СправочникВладелец'],componentKind:'configuration'},
 source:[...standardOwner.source,{path:standardDefaultSource}],
 adaptation:'Keep the immutable Owner wrapper and the independently tested Owner EmptyRef default; omitting the YAML value must restore the typed XML reference from owner facts',
});
cases.push({...standardOwner,id:'fill-value-standard-owner-composite',
 xml:standardOwner.xml.replace('Catalog.СправочникВладелец.ПредопределенноеЗначение','Catalog.СправочникВладелец.EmptyRef'),
 yaml:'ЗначениеЗаполнения: Справочник.СправочникВладелец.ПустаяСсылка',
 inputs:{...standardOwner.inputs,owners:['Справочник.СправочникВладелец','Справочник.СправочникПолный']},
 source:[...standardOwner.source,{path:standardDefaultSource}],
 adaptation:'Use the observed Owner reference form with two declared catalog owners; the empty reference remains explicit because there is no unique implicit owner',
});
cases.push({...standardOwner,id:'fill-value-standard-owner-composite-unselected',
 xml:standardOwner.xml.replace('Catalog.СправочникВладелец.ПредопределенноеЗначение',''),
 yaml:'ЗначениеЗаполнения: .',
 inputs:{...standardOwner.inputs,owners:['Справочник.СправочникВладелец','Справочник.СправочникПолный']},
 source:[...standardOwner.source,{path:'rust/declarations/common/metadata-value.yaml'}],
 adaptation:'An unselected reference is valid for multiple owner alternatives; the same generic MetadataValue choice must retain its explicit empty-reference form',
});
cases.push({...standardOwner,id:'fill-value-standard-owner-without-owners',
 inputs:{...standardOwner.inputs,owners:[]},diagnostics:['fill-value.type-mismatch'],
 adaptation:'Keep the observed Owner reference but remove configured owners; the declaration infers a diagnostic and retains the explicit value',
});
cases.push({...standardOwner,id:'fill-value-standard-owner-wrong-root',
 xml:standardOwner.xml.replace('Catalog.СправочникВладелец.ПредопределенноеЗначение','Document.ДокументВсеСвойства.ПредопределенноеЗначение'),
 yaml:'ЗначениеЗаполнения: Документ.ДокументВсеСвойства.ПредопределенноеЗначение',
 diagnostics:['fill-value.type-mismatch'],
 source:[...standardOwner.source,{path:'e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства.xml'}],
 adaptation:'Keep the real Owner standard-attribute wrapper but substitute an observed document reference; the owner reference policy rejects a root outside the catalog owners',
});
const standardCode=cases.find(row=>row.id==='fill-value-standard-code');
const fixedCodeSource='packages/rules/metadata/commonObjects/fillValue/standardMember.test.ts';
if(!source(fixedCodeSource).includes('codeAllowedLength: "Fixed"'))throw new Error('Changed independent fixed code expectation');
cases.push({...standardCode,id:'fill-value-standard-fixed-code-short',
 xml:standardCode.xml.replace('xsi:nil="true" />','xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">AB</xr:FillValue>'),
 yaml:'ЗначениеЗаполнения: AB',
 inputs:{...standardCode.inputs,...standardFillPolicyInputs(standardPolicies.get('Code'),{
   codeType:'String',codeLength:'3',codeAllowedLength:'Fixed',
 },standardRootNames)},
 diagnostics:['fill-value.string-length'],
 source:[...standardCode.source,{path:fixedCodeSource}],
 adaptation:'Keep the actual Code standard-attribute XML wrapper and apply the independent fixed-length code policy; a two-character explicit value for length three must diagnose without losing XML',
});
cases.push({...standardOwner,id:'fill-value-standard-owner-extension',
 xml:standardCode.xml,yaml:'',inputs:{...standardOwner.inputs,componentKind:'configurationExtension'},
 source:[...standardOwner.source,...standardCode.source,{path:standardDefaultSource}],
 adaptation:'Use the immutable nil standard-attribute FillValue form and the independent Owner extension expectation; the same owner facts must not create a reference in an extension',
});
const standardRef=cases.find(row=>row.id==='fill-value-standard-ref');
cases.push({...standardRef,id:'fill-value-standard-forbidden-value',
 xml:standardRef.xml.replace('xsi:nil="true" />','xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">Текст</xr:FillValue>'),
 yaml:'ЗначениеЗаполнения: Текст',
 inputs:{...standardRef.inputs,policy:'forbidden',expectedKind:''},
 diagnostics:['fill-value.forbidden'],
 source:[...standardRef.source,{path:'packages/runtime/metadata/standardMembers/declarations.ts'}],
 adaptation:'Use the immutable standard nil wrapper and an observed typed string FillValue; the declared forbidden policy must infer a diagnostic without losing the explicit XML value',
});
const standardDeletionMark=cases.find(row=>row.id==='fill-value-standard-deletionmark');
cases.push({...standardDeletionMark,id:'fill-value-standard-boolean-mismatch',
 xml:standardDeletionMark.xml.replace('xsi:nil="true" />','xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">Текст</xr:FillValue>'),
 yaml:'ЗначениеЗаполнения: Текст',
 diagnostics:['fill-value.type-mismatch'],
 source:[...standardDeletionMark.source,{path:'packages/runtime/metadata/standardMembers/declarations.ts'}],
 adaptation:'Keep the real DeletionMark standard-attribute wrapper but supply an observed text FillValue; the effective boolean kind must infer a diagnostic while preserving the XML value',
});
cases.push({...standardDeletionMark,id:'fill-value-standard-boolean-value',
 xml:standardDeletionMark.xml.replace('xsi:nil="true" />','xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:boolean">true</xr:FillValue>'),
 yaml:'ЗначениеЗаполнения: Истина',
 source:[...standardDeletionMark.source,{path:'e2e/fixtures/xml/cf/Catalogs/СправочникВладелец.xml'}],
 adaptation:'Keep the real DeletionMark wrapper and use an independently observed boolean FillValue; the effective boolean kind accepts it in both directions',
});
cases.push({...standardCode,id:'fill-value-standard-code-wrong-kind',
 xml:standardCode.xml.replace('xsi:nil="true" />','xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">Текст</xr:FillValue>'),
 yaml:'ЗначениеЗаполнения: Текст',
 diagnostics:['fill-value.type-mismatch'],
 source:[...standardCode.source,{path:standardXMLPath}],
 adaptation:'The real catalog declares numeric CodeType; replacing only the nil FillValue with observed text must preserve XML and diagnose the kind mismatch',
});
const standardDescription=cases.find(row=>row.id==='fill-value-standard-description');
cases.push({...standardDescription,id:'fill-value-standard-description-too-long',
 xml:standardDescription.xml.replace('xsi:nil="true" />',`xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${'А'.repeat(31)}</xr:FillValue>`),
 yaml:`ЗначениеЗаполнения: ${'А'.repeat(31)}`,
 diagnostics:['fill-value.string-length'],
 source:[...standardDescription.source,{path:standardXMLPath}],
 adaptation:'The catalog DescriptionLength is 30; an explicitly typed 31-character value must remain round-trip data and produce a length diagnostic',
});
cases.push({...standardCode,id:'fill-value-standard-code-overflow',
 xml:standardCode.xml.replace('xsi:nil="true" />','xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:decimal">123456789012</xr:FillValue>'),
 yaml:'ЗначениеЗаполнения: 123456789012',
 diagnostics:['fill-value.number-qualifiers'],
 source:[...standardCode.source,{path:standardXMLPath}],
 adaptation:'The catalog CodeType is numeric and CodeLength is 11; a 12-digit explicit decimal stays round-trip data and produces a qualifier diagnostic',
});
for(const [internal,yamlName,sourceId] of [
 ['Code','Код','fill-value-standard-code-overflow'],
 ['Description','Наименование','fill-value-standard-description-too-long'],
 ['DeletionMark','ПометкаУдаления','fill-value-standard-boolean-mismatch'],
]){
 const row=cases.find(candidate=>candidate.id===sourceId);
 cases.push({id:`standard-attribute-named-${sourceId}`,entry:standardFillNamedOwner.id,
   xml:`<StandardAttributes xmlns:xr="${xrNamespace}">${row.xml.replace('<xr:StandardAttribute ',`<xr:StandardAttribute name="${internal}" `)}</StandardAttributes>`,
   yaml:`СтандартныеРеквизиты:\n  ${yamlName}:\n    ${row.yaml}`,
   inputs:namedInputs,diagnostics:row.diagnostics,source:row.source,
   adaptation:`Retain the e2e-derived ${internal} anomaly inside its named collection; the source member policy and owner facts must produce the same diagnostic`,
 });
}
const stringAttribute=owners.cases.find(row=>row.id==='e2e-properties-СтроковыйРеквизит');
const fixedTypeSource='packages/rules/metadata/commonObjects/fillValue/effectiveType.test.ts';
if(!stringAttribute?.xml.includes('<v8:AllowedLength>Variable</v8:AllowedLength>') ||
   !stringAttribute.yaml.includes('Тип: Строка(10)') ||
   !source(fixedTypeSource).includes('allowedLength: "Fixed"'))throw new Error('Changed independent fixed-string source');
if(!stringAttribute.xml.includes('<FillValue xsi:type="xs:string" />'))throw new Error('Changed independent string FillValue source');
const referenceXMLSource='e2e/fixtures/xml/cf/ExchangePlans/ПланОбменаВсеСвойства.xml';
const referenceYAMLSource='e2e/fixtures/nkdk/cf/ПланОбмена/ПланОбменаВсеСвойства/Свойства.yaml';
if(!source(referenceXMLSource).includes('<FillValue xsi:type="xr:DesignTimeRef">Catalog.СправочникРеквизит.ПредопредленноеЗначение</FillValue>') ||
   !source(referenceYAMLSource).includes('ЗначениеЗаполнения: Справочник.СправочникРеквизит.ПредопредленноеЗначение'))throw new Error('Changed independent reference FillValue source');
const referenceAttribute={...stringAttribute,
  id:'fill-value-reference',
  xml:stringAttribute.xml
    .replace('<Properties xmlns:v8=', '<Properties xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:v8=')
    .replace('<v8:Type>xs:string</v8:Type>','<v8:Type>cfg:CatalogRef.СправочникРеквизит</v8:Type>')
    .replace(/\s*<v8:StringQualifiers>[\s\S]*?<\/v8:StringQualifiers>/,'')
    .replace('<FillValue xsi:type="xs:string" />','<FillValue xsi:type="xr:DesignTimeRef">Catalog.СправочникРеквизит.ПредопредленноеЗначение</FillValue>'),
  yaml:'Тип: Справочник.СправочникРеквизит\nЗначениеЗаполнения: Справочник.СправочникРеквизит.ПредопредленноеЗначение',
  source:[...stringAttribute.source,{path:referenceXMLSource},{path:referenceYAMLSource}],
  adaptation:'Use the supported document attribute wrapper and the unchanged Type/FillValue pair from the immutable exchange-plan e2e fixture; reverse export uses freshly prepared inputs without an XML reference',
};
cases.push(referenceAttribute);
cases.push({...referenceAttribute,
  id:'fill-value-reference-wrong-kind',
  xml:referenceAttribute.xml.replace('Catalog.СправочникРеквизит.ПредопредленноеЗначение</FillValue>','Document.ДокументВсеСвойства.ПредопредленноеЗначение</FillValue>'),
  yaml:referenceAttribute.yaml.replace('Справочник.СправочникРеквизит.ПредопредленноеЗначение','Документ.ДокументВсеСвойства.ПредопредленноеЗначение'),
  diagnostics:['fill-value.type-mismatch'],
  adaptation:'Change only the explicit DesignTimeRef root and owner while retaining the observed CatalogRef type; the incompatible reference remains round-trip data',
});
const compositeReferenceSource='e2e/fixtures/xml/cf/Catalogs/СправочникСХарактеристиками.xml';
if(!source(compositeReferenceSource).includes('<v8:Type>cfg:CatalogRef.СправочникПолный</v8:Type>\n\t\t\t\t\t\t\t\t<v8:Type>cfg:CatalogRef.СправочникCоВсемиОбъектами</v8:Type>'))throw new Error('Changed independent composite reference type source');
const compositeReference={...referenceAttribute,
  id:'fill-value-reference-composite-second',
  xml:referenceAttribute.xml.replace('<v8:Type>cfg:CatalogRef.СправочникРеквизит</v8:Type>', '<v8:Type>cfg:CatalogRef.СправочникПолный</v8:Type>\n\t\t\t\t\t\t<v8:Type>cfg:CatalogRef.СправочникРеквизит</v8:Type>'),
  yaml:referenceAttribute.yaml.replace('Тип: Справочник.СправочникРеквизит', 'Тип:\n  - Справочник.СправочникПолный\n  - Справочник.СправочникРеквизит'),
  source:[...referenceAttribute.source,{path:compositeReferenceSource}],
  adaptation:'Use the observed composite CatalogRef type layout with the independently observed explicit DesignTimeRef in its second alternative',
};
cases.push(compositeReference);
cases.push({...compositeReference,
  id:'fill-value-reference-composite-wrong-kind',
  xml:compositeReference.xml.replace('Catalog.СправочникРеквизит.ПредопредленноеЗначение</FillValue>','Document.ДокументВсеСвойства.ПредопредленноеЗначение</FillValue>'),
  yaml:compositeReference.yaml.replace('Справочник.СправочникРеквизит.ПредопредленноеЗначение','Документ.ДокументВсеСвойства.ПредопредленноеЗначение'),
  diagnostics:['fill-value.type-mismatch'],
  adaptation:'Keep both observed reference alternatives and change only the explicit reference kind; the mismatch must remain round-trip data',
});
const textFillSource='e2e/fixtures/xml/cf/Reports/ОтчетВсеСвойства.xml';
if(!source(textFillSource).includes('<FillValue xsi:type="xs:string">Строка</FillValue>') ||
   !source(compositeReferenceSource).includes('<v8:Type>cfg:CatalogRef.СправочникПолный</v8:Type>\n\t\t\t\t\t\t\t\t<v8:Type>xs:string</v8:Type>'))throw new Error('Changed independent composite text value source');
const definedTypeXmlPath='e2e/fixtures/xml/cf/DefinedTypes/ОпределяемыйТипВсеСвойства.xml';
const definedTypeYamlPath='e2e/fixtures/nkdk/cf/ОпределяемыйТип/ОпределяемыйТипВсеСвойства.yaml';
const definedTypeXML=source(definedTypeXmlPath),definedTypeYAML=source(definedTypeYamlPath);
if(!definedTypeXML.includes('<v8:Type>xs:string</v8:Type>') || !definedTypeXML.includes('<v8:Type>xs:decimal</v8:Type>') ||
   !definedTypeYAML.includes('Строка(10)') || !definedTypeYAML.includes('Число(10, 0)'))throw new Error('Changed independent defined-type alternatives');
const definedTypeAttribute={...referenceAttribute,
  id:'fill-value-defined-type-as-text',
  xml:referenceAttribute.xml.replace('<v8:Type>cfg:CatalogRef.СправочникРеквизит</v8:Type>','<v8:TypeSet>cfg:DefinedType.ОпределяемыйТипВсеСвойства</v8:TypeSet>')
    .replace('<FillValue xsi:type="xr:DesignTimeRef">Catalog.СправочникРеквизит.ПредопредленноеЗначение</FillValue>','<FillValue xsi:type="xs:string">Строка</FillValue>'),
  yaml:'Тип: ОпределяемыйТип.ОпределяемыйТипВсеСвойства\nЗначениеЗаполнения: Строка',
  xmlQNamePaths:referenceAttribute.xmlQNamePaths.map(path=>path.map(segment=>segment==='{http://v8.1c.ru/8.1/data/core}Type'?'{http://v8.1c.ru/8.1/data/core}TypeSet':segment)),
  source:[...referenceAttribute.source,{path:textFillSource},{path:definedTypeXmlPath},{path:definedTypeYamlPath}],
  adaptation:'The immutable defined type supplies string and decimal alternatives; the observed text FillValue is valid through the prepared union',
};
cases.push(definedTypeAttribute);
cases.push({...definedTypeAttribute,
  id:'fill-value-defined-type-reference-mismatch',
  xml:definedTypeAttribute.xml.replace('<FillValue xsi:type="xs:string">Строка</FillValue>','<FillValue xsi:type="xr:DesignTimeRef">Catalog.СправочникРеквизит.ПредопредленноеЗначение</FillValue>'),
  yaml:definedTypeAttribute.yaml.replace('ЗначениеЗаполнения: Строка','ЗначениеЗаполнения: Справочник.СправочникРеквизит.ПредопредленноеЗначение'),
  diagnostics:['fill-value.type-mismatch'],
  adaptation:'The observed reference value is incompatible with both actual alternatives of the immutable defined type',
});
cases.push({...definedTypeAttribute,
  id:'fill-value-defined-type-missing',
  xml:definedTypeAttribute.xml.replaceAll('ОпределяемыйТипВсеСвойства','ОтсутствующийОпределяемыйТип'),
  yaml:definedTypeAttribute.yaml.replaceAll('ОпределяемыйТипВсеСвойства','ОтсутствующийОпределяемыйТип'),
  diagnostics:['fact.missing'],
  noRaw:true,
  adaptation:'Change only the declared name; an absent graph node is a semantic anomaly and must not also produce a type-mismatch diagnostic',
});
const compositeReferenceText={...compositeReference,
  id:'fill-value-reference-composite-as-text',
  xml:compositeReference.xml.replace('<FillValue xsi:type="xr:DesignTimeRef">Catalog.СправочникРеквизит.ПредопредленноеЗначение</FillValue>','<FillValue xsi:type="xs:string">Строка</FillValue>'),
  yaml:compositeReference.yaml.replace('ЗначениеЗаполнения: Справочник.СправочникРеквизит.ПредопредленноеЗначение','ЗначениеЗаполнения: Строка'),
  diagnostics:['fill-value.type-mismatch'],
  source:[...compositeReference.source,{path:textFillSource}],
  adaptation:'Use the observed explicit string value with two observed CatalogRef alternatives; a text value is incompatible but remains round-trip data',
};
cases.push(compositeReferenceText);
cases.push({...compositeReferenceText,
  id:'fill-value-reference-or-string-as-text',
  xml:compositeReferenceText.xml.replace('<v8:Type>cfg:CatalogRef.СправочникРеквизит</v8:Type>', '<v8:Type>xs:string</v8:Type>\n\t\t\t\t\t\t<v8:StringQualifiers>\n\t\t\t\t\t\t\t<v8:Length>10</v8:Length>\n\t\t\t\t\t\t\t<v8:AllowedLength>Variable</v8:AllowedLength>\n\t\t\t\t\t\t</v8:StringQualifiers>'),
  yaml:compositeReferenceText.yaml.replace('  - Справочник.СправочникРеквизит', '  - Строка(10)'),
  diagnostics:[],
  adaptation:'Replace the second CatalogRef with the observed string alternative and qualifiers; the same explicit string now matches one branch',
});
const numericCompositeSource='e2e/fixtures/xml/cf/CalculationRegisters/РегистрРасчетаВедущий.xml';
const numericFillSource='e2e/fixtures/xml/cf/InformationRegisters/РегистрСведенийВсеСвойстваНезависимый.xml';
if(!source(numericCompositeSource).includes('<v8:Type>cfg:CatalogRef.СправочникПолный</v8:Type>\n\t\t\t\t\t\t<v8:Type>xs:decimal</v8:Type>') ||
   !source(numericFillSource).includes('<FillValue xsi:type="xs:decimal">1234</FillValue>'))throw new Error('Changed independent composite number source');
cases.push({...definedTypeAttribute,
  id:'fill-value-defined-type-as-number',
  xml:definedTypeAttribute.xml.replace('<FillValue xsi:type="xs:string">Строка</FillValue>','<FillValue xsi:type="xs:decimal">1234</FillValue>'),
  yaml:definedTypeAttribute.yaml.replace('ЗначениеЗаполнения: Строка','ЗначениеЗаполнения: 1234'),
  source:[...definedTypeAttribute.source,{path:numericFillSource}],
  adaptation:'The observed exact decimal FillValue is valid through the second alternative of the immutable defined type',
});
const compositeReferenceNumber={...compositeReferenceText,
  id:'fill-value-reference-or-number-as-text',
  xml:compositeReferenceText.xml.replace('<v8:Type>cfg:CatalogRef.СправочникРеквизит</v8:Type>', '<v8:Type>xs:decimal</v8:Type>\n\t\t\t\t\t\t<v8:NumberQualifiers>\n\t\t\t\t\t\t\t<v8:Digits>10</v8:Digits>\n\t\t\t\t\t\t\t<v8:FractionDigits>0</v8:FractionDigits>\n\t\t\t\t\t\t\t<v8:AllowedSign>Any</v8:AllowedSign>\n\t\t\t\t\t\t</v8:NumberQualifiers>'),
  yaml:compositeReferenceText.yaml.replace('  - Справочник.СправочникРеквизит','  - Число(10, 0)'),
  source:[...compositeReferenceText.source,{path:numericCompositeSource},{path:numericFillSource}],
  adaptation:'Use the observed CatalogRef/decimal type pair and explicit string FillValue; neither alternative accepts text',
};
cases.push(compositeReferenceNumber);
cases.push({...compositeReferenceNumber,
  id:'fill-value-reference-or-number-as-number',
  xml:compositeReferenceNumber.xml.replace('<FillValue xsi:type="xs:string">Строка</FillValue>','<FillValue xsi:type="xs:decimal">1234</FillValue>'),
  yaml:compositeReferenceNumber.yaml.replace('ЗначениеЗаполнения: Строка','ЗначениеЗаполнения: 1234'),
  diagnostics:[],
  adaptation:'Keep the observed CatalogRef/decimal type pair and use the observed numeric FillValue; the decimal branch accepts it',
});
const catalogTypeSetSource='e2e/fixtures/xml/cf/Catalogs/ПараметрыВыбора.xml';
const catalogTypeSetYAMLSource='e2e/fixtures/nkdk/cf/Справочник/ПараметрыВыбора/Свойства.yaml';
if(!source(catalogTypeSetSource).includes('<v8:TypeSet>cfg:CatalogRef</v8:TypeSet>') ||
   !source(catalogTypeSetYAMLSource).includes('Тип: Справочник'))throw new Error('Changed independent catalog TypeSet source');
const catalogTypeSetAttribute={...referenceAttribute,
  id:'fill-value-reference-type-set',
  xml:referenceAttribute.xml.replace('<v8:Type>cfg:CatalogRef.СправочникРеквизит</v8:Type>','<v8:TypeSet>cfg:CatalogRef</v8:TypeSet>'),
  yaml:referenceAttribute.yaml.replace('Тип: Справочник.СправочникРеквизит','Тип: Справочник'),
  xmlQNamePaths:referenceAttribute.xmlQNamePaths.map(path=>path.map(segment=>segment==='{http://v8.1c.ru/8.1/data/core}Type'?'{http://v8.1c.ru/8.1/data/core}TypeSet':segment)),
  source:[...referenceAttribute.source,{path:catalogTypeSetSource},{path:catalogTypeSetYAMLSource}],
  adaptation:'Use the independently observed catalog TypeSet in the supported document attribute wrapper; its explicit DesignTimeRef remains a valid catalog value',
};
cases.push(catalogTypeSetAttribute);
cases.push({...catalogTypeSetAttribute,
  id:'fill-value-reference-type-set-as-text',
  xml:catalogTypeSetAttribute.xml.replace('<FillValue xsi:type="xr:DesignTimeRef">Catalog.СправочникРеквизит.ПредопредленноеЗначение</FillValue>','<FillValue xsi:type="xs:string">текст</FillValue>'),
  yaml:catalogTypeSetAttribute.yaml.replace('ЗначениеЗаполнения: Справочник.СправочникРеквизит.ПредопредленноеЗначение','ЗначениеЗаполнения: текст'),
  diagnostics:['fill-value.type-mismatch'],
  adaptation:'Retain the observed catalog TypeSet and change only explicit FillValue to text; the value stays round-trip data with a diagnostic',
});
cases.push({...referenceAttribute,
  id:'fill-value-reference-as-text',
  xml:referenceAttribute.xml.replace('<FillValue xsi:type="xr:DesignTimeRef">Catalog.СправочникРеквизит.ПредопредленноеЗначение</FillValue>','<FillValue xsi:type="xs:string">текст</FillValue>'),
  yaml:referenceAttribute.yaml.replace('ЗначениеЗаполнения: Справочник.СправочникРеквизит.ПредопредленноеЗначение','ЗначениеЗаполнения: текст'),
  diagnostics:['fill-value.type-mismatch'],
  adaptation:'Retain the declared CatalogRef type and change only explicit FillValue to a string; an incompatible value remains round-trip data with a diagnostic',
});
cases.push({...stringAttribute,
  id:'fill-value-string-too-long',
  xml:stringAttribute.xml.replace('<FillValue xsi:type="xs:string" />','<FillValue xsi:type="xs:string">12345678901</FillValue>'),
  yaml:stringAttribute.yaml.replace('Тип: Строка(10)',"Тип: Строка(10)\nЗначениеЗаполнения: '12345678901'"),
  diagnostics:['fill-value.string-length'],
  adaptation:'Use immutable e2e string attribute and existing length 10; change only the explicit FillValue to 11 characters, keeping declared Type and sibling expectations',
});
cases.push({...stringAttribute,
  id:'fill-value-string-at-limit',
  xml:stringAttribute.xml.replace('<FillValue xsi:type="xs:string" />','<FillValue xsi:type="xs:string">1234567890</FillValue>'),
  yaml:stringAttribute.yaml.replace('Тип: Строка(10)',"Тип: Строка(10)\nЗначениеЗаполнения: '1234567890'"),
  adaptation:'The same immutable variable string length 10 accepts exactly ten UTF-16 units without a diagnostic',
});
cases.push({...stringAttribute,
  id:'fill-value-string-utf16-length',
  xml:stringAttribute.xml.replace('<FillValue xsi:type="xs:string" />','<FillValue xsi:type="xs:string">123456789😀</FillValue>'),
  yaml:stringAttribute.yaml.replace('Тип: Строка(10)',"Тип: Строка(10)\nЗначениеЗаполнения: '123456789😀'"),
  diagnostics:['fill-value.string-length'],
  adaptation:'Use the immutable e2e length 10 and an explicit value with nine BMP digits plus one supplementary Unicode character; the existing TypeScript length contract counts UTF-16 units',
});
const fixedStringAttribute={...stringAttribute,
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
};
cases.push(fixedStringAttribute);
cases.push({...fixedStringAttribute,
  id:'fill-value-fixed-string-at-limit',
  xml:fixedStringAttribute.xml.replace('<FillValue xsi:type="xs:string" />','<FillValue xsi:type="xs:string">1234567890</FillValue>'),
  yaml:fixedStringAttribute.yaml.replace('Тип: ФиксированнаяСтрока(10)',"Тип: ФиксированнаяСтрока(10)\nЗначениеЗаполнения: '1234567890'"),
  rejectedYAML:[],
  adaptation:'The immutable fixed string type length 10 accepts exactly ten UTF-16 units without a diagnostic',
});
cases.push({...fixedStringAttribute,
  id:'fill-value-fixed-string-too-short',
  xml:fixedStringAttribute.xml.replace('<FillValue xsi:type="xs:string" />','<FillValue xsi:type="xs:string">123456789</FillValue>'),
  yaml:fixedStringAttribute.yaml.replace('Тип: ФиксированнаяСтрока(10)',"Тип: ФиксированнаяСтрока(10)\nЗначениеЗаполнения: '123456789'"),
  diagnostics:['fill-value.string-length'],
  rejectedYAML:[],
  adaptation:'The existing fixed length 10 requires exactly ten characters; change the immutable e2e value to nine and retain the XML spelling',
});
const numericAttribute=owners.cases.find(row=>row.id==='e2e-properties-РеквизитВсеСвойства');
if(!numericAttribute?.xml.includes('<FillValue xsi:type="xs:decimal">1234</FillValue>') ||
   !numericAttribute.yaml.includes('ЗначениеЗаполнения: 1234'))throw new Error('Changed independent numeric FillValue source');
cases.push({...numericAttribute,
  id:'fill-value-number-over-precision',
  xml:numericAttribute.xml.replace('<FillValue xsi:type="xs:decimal">1234</FillValue>','<FillValue xsi:type="xs:decimal">12345678901</FillValue>'),
  yaml:numericAttribute.yaml.replace('ЗначениеЗаполнения: 1234','ЗначениеЗаполнения: 12345678901'),
  diagnostics:['fill-value.number-qualifiers'],
  adaptation:'Keep the immutable e2e number type with precision 10 and replace only the explicit value with an exact eleven-digit decimal',
});
cases.push({...numericAttribute,
  id:'fill-value-number-at-precision',
  xml:numericAttribute.xml.replace('<FillValue xsi:type="xs:decimal">1234</FillValue>','<FillValue xsi:type="xs:decimal">1234567890</FillValue>'),
  yaml:numericAttribute.yaml.replace('ЗначениеЗаполнения: 1234','ЗначениеЗаполнения: 1234567890'),
  adaptation:'The same immutable precision 10 accepts exactly ten significant integer digits',
});
cases.push({...numericAttribute,
  id:'fill-value-number-over-fraction',
  xml:numericAttribute.xml.replace('<FillValue xsi:type="xs:decimal">1234</FillValue>','<FillValue xsi:type="xs:decimal">12.5</FillValue>'),
  yaml:numericAttribute.yaml.replace('ЗначениеЗаполнения: 1234','ЗначениеЗаполнения: 12.5'),
  diagnostics:['fill-value.number-qualifiers'],
  adaptation:'The immutable number type allows zero fraction digits; an exact fractional value remains reversible and is diagnosed',
});
cases.push({...numericAttribute,
  id:'fill-value-exact-large-decimal',
  xml:numericAttribute.xml.replace('<v8:Digits>10</v8:Digits>','<v8:Digits>20</v8:Digits>').replace('<FillValue xsi:type="xs:decimal">1234</FillValue>','<FillValue xsi:type="xs:decimal">9007199254740993</FillValue>'),
  yaml:numericAttribute.yaml.replace('Тип: Число(10, 0)','Тип: Число(20, 0)').replace('ЗначениеЗаполнения: 1234','ЗначениеЗаполнения: 9007199254740993'),
  adaptation:'The same e2e numeric owner with a wider precision accepts a value above JavaScript safe integer; XML and YAML retain the exact digits',
});
cases.push({...numericAttribute,
  id:'fill-value-negative-for-nonnegative-type',
  xml:numericAttribute.xml.replace('<v8:AllowedSign>Any</v8:AllowedSign>','<v8:AllowedSign>Nonnegative</v8:AllowedSign>').replace('<FillValue xsi:type="xs:decimal">1234</FillValue>','<FillValue xsi:type="xs:decimal">-1</FillValue>'),
  yaml:numericAttribute.yaml.replace('Тип: Число(10, 0)','Тип: ПоложительноеЧисло(10, 0)').replace('ЗначениеЗаполнения: 1234','ЗначениеЗаполнения: -1'),
  diagnostics:['fill-value.number-qualifiers'],
  adaptation:'Keep the e2e numeric owner and declared precision, set Nonnegative and an explicit negative exact value; retain round-trip with a diagnostic',
});
cases.push({...numericAttribute,
  id:'fill-value-negative-for-unbounded-nonnegative-type',
  xml:numericAttribute.xml.replace('<v8:Digits>10</v8:Digits>','<v8:Digits>0</v8:Digits>').replace('<v8:AllowedSign>Any</v8:AllowedSign>','<v8:AllowedSign>Nonnegative</v8:AllowedSign>').replace('<FillValue xsi:type="xs:decimal">1234</FillValue>','<FillValue xsi:type="xs:decimal">-1</FillValue>'),
  yaml:numericAttribute.yaml.replace('Тип: Число(10, 0)','Тип: ПоложительноеЧисло(0, 0)').replace('ЗначениеЗаполнения: 1234','ЗначениеЗаполнения: -1'),
  diagnostics:['fill-value.number-qualifiers'],
  adaptation:'The e2e owner with unbounded numeric precision and Nonnegative sign still rejects an explicit negative value',
});
cases.push({...numericAttribute,
  id:'fill-value-incompatible-explicit-text',
  xml:numericAttribute.xml.replace('<FillValue xsi:type="xs:decimal">1234</FillValue>','<FillValue xsi:type="xs:string">abc</FillValue>'),
  yaml:numericAttribute.yaml.replace('ЗначениеЗаполнения: 1234','ЗначениеЗаполнения: abc'),
  diagnostics:['fill-value.type-mismatch'],
  adaptation:'Change only the explicit FillValue of an immutable e2e numeric attribute to a typed string; the declared Type and all sibling properties retain their independent expectations',
});
cases.push({...numericAttribute,
  id:'fill-value-quoted-numeric-text',
  xml:numericAttribute.xml.replace('<FillValue xsi:type="xs:decimal">1234</FillValue>','<FillValue xsi:type="xs:string">1234</FillValue>'),
  yaml:numericAttribute.yaml.replace('ЗначениеЗаполнения: 1234',"ЗначениеЗаполнения: '1234'"),
  diagnostics:['fill-value.type-mismatch'],
  adaptation:'Change the same immutable e2e numeric attribute to a typed string resembling a number; quoted YAML must keep the string variant and restore the XML type',
});
const booleanAttribute=owners.cases.find(row=>row.id==='e2e-properties-РеквизитБулево');
if(!booleanAttribute?.xml.includes('<FillValue xsi:nil="true" />') || !booleanAttribute.yaml.includes('Тип: Булево'))throw new Error('Changed independent boolean FillValue source');
const dateAttribute=owners.cases.find(row=>row.id==='e2e-properties-РеквизитСправочника');
if(!dateAttribute?.xml.includes('<FillValue xsi:nil="true" />') || !dateAttribute.yaml.includes('Тип: Дата'))throw new Error('Changed independent date FillValue source');
cases.push({...dateAttribute,
  id:'fill-value-date-with-time',
  xml:dateAttribute.xml.replace('<FillValue xsi:nil="true" />','<FillValue xsi:type="xs:dateTime">2026-09-21T12:00:00</FillValue>'),
  yaml:dateAttribute.yaml.replace('Тип: Дата','Тип: Дата\nЗначениеЗаполнения: 21.09.2026 12:00:00'),
  diagnostics:['fill-value.calendar-fraction'],
  adaptation:'Keep the immutable e2e date-only Type and set an explicit XML calendar value with a nonzero time; the mismatch must be diagnosed while retaining round-trip',
});
cases.push({...dateAttribute,
  id:'fill-value-date-at-midnight',
  xml:dateAttribute.xml.replace('<FillValue xsi:nil="true" />','<FillValue xsi:type="xs:dateTime">2026-09-21T00:00:00</FillValue>'),
  yaml:dateAttribute.yaml.replace('Тип: Дата','Тип: Дата\nЗначениеЗаполнения: 21.09.2026 00:00:00'),
  adaptation:'The same immutable date-only Type accepts an explicit midnight value without a calendar-fraction diagnostic',
});
for(const [id,owner,oldXML,newXML,newYAML] of [
  ['string',stringAttribute,'<FillValue xsi:type="xs:string" />','<FillValue xsi:type="xs:decimal">12</FillValue>','ЗначениеЗаполнения: 12'],
  ['boolean',booleanAttribute,'<FillValue xsi:nil="true" />','<FillValue xsi:type="xs:string">abc</FillValue>','ЗначениеЗаполнения: abc'],
  ['date',dateAttribute,'<FillValue xsi:nil="true" />','<FillValue xsi:type="xs:decimal">12</FillValue>','ЗначениеЗаполнения: 12'],
]) {
  if(!owner.xml.includes(oldXML) || owner.yaml.includes('ЗначениеЗаполнения:'))throw new Error(`Changed independent ${id} FillValue source`);
  const typeLine=owner.yaml.split('\n').find(line=>line.startsWith('Тип: '));
  if(!typeLine)throw new Error(`Missing independent ${id} type expectation`);
  cases.push({...owner,
    id:`fill-value-incompatible-${id}`,
    xml:owner.xml.replace(oldXML,newXML),
    yaml:owner.yaml.replace(typeLine,`${typeLine}\n${newYAML}`),
    diagnostics:['fill-value.type-mismatch'],
    adaptation:`Change only the explicit FillValue of an immutable e2e ${id} attribute to a different typed value; preserve the declared Type and sibling expectations`,
  });
}
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
const definedTypeProviderPath='rust/declarations/probes/defined-type-facts.yaml';
const definedTypeProviderText=source(definedTypeProviderPath),definedTypeProvider=yaml.load(definedTypeProviderText);
catalog.set(definedTypeProvider.id,definedTypeProvider);
derivedTexts.set(definedTypeProvider.id,definedTypeProviderText);
selected.push(definedTypeProvider);
factSources.push({entry:definedTypeProvider.id,xml:definedTypeXML,inputs:{ownerName:'ОпределяемыйТипВсеСвойства',defaultLanguage:'ru',registeredLanguages:['ru','en']},source:definedTypeXmlPath});
for(const [id,module] of baseCatalog)if(!catalog.has(id))catalog.set(id,module);
const modules=[...selected,...dependencyFiles(selected,catalog)];
const files=Object.fromEntries(modules.map(m=>[m.id+'.yaml',derivedTexts.get(m.id)??manifest.generatedFiles[m.id+'.yaml']??yaml.dump(m)]));
writeCandidates('tests/migration/rules-contract-catalog',files,{status:'test-only',derivedProjections,entries:selected.map(m=>m.id)});
const result={version:1,status:'limited-profile; original tests retained',derivedProjections,sharedProfiles,factSources,sources,cases,pendingRows,pending:['Dynamic test helpers and unselected tables','I8nText profiles absent from one-property candidates; complete-owner integration','Typed scalar XML and old invalid-input exceptions','Date timezone, invalid and empty-state contracts need candidate coverage','Full owners and other collection families; e2e integration'],xmlEquality:'Namespace-aware structure; no source XML reference passed to reverse operation'};
writeFileSync('tests/migration/rules-contract-cases.json',JSON.stringify(result,null,2)+'\n');
console.log(`${cases.length} independent cases; ${modules.length} declarations`);
