import { exposedRules,dataPath } from '../src/exposed-rules.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extract } from '../src/extract.mjs';
import { stateContributionsFor } from '../src/state-contributions.mjs';
import { compare } from '../src/compare.mjs';
import { fragmentValue, composedValue } from '../src/reviewed-helpers.mjs';

test('static extraction retains fragments, shadowing, unknowns and comparison failures', () => {
  const sources = {
    'base.ts': `export function rule(type, params = {}) { return {type, ...params}; }
      export const base = {flag: rule('boolean', {defaultValueXML: true})};`,
    'rules.ts': `import {base as shared, rule as make} from './base';
      export const Rules = {properties: {...shared, flag: make('boolean', {defaultValueXML:false}), name: make('string', {defaultValue: ({name}) => name})}};
      export const BrokenRules = {properties: {...external(), known: make('string')}};
      const recursive = recursive; export const CycleRules = {properties: {...recursive}};
      function unsafe() { mutate(); return {hidden: make('string')}; }
      export const UnsafeRules = {properties: {...unsafe()}};`,
  };
  const workspace = extract({
    'packages/runtime/rule-kit.ts': `export {targets} from './targets';`,
    'packages/runtime/targets.ts': `export const targets=[['Document'],['ExternalDataSource','Table']] as const;`,
    'owner.ts': `import {targets} from '@nkdk/runtime/rule-kit'; export const WorkspaceRules={properties:{basedOn:{type:'MetadataItemLinks',metadataTarget:{kind:'object',allowedObjectPaths:targets}}}};`,
  },[{path:'owner.ts',symbol:'WorkspaceRules'}]);
  assert.deepEqual(workspace[0].properties[0].parameters.metadataTarget.allowedObjectPaths,[['Document'],['ExternalDataSource','Table']]);
  const defaults=extract({'defaults.ts':`let mutable='x'; export const DefaultsRules={properties:{
    known:{type:'UsePurposes',defaultValue:()=>['PlatformApplication']},
    context:{type:'string',defaultValue:({name})=>name},
    call:{type:'string',defaultValue:()=>runtime()},
    async:{type:'string',defaultValue:async()=>['x']},
    mutable:{type:'string',defaultValue:()=>mutable},
    converter:{type:'boolean',toYAML:()=>false}
  }};`},[{path:'defaults.ts',symbol:'DefaultsRules'}]);
  assert.equal(defaults[0].properties[0].status,'static-parameters');
  assert.deepEqual(defaults[0].properties[0].constantDefaults,['defaultValue']);
  assert.deepEqual(defaults[0].properties[0].parameters.defaultValue.$constantFunction.value,['PlatformApplication']);
  assert.equal(defaults[0].properties[0].parameters.defaultValue.$constantFunction.source.path,'defaults.ts');
  assert.ok(defaults[0].properties.slice(1).every(property=>property.status==='requires-expression-mapping'));
  const entries = extract(sources, [{path: 'rules.ts', symbol: 'Rules'}, {path: 'rules.ts', symbol: 'BrokenRules'},
    {path: 'rules.ts', symbol: 'CycleRules'}, {path: 'rules.ts', symbol: 'UnsafeRules'}]);
  assert.deepEqual(entries[0].properties.map(p => p.name), ['flag', 'name']);
  assert.equal(entries[0].properties[0].parameters.defaultValueXML, false);
  assert.equal(entries[0].properties[0].type, 'boolean');
  assert.equal(entries[0].properties[1].status, 'requires-expression-mapping');
  assert.equal(entries[0].overrides[0].name, 'flag');
  assert.ok(entries[0].fragments.length);
  assert.equal(entries[1].shapeComplete, false);
  assert.equal(entries[1].properties[0].name, 'known');
  assert.ok(entries[2].blockers.length);
  assert.equal(entries[3].shapeComplete, false);
  assert.equal(compare(entries[0], {status:'loaded', keys:['flag','name']}).status, 'keys-match');
  assert.equal(compare(entries[0], {status:'loaded', keys:['flag','missing']}).status, 'mismatch');
  assert.equal(compare(entries[0], {status:'load-error', error:'failed'}).status, 'load-error');
  assert.equal(compare(entries[1], {status:'loaded', keys:['known']}).status, 'blocked');
  const transformed = extract({'map.ts': `const base={one:{type:'boolean'},two:{type:'string'}};
    export const MappedRules={properties:Object.fromEntries(Object.entries(base).map(([key,property])=>[key,{...property,runtimeOnly:true}]))};
    export const UnsafeMappedRules={properties:Object.fromEntries(Object.entries(base).map(([key,property])=>{ mutate(); return [key,property]; }))};
    const Object={entries: unknown}; export const ShadowedRules={properties:Object.entries(base)};`},
    [{path:'map.ts',symbol:'MappedRules'}]);
  // A shadowed Object is deliberately unresolved, even when a builtin has the same spelling.
  assert.equal(transformed[0].shapeComplete,false);
  const mapped = extract({'map.ts': `const base={one:{type:'boolean'},two:{type:'string'}};
    export const MappedRules={properties:Object.fromEntries(Object.entries(base).map(([key,property])=>[key,{...property,runtimeOnly:true}]))};
    export const UnsafeMappedRules={properties:Object.fromEntries(Object.entries(base).map(([key,property])=>{ mutate(); return [key,property]; }))};`},
    [{path:'map.ts',symbol:'MappedRules'},{path:'map.ts',symbol:'UnsafeMappedRules'}]);
  assert.equal(mapped[0].shapeComplete,true);
  assert.deepEqual(mapped[0].properties.map(p=>[p.name,p.parameters.type,p.parameters.runtimeOnly]),[['one','boolean',true],['two','string',true]]);
  assert.equal(mapped[1].shapeComplete,false);
  const rest = extract({'rest.ts': `const base={root:{type:'string'},one:{type:'boolean'},two:{type:'string'}};
    const {root: unused,...remaining}=base;
    export const RestRules={properties:remaining};`},[{path:'rest.ts',symbol:'RestRules'}]);
  assert.equal(rest[0].shapeComplete,true);
  assert.deepEqual(rest[0].properties.map(p=>p.name),['one','two']);
  const nestedSource={'nested.ts': `const ChildRules={properties:{x:{type:'string'}}}; export const OwnerRules={properties:{},childCollections:[{itemRule:ChildRules}]};`};
  const nested=extract(nestedSource,[{path:'nested.ts',symbol:'ChildRules'},{path:'nested.ts',symbol:'OwnerRules'}]);
  const exposed=exposedRules(nestedSource,nested);
  assert.deepEqual(exposed[0].via,{export:'OwnerRules',path:['childCollections',0,'itemRule']});
  assert.equal(dataPath({children:[{value:42}]},['children',0,'value']),42);
  assert.throws(()=>dataPath({get hidden(){throw new Error('must not run');}},['hidden']),/Not a data property/);
  const namespaced=extract({'fragment.ts':`export const fields={x:{type:'string'}};`,'barrel.ts':`export * as Shared from './fragment';`,'childRules.ts':`import {Shared} from './barrel'; export const ChildRules={properties:Shared.fields};`},[{path:'childRules.ts',symbol:'ChildRules'}]);
  assert.equal(namespaced[0].shapeComplete,true);
  assert.equal(namespaced[0].properties[0].name,'x');
  const sliced=extract({'order.ts':`const order=['one','uuid','last'];const slot=order.indexOf('uuid');
    export const OrderedRules={xmlOrder:[...order.slice(0,slot),'extra',...order.slice(slot)],properties:{}};
    export const DynamicOrderRules={xmlOrder:order.slice(unknown),properties:{}};`},[{path:'order.ts',symbol:'OrderedRules'},{path:'order.ts',symbol:'DynamicOrderRules'}]);
  assert.deepEqual(sliced[0].xmlOrder,{status:'static',keys:['one','extra','uuid','last']});
  assert.equal(sliced[1].xmlOrder.status,'unresolved');
  assert.equal(compare(sliced[0],{status:'loaded',keys:[],xmlOrder:['one','extra','uuid','last']}).xmlOrderMatches,true);
  assert.equal(compare(sliced[0],{status:'loaded',keys:[],xmlOrder:['extra','one','uuid','last']}).status,'mismatch');
  const props = {kind:'object', complete:true, fields:new Map([['x', {value:{kind:'scalar', value:1}}]])};
  const order = {kind:'array', values:[{kind:'scalar', value:'x'}]};
  assert.equal(fragmentValue(order, props).kind, 'object');
  const base={...props,fields:new Map()};
  const fragment=fragmentValue(order,props);
  assert.equal(composedValue(base,[fragment]).fields.get('properties').value.fields.get('x').value.value,1);
  assert.equal(composedValue(base,[fragment,fragment]).reason,'duplicate-composed-property');
  assert.equal(composedValue({...base,complete:false},[fragment]).reason,'unknown-composition-input');
  assert.equal(fragmentValue({...order, values:[...order.values,...order.values]}, props).reason, 'invalid-fragment-keys');
  const changed = extract({
    'packages/rules/metadata/commonObjects/metadataRuleFragment.ts': 'export function metadataRuleFragment(a,b) { return {properties:b}; }',
    'changed.ts': `import {metadataRuleFragment} from './packages/rules/metadata/commonObjects/metadataRuleFragment';
      export const ChangedRules = metadataRuleFragment(['x'], {x:{type:'string'}});`,
  }, [{path:'changed.ts', symbol:'ChangedRules'}]);
  assert.equal(changed[0].shapeComplete, false);
  assert.equal(changed[0].blockers[0].detail, 'reviewed-helper-changed');
});

