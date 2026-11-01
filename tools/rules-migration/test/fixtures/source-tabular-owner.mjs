import {recordOwnerFactSources} from '../../src/record-owner-fact-sources.mjs';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {candidateCatalog,yaml} from '../../src/candidate-catalog.mjs';
import {assembleRecordStateOwner} from '../../src/source-record-owner.mjs';
import {bindPreparedOwnerIndexes} from '../../src/owner-index-requirements.mjs';
import {selectContracts,mergeFactSources} from '../../src/focused-catalog.mjs';

const {catalog}=candidateCatalog();
const original=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries.find(row=>row.symbol==='MetadataCatalogRules');
const source={...original,properties:original.properties.filter(row=>['xmlRoot','uuid','name','extendedConfigurationObject','tabularSections'].includes(row.name))};
const assembly=assembleRecordStateOwner(source,catalog,{id:'test.source-tabular-owner'});
const owner=bindPreparedOwnerIndexes(assembly.owner,assembly.indexRequirements);
const matrix=JSON.parse(readFileSync('tests/migration/tabular-section-family-operation.json'));
const accepted=matrix.cases.filter(row=>row.id.startsWith('e2e-catalogs-tabular-section-')&&row.id.endsWith('-cf'));
if(accepted.length!==2)throw new Error('Missing full and minimal independent tabular expectations');
const fixture='e2e/fixtures/xml/cf/Catalogs/СправочникВладелец.xml';
const [projection]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
 encoding:'utf8',input:JSON.stringify([{xml:fixture,ownerFields:{identity:true,properties:[{xml:'Name'}],
 collection:{item:'TabularSection',xmlOnly:true}}}]),
}));
const expected=Object.fromEntries(accepted.map(row=>[row.inputs.itemName,yaml.load(row.yaml)]));
const inputs=Object.fromEntries(Object.entries(accepted[0].inputs).filter(([name])=>
 !['itemOwner','itemName','parentOwner','qualifiedName','kind'].includes(name)).map(([name,value])=>['tabularSections_'+name,value]));
Object.assign(inputs,{state_adopted:false,state_component:'cf',state_owner:projection.ownerIdentity,
 state_compatibilityMode:'8.3.27',ordinary0_ownerName:'СправочникВладелец',
 ordinary1_owner:projection.ownerIdentity,ordinary1_kind:'Catalog',ordinary1_name:'СправочникВладелец'});
const facts=new Set(accepted.flatMap(row=>row.factSourceEntries));
export const factSources=mergeFactSources(matrix.factSources.filter(row=>facts.has(row.id)),
 recordOwnerFactSources(source,assembly,catalog).map(module=>({id:module.id,entry:module.id,
 xml:readFileSync(fixture,'utf8'),inputs:Object.fromEntries(Object.keys(module.inputs??{}).map(name=>[name,
  name==='component'?'cf':projection.ownerIdentity]))})));
export const cases=[{id:'source-owner-catalog-tabular-collection-cf',entry:owner.id,xml:projection.xml,xmlQNamePaths:projection.xmlQNamePaths,
 yaml:yaml.dump({ТабличныеЧасти:expected},{noRefs:true}),inputs,
 factBindings:assembly.indexRequirements.bindings,factSourceEntries:factSources.map(row=>row.id),noRaw:true}];
const local=new Map([...catalog,...recordOwnerFactSources(source,assembly,catalog).map(row=>[row.id,row]),...assembly.modules.map(row=>[row.id,row]),[owner.id,owner]]);
const selected=selectContracts({cases,factSources},local,cases.map(row=>row.id));
export const declarations=selected.modules;
