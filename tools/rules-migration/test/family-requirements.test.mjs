import {test} from 'node:test';
import assert from 'node:assert/strict';
import {familyRequirements,legacyCases} from '../src/family-requirements.mjs';

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