// The source registry adds contracts outside rules.ts. Losing them must not
// turn a structurally complete rule into an accepted conversion candidate.
test('runtime state extraction retains profiles, compatibility patches and order', () => {
  const contributions=[
    {id:'shared',profile:{properties:{label:{modes:['extend']}}}},
    {id:'item:A',item:{itemType:'A',profiles:['shared'],properties:{}}},
    {id:'item:B',item:{itemType:'B',profiles:[],properties:{}}},
    {id:'since',delta:{mode:'Version8_3_15',items:[
      {itemType:'A',properties:{base:{modes:['control','notify']}}},
      {itemType:'B',properties:{other:{modes:['extend']}}}
    ]}}
  ];
  const selected=stateContributionsFor(contributions,'A');
  assert.deepEqual(selected.map(c=>c.id),['shared','item:A','since']);
  assert.deepEqual(selected[2].delta.items.map(i=>i.itemType),['A']);
  assert.equal(contributions[3].delta.items.length,2);
  assert.deepEqual(stateContributionsFor(contributions,'unregistered'),[]);
  assert.throws(()=>stateContributionsFor([...contributions,contributions[1]],'A'),/Duplicate/);
  assert.throws(()=>stateContributionsFor(contributions.slice(1),'A'),/Missing profile/);
  assert.throws(()=>stateContributionsFor([{id:'item:A',item:{itemType:'A',profiles:[],properties:{bad:()=>1}}}],'A'),/data/);
  const [entry]=extract({'rules.ts':`export const Rules={itemType:'A',properties:{}};`},[{path:'rules.ts',symbol:'Rules'}]);
  assert.equal(entry.itemType,'A');
  assert.equal(compare(entry,{status:'loaded',keys:[],itemType:'B'}).status,'mismatch');
});
