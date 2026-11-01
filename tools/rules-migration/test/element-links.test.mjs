import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extract} from '../src/extract.mjs';
import {loadSources} from '../src/source-snapshot.mjs';
import {elementLinks} from '../src/element-links.mjs';

const factory='packages/runtime/metadata/ruleRuntime/formElement/ruleFactory.ts';
const rule='packages/rules/metadata/forms/example/rules.ts';
const sources={
  [factory]:'export const defineElementAsType=params=>params;',
  [rule]:`import {defineElementAsType as register} from '../../../../runtime/metadata/ruleRuntime/formElement/ruleFactory';
    export const PanelRules={itemType:'Panel',properties:{flag:{type:'boolean'}}};
    export const ParentRules={properties:{panel:{type:'FixedPanel',xml:'Panel',yaml:'Панель'}}};
    const identity={canonicalSuffix:'Панель',referenceSuffixes:['Панель','Panel'],canonicalNameMode:'fixed',explicitXMLName:true};
    export const layer=register({propertyType:'FixedPanel',elementRule:PanelRules,nameStyle:identity,directId:'-1',toXML:()=>({id:'-1',name:'Панель'})});`,
};
const requests=['PanelRules','ParentRules'].map(symbol=>({path:rule,symbol}));

test('element registration graph links literal names and identities without executing factories',()=>{
  const entries=extract(sources,requests),graph=elementLinks(sources,entries);
  assert.deepEqual(graph.unresolved,[]);
  assert.equal(graph.registrations.length,1);
  assert.deepEqual(graph.registrations[0].item,{path:rule,symbol:'PanelRules'});
  assert.equal(graph.registrations[0].parameters.nameStyle.explicitXMLName,true);
  assert.equal(graph.registrations[0].parameters.directId,'-1');
  assert.deepEqual(graph.registrations[0].constantOutput,{id:'-1',name:'Панель'});
  assert.equal(graph.registrations[0].callbacks.toXML.$unresolved.kind,'expression');
  assert.deepEqual(graph.edges[0].mapping,{xml:'Panel',xmlParents:[],yaml:'Панель'});
  assert.equal(graph.edges[0].status,'linked-structure');
  const variants=[
    [sources[rule]+'\nregister({propertyType:"FixedPanel",elementRule:PanelRules});','ambiguous-registration'],
    [sources[rule].replace("directId:'-1'","directId:runtime()"),'registration-expressions'],
    [sources[rule].replace("directId:'-1'","directId:'-1',extraMode:true"),'unsupported-registration-parameter'],
    [sources[rule].replace('register({propertyType', 'register({...unknown(),propertyType'),'incomplete-registration'],
  ];
  for(const [text,reason] of variants) {
    const changed={...sources,[rule]:text};
    const result=elementLinks(changed,extract(changed,requests));
    assert(result.edges[0].blockers.includes(reason),reason);
  }
  const foreign={...sources,[rule]:sources[rule].replace('../../../../runtime/metadata/ruleRuntime/formElement/ruleFactory','./foreign'),
    'packages/rules/metadata/forms/example/foreign.ts':sources[factory]};
  assert.equal(elementLinks(foreign,extract(foreign,requests)).registrations.length,0);
});

test('actual singleton registrations retain fixed and owner suffix names and unresolved callbacks',()=>{
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const graph=elementLinks(loadSources(extraction.sourceHashes),extraction.entries);
  const panels=graph.registrations.filter(row=>['AutoCommandBar','TableAutoCommandBar'].includes(row.type));
  assert.equal(panels.length,2);
  assert.deepEqual(panels.map(row=>row.parameters.nameStyle),[
    {canonicalSuffix:'ФормаКоманднаяПанель',referenceSuffixes:['ФормаКоманднаяПанель','FormCommandBar'],canonicalNameMode:'fixed',explicitXMLName:true},
    {canonicalSuffix:'КоманднаяПанель',referenceSuffixes:['КоманднаяПанель','CommandBar'],canonicalNameMode:'ownerSuffix',explicitXMLName:true},
  ]);
  assert.deepEqual(panels[0].constantOutput,{id:'-1',name:'ФормаКоманднаяПанель'});
  assert.equal(panels[1].constantOutput,undefined);
  assert.equal(panels[1].callbacks.toXML.$unresolved.kind,'expression');
  assert(graph.edges.some(edge=>edge.type==='AutoCommandBar' && edge.owner.symbol==='ClientApplicationFormRules'));
  assert(graph.edges.some(edge=>edge.type==='TableAutoCommandBar'));
  assert(graph.registrations.every(row=>row.parameters.nameStyle && !row.issues.length));
  assert.match(graph.scope,/not executable/);
});
