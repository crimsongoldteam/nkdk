import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collectionLinks} from '../src/collection-links.mjs';
import {extract} from '../src/extract.mjs';

const factory='packages/rules/metadata/ruleRuntime/metadataCollection/ruleFactory.ts';
const rules='packages/rules/metadata/example/rules.ts';
const registration='packages/rules/metadata/example/register.ts';
const sources={
  [factory]:'export const defineMetadataItemCollectionRule = (params) => params;',
  [rules]:`export const ChildRules={properties:{name:{type:'string'}}};
    export const ParentRules={properties:{one:{type:'One',yaml:'Items',xml:'Item',xmlParents:['Children'],ownerFactRole:'items'},two:{type:'Two'}}};`,
  [registration]:`import {defineMetadataItemCollectionRule as collection} from '../ruleRuntime/metadataCollection/ruleFactory';
    import {ChildRules as Item} from './rules';
    const types=['One',['Two','Schema']] as const;
    export const registered=types.map(entry=>{
      const propertyType=typeof entry==='string'?entry:entry[0];
      const schemaName=propertyType.replace(/One$/, 'Item');
      return collection({schemaName,propertyType,itemRule:Item,xmlElement:'Item',keyField:'name'});
    });`,
};
const requests=['ChildRules','ParentRules'].map(symbol=>({path:rules,symbol}));

test('collection graph resolves aliases and static families without executing registrations',()=>{
  const entries=extract(sources,requests), graph=collectionLinks(sources,entries);
  assert.deepEqual(graph.unresolved,[]);
  assert.deepEqual(graph.edges.map(e=>[e.type,e.item.symbol,e.status]),[['One','ChildRules','linked-structure'],['Two','ChildRules','linked-structure']]);
  assert.equal(graph.edges[0].context.ownerFactRole,'items');
  assert.equal(graph.registrations[0].parameters.schemaName,'Item');
  const overridden={...sources,[rules]:sources[rules].replace("type:'One',yaml","type:'One',itemRule:AlternateRules,yaml")+`\nexport const AlternateRules={properties:{label:{type:'string'}}};`};
  const overrideEntries=extract(overridden,[...requests,{path:rules,symbol:'AlternateRules'}]);
  const overrideEdge=collectionLinks(overridden,overrideEntries).edges[0];
  assert.deepEqual(overrideEdge.blockers,[]);
  assert.equal(overrideEdge.item.symbol,'AlternateRules');
  assert.deepEqual(graph.edges[0].mapping.xmlParents,['Children']);
  const duplicate={...sources,[registration]:sources[registration]+`\ncollection({propertyType:'One',itemRule:Item});`};
  assert.ok(collectionLinks(duplicate,entries).edges[0].blockers.includes('ambiguous-registration'));
  const dynamic={...sources,[registration]:sources[registration].replace("const types=['One',['Two','Schema']] as const;","const types=loadTypes();")};
  assert.ok(collectionLinks(dynamic,entries).unresolved.some(r=>r.reason==='unresolved-property-type'));
  const foreign={...sources,[registration]:sources[registration].replace("'../ruleRuntime/metadataCollection/ruleFactory'","'./foreign'"),
    'packages/rules/metadata/example/foreign.ts':sources[factory]};
  assert.equal(collectionLinks(foreign,entries).registrations.length,0);
});
