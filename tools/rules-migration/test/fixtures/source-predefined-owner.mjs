import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {candidateCatalog,yaml} from '../../src/candidate-catalog.mjs';
import {assembleRecordStateOwner} from '../../src/source-record-owner.mjs';
import {recordOwnerFactSources} from '../../src/record-owner-fact-sources.mjs';
import {bindPreparedOwnerIndexes} from '../../src/owner-index-requirements.mjs';
import {selectContracts} from '../../src/focused-catalog.mjs';

const {catalog}=candidateCatalog();
const original=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries.find(row=>row.symbol==='MetadataCatalogRules');
const source={...original,properties:original.properties.filter(row=>[
 'xmlRoot','uuid','name','objectBelonging','extendedConfigurationObject','predefined','objectModule',
].includes(row.name))};
const assembly=assembleRecordStateOwner(source,catalog,{id:'test.source-predefined-owner'});
const owner=bindPreparedOwnerIndexes(assembly.owner,assembly.indexRequirements);
const fixture='e2e/fixtures/xml/cf/Catalogs/СправочникСПредопределенными.xml';
const file=readFileSync(fixture.replace(/\.xml$/,'/Ext/Predefined.xml'),'utf8');
const expected=yaml.load(readFileSync('e2e/fixtures/nkdk/cf/Справочник/СправочникСПредопределенными/Свойства.yaml','utf8')).Предопределенные;
if(!expected?.Группа?.Элементы?.Предопределенный1)throw new Error('Missing independent nested predefined expectation');
// Fixture values remain the oracle; the accepted declaration emits item headers
// before nested collections (the old TS fixture places ЭтоГруппа last).
function itemOrder(items) {
 return Object.fromEntries(Object.entries(items).map(([name,row])=>{
  const {Элементы:children,...header}=row;
  return [name,children?{...header,Элементы:itemOrder(children)}:header];
 }));
}
const [projection]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
 encoding:'utf8',input:JSON.stringify([{xml:fixture,ownerFields:{identity:true,
  properties:[{xml:'Name'},{xml:'ObjectBelonging',optional:true}]}}]),
}));
const readers=recordOwnerFactSources(source,assembly,catalog);
const facts=readers.map(module=>({id:module.id,entry:module.id,xml:readFileSync(fixture,'utf8'),
 inputs:Object.fromEntries(Object.keys(module.inputs??{}).map(name=>[name,name==='component'?'cf':projection.ownerIdentity]))}));
facts.push({id:owner.id+'.file-identities',entry:'migration.predefined-catalog-file',xml:file,
 inputs:{owner:'cf/Справочник.СправочникСПредопределенными'}});
export const cases=[{id:'source-owner-catalog-predefined-file-cf',entry:owner.id,xml:projection.xml,
 yaml:yaml.dump({Предопределенные:itemOrder(expected)},{noRefs:true}),noRaw:true,
 documents:[{path:['Ext','Predefined.xml'],xml:file}],
 resources:[{xml:['Ext','ObjectModule.bsl'],yaml:['МодульОбъекта.bsl']},
  {xml:['Ext','ObjectModule.bin'],yaml:['МодульОбъекта.bin']}],resourceGroups:[2],
 inputs:{state_adopted:false,state_component:'cf',state_owner:projection.ownerIdentity,
  state_compatibilityMode:'8.3.27',ordinary0_ownerName:'СправочникСПредопределенными',
  ordinary1_owner:projection.ownerIdentity,ordinary1_kind:'Catalog',ordinary1_name:'СправочникСПредопределенными'},
 factBindings:assembly.indexRequirements.bindings,factSourceEntries:facts.map(row=>row.id)}];
// Isolate the collection-presence contract with a valid empty external file.
// The owner and its Extended row come from the real extension fixture; child
// extension states remain a separately accepted collection contract.
const extensionFixture='e2e/fixtures/xml/cfe/all-extension/Catalogs/СправочникСПредопределенными.xml';
const [extensionProjection]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
 encoding:'utf8',input:JSON.stringify([{xml:extensionFixture,ownerFields:{identity:true,
  propertyStates:['Predefined'],properties:[{xml:'Name'},{xml:'ObjectBelonging'},
   {xml:'ExtendedConfigurationObject'}]}}]),
}));
const emptyFile=file.replace(/(<PredefinedData[^>]*>)[\s\S]*(<\/PredefinedData>)/,'$1$2');
if(/<Item\b/.test(emptyFile))throw new Error('Empty file variation retained items');
const extensionFacts=readers.map(module=>({id:module.id+'.extension',entry:module.id,
 xml:readFileSync(extensionFixture,'utf8'),inputs:Object.fromEntries(Object.keys(module.inputs??{})
 .map(name=>[name,name==='component'?'cfe':extensionProjection.ownerIdentity]))}));
facts.push(...extensionFacts);
cases.push({...cases[0],id:'source-owner-predefined-semantic-empty-cfe',xml:extensionProjection.xml,
 yaml:'Предопределенные: {}\n',documents:[{path:['Ext','Predefined.xml'],xml:emptyFile}],
 inputs:{...cases[0].inputs,state_adopted:true,state_component:'cfe',
 state_owner:extensionProjection.ownerIdentity,state_compatibilityMode:'Version8_3_27',
 ordinary1_owner:extensionProjection.ownerIdentity},factSourceEntries:extensionFacts.map(row=>row.id)});
const absentXML=extensionProjection.xml.replace(/<[^>]*PropertyState>[\s\S]*?<\/[^>]*PropertyState>/g,'')
 .replace(/<((?:\w+:)?InternalInfo)>\s*<\/[^>]*InternalInfo>/,'<$1/>');
cases.push({...cases.at(-1),id:'source-owner-predefined-semantic-absent-cfe',xml:absentXML,
 yaml:'',documents:[]});

const local=new Map([...catalog,...readers.map(row=>[row.id,row]),...assembly.modules.map(row=>[row.id,row]),[owner.id,owner]]);
const selected=selectContracts({cases,factSources:facts},local,cases.map(row=>row.id));
export const declarations=selected.modules;
export const factSources=selected.manifest.factSources;
