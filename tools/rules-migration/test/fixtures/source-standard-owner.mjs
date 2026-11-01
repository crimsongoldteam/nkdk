import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {candidateCatalog,yaml} from '../../src/candidate-catalog.mjs';
import {assembleRecordStateOwner} from '../../src/source-record-owner.mjs';
import {bindPreparedOwnerIndexes} from '../../src/owner-index-requirements.mjs';
import {cases as inputCases,declarations as inputDeclarations,factSources as inputSources} from './source-input-owner.mjs';
import {selectContracts,providedIndexes} from '../../src/focused-catalog.mjs';

const {catalog}=candidateCatalog();
const original=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries
 .find(row=>row.symbol==='MetadataCatalogRules');
const source={...original,properties:original.properties.filter(row=>[
 'xmlRoot','inputByString','codeLength','descriptionLength','codeType',
 'codeAllowedLength','extendedConfigurationObject','standardAttributes',
].includes(row.name))};
const assembly=assembleRecordStateOwner(source,catalog,{id:'test.source-standard-owner'});
const owner=bindPreparedOwnerIndexes(assembly.owner,assembly.indexRequirements);
const contract=JSON.parse(readFileSync('tests/migration/rules-contract-cases.json'));
const accepted=contract.cases.find(row=>row.id==='standard-attribute-family-catalog');
const input=inputCases.find(row=>!row.inputs.state_adopted);
if(!accepted || !input)throw new Error('Missing independently accepted catalog expectations');
const fixture=accepted.source.find(row=>row.path.endsWith('.xml')).path;
const full=readFileSync(fixture,'utf8');
const [projection]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
 encoding:'utf8',input:JSON.stringify([{xml:fixture,
  ownerFields:{properties:['CodeLength','DescriptionLength','CodeType','CodeAllowedLength',
   'InputByString','StandardAttributes'].map(xml=>({xml}))}}]),
}));
const xml=projection.xml.replace('<ns0:MetaDataObject ','<ns0:MetaDataObject version="2.20" ');
// This owner's lengths, CodeType and default InputByString are omitted in the
// independently accepted YAML. Its policy inputs belong to the same XML owner.
const expected=yaml.load(accepted.yaml);
const scope={...input.inputs,state_name:projection.ownerPath.slice(projection.ownerPath.indexOf('.')+1),state_owner:projection.ownerIdentity};
if(scope.state_name!==accepted.inputs.ownerName)throw new Error('Standard policy and source owner differ');
const ordered={};
for(const key of ['ВводПоСтроке','ДлинаКода','ДлинаНаименования','СтандартныеРеквизиты','ТипКода'])
 if(Object.hasOwn(expected,key))ordered[key]=expected[key];
export const cases=[{id:'source-owner-catalog-standard-and-input',entry:owner.id,xml,
 yaml:yaml.dump(ordered,{noRefs:true}),noRaw:true,
 inputs:{...scope,...Object.fromEntries(Object.entries(accepted.inputs).map(([name,value])=>['standard_'+name,value]))},
 factBindings:assembly.indexRequirements.bindings}];
const [withoutStandard]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
 encoding:'utf8',input:JSON.stringify([{xml:fixture,ownerFields:{
  properties:['CodeLength','DescriptionLength','CodeType','CodeAllowedLength','InputByString'].map(xml=>({xml})),
 }}]),
}));
cases.push({...cases[0],id:'source-owner-catalog-standard-absent',
 xml:withoutStandard.xml.replace('<ns0:MetaDataObject ','<ns0:MetaDataObject version="2.20" '),yaml:''});
const indexes=new Set(['metadata.roots','metadata.forms']);
const inputIds=new Set(input.factSourceEntries);
const sources=[...inputSources.filter(row=>inputIds.has(row.id)).map((row,index)=>({
 ...row,id:`${owner.id}.input.${index}`,xml:full,
 inputs:Object.fromEntries(Object.entries(row.inputs??{}).map(([key,value])=>[key,
  value===input.inputs.state_owner?scope.state_owner:value===input.inputs.state_name?scope.state_name:value])),
})),
 ...contract.factSources.filter(row=>providedIndexes(catalog,row.entry).some(index=>indexes.has(index)))
  .map((row,index)=>({...row,id:`${owner.id}.reference.${index}`}))];
const formFolder=fixture.replace(/\.xml$/, '/Forms');
const formPaths=readdirSync(formFolder).filter(name=>name.endsWith('.xml')).sort().map(name=>`${formFolder}/${name}`);
const forms=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
 encoding:'utf8',input:JSON.stringify(formPaths.map(xml=>({xml,formHeader:true}))),
}));
for(const form of forms)sources.push({id:`${owner.id}.form.${form.name}`,entry:'migration.form-metadata-header',xml:form.xml,
 inputs:{parent:scope.state_owner,name:form.name,identity:form.identity,defaultLanguage:'ru',registeredLanguages:['ru','en']}});
for(const row of cases)row.factSourceEntries=sources.map(source=>source.id);
const all=[...inputDeclarations,...assembly.modules.filter(row=>row!==assembly.owner),owner];
const local=new Map([...catalog,...all.map(row=>[row.id,row])]);
const selected=selectContracts({cases,factSources:sources},local,cases.map(row=>row.id));
export const declarations=selected.modules;
export const factSources=selected.manifest.factSources;
