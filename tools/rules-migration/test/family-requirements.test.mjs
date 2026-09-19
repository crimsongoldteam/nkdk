import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {emitFamilyProperties,familyRequirements,legacyCases,parseFamilySelectionArgs,reportFamily,selectFamily} from '../src/family-requirements.mjs';

test('family requirements retain transitive fields, provenance and unresolved dependencies', () => {
  const parent = {path:'parent.ts',symbol:'ParentRules'};
  const child = {path:'child.ts',symbol:'OverrideRules'};
  const source = {path:'shared.ts',line:12,column:3};
  const extraction = {sourceHashes:[{path:'shared.ts',sha256:'abc'}],entries:[
    {...parent,shapeComplete:true,properties:[{name:'items',type:'Items',source,parameters:{},status:'static-parameters'}]},
    {...child,shapeComplete:true,properties:[{name:'title',type:'string',source,parameters:{},status:'static-parameters'},
      {name:'computed',type:'Custom',source,parameters:{},status:'requires-review'}]},
  ]};
  const edge = {owner:parent,item:child,property:'items',mapping:{keyField:'title'},context:{ownerFactRole:'items'},blockers:[]};
  const graph = {edges:[edge],unresolved:[]};
  const selection = [{id:'items',role:'accept-first',...parent}];
  const result = familyRequirements(extraction,graph,selection);
  const family = result.families[0];
  assert.deepEqual(family.entries.map(e=>e.symbol),['ParentRules','OverrideRules']);
  assert.equal(family.collections[0].mapping.keyField,'title');
  assert.equal(family.properties.length,3);
  const childFamily = familyRequirements(extraction,graph,[{...selection[0],...child}]).families[0];
  assert.deepEqual(childFamily.ownerConnections,[edge]);
  assert.deepEqual(family.sourceHashes,extraction.sourceHashes);
  assert.deepEqual(family.commonTypes,['Custom','string']);
  assert.ok(family.blockers.some(b=>b.reason==='requires-expression-mapping' && b.property==='computed'));
  assert.ok(result.blockers.length > 0);
  for (const broken of [
    {...extraction,entries:extraction.entries.slice(0,1)},
    {...extraction,entries:[]},
  ]) assert.ok(familyRequirements(broken,graph,selection).blockers.some(b=>b.reason==='missing-source-entry'));
  const cycle = {owner:child,item:parent,property:'nested',blockers:[]};
  const cyclic = familyRequirements(extraction,{...graph,edges:[edge,cycle]},selection);
  assert.equal(cyclic.families[0].entries.length,2);
  const unlinked = familyRequirements(extraction,{...graph,edges:[{...edge,blockers:['unresolved-property-item-rule-override']}]},selection);
  assert.ok(unlinked.blockers.some(b=>b.reason==='unresolved-property-item-rule-override'));
});

test('shared legacy tests are linked through imports without duplicated or silently lost cases',()=>{
  const file={path:'tests/shared.ts',sha256:'new',imports:[{resolved:'elements/field/__fixtures__/data.ts'}],
    tests:[{title:'table',source:{line:4,column:2},tableRows:3,table:'[first, second, third]'}]};
  const family={id:'first',path:'elements/field/rules.ts',properties:[]};
  const old={id:'tests/shared.ts:4:2',sha256:'old',newChecks:['existing'],status:'mapped'};
  const result=legacyCases({files:[file]},[family,{...family,id:'second'}],{cases:[old],staleCases:[]});
  assert.equal(result.cases.length,1);
  assert.deepEqual(result.cases[0].families,['first','second']);
  assert.equal(result.cases[0].tableRows,3);
  assert.equal(result.cases[0].status,'review-required');
  assert.deepEqual(result.staleCases,[old]);
  assert.deepEqual(legacyCases({files:[file]},[family],result).staleCases,[old]);
});

test('document attribute family report retains all fields and override parameters',()=>{
  const read=name=>JSON.parse(readFileSync(`tests/migration/${name}.json`,'utf8'));
  const family=familyRequirements(
    read('rules-extraction'),
    read('collection-links'),
    read('unified-families'),
  ).families.find(item=>item.id==='document-attributes');
  const report=reportFamily(family);
  assert.deepEqual(report.properties.map(property=>property.name),[
    'objectBelonging','name','synonym','comment','type','passwordMode','format',
    'editFormat','toolTip','markNegatives','mask','multiLine','extendedEdit',
    'minValue','maxValue','fillFromFillingValue','fillValue','fillChecking',
    'choiceFoldersAndItems','choiceParameterLinks','choiceParameters','quickChoice',
    'createOnInput','choiceForm','linkByType','choiceHistoryOnInput','indexing',
    'fullTextSearch','dataHistory','binaryDataStorageLocationUseField','uuid',
  ]);
  assert.deepEqual(report.properties.find(property=>property.name==='type').parameters.allowedTypes,[
    'string','decimal','date','boolean','ValueStorage','UUID','CatalogRef','CatalogRef.*',
    'DocumentRef','DocumentRef.*','EnumRef','EnumRef.*','ChartOfCharacteristicTypesRef',
    'ChartOfCharacteristicTypesRef.*','ChartOfAccountsRef','ChartOfAccountsRef.*',
    'ChartOfCalculationTypesRef','ChartOfCalculationTypesRef.*','BusinessProcessRef',
    'BusinessProcessRef.*','BusinessProcessRoutePointRef','BusinessProcessRoutePointRef.*',
    'TaskRef','TaskRef.*','ExchangePlanRef','ExchangePlanRef.*','AnyIBRef','DefinedType.*',
    'Characteristic.*','ExternalDataSourceTableRef.*','ExternalDataSourceCubeDimensionTableRef.*',
  ]);
  assert.equal(report.properties.find(property=>property.name==='synonym').parameters.excludeIfEqualNameYAML,true);
  assert.equal(report.properties.find(property=>property.name==='fillValue').parameters.exportNilValue,true);
  assert.equal(report.properties.find(property=>property.name==='objectBelonging').parameters.implicitValueYAML,'Native');
});

test('family selection returns one exact report and rejects an unknown family',()=>{
  const report={families:[{id:'enum-values'},{id:'document-attributes'}]};
  assert.deepEqual(selectFamily(report,'document-attributes'),[{id:'document-attributes'}]);
  assert.throws(()=>selectFamily(report,'missing'),/Unknown migration family: missing/);
});

test('family CLI accepts the pnpm argument separator',()=>{
  assert.equal(parseFamilySelectionArgs(['--','--family','document-attributes']),'document-attributes');
  assert.equal(parseFamilySelectionArgs([]),undefined);
  assert.throws(()=>parseFamilySelectionArgs(['--family']),/Usage: migration:families/);
});

test('family emission evaluates an implicit named-collection key in its owner context',()=>{
  const property={owner:{path:'child.ts',symbol:'ChildRules'},name:'name',status:'static-parameters',parameters:{type:'string',xml:'Name',required:true}};
  const family={path:'child.ts',symbol:'ChildRules',properties:[property],ownerConnections:[{mapping:{yamlAsArray:false,keyField:'name'}}],blockers:[]};
  emitFamilyProperties(family,new Map([['common.string',{}]]));
  assert.equal(property.emission.status,'candidate');
  assert.equal(property.emission.key,'name');
});
