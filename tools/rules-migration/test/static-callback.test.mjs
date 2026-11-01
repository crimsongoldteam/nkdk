import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import * as callback from '../src/static-callback.mjs';

function issue(expression){
 const sourceText=`const fn = ${expression};`;
 return {sourceText,unresolved:{$unresolved:{kind:'expression',expression,
  source:{path:'in-memory.ts',line:1,column:12},
  sourceHash:createHash('sha256').update(sourceText).digest('hex')}}};
}

test('constant callback specialization uses source AST and short-circuit semantics',()=>{
 const expression='(params) => { const selected = params.owner !== null && params.owner !== undefined && typeof params.owner === "object" ? params.owner.kind : undefined; return { _version: selected === "A" ? "one" : "other" }; }';
 const {unresolved,sourceText}=issue(expression);
 for(const [argument,expected] of [[{owner:{kind:'A'}},'one'],[{owner:{kind:'B'}},'other'],[{owner:null},'other'],[{},'other']])
  assert.deepEqual(callback.specializeStaticCallback(unresolved,argument,sourceText),{_version:expected});
 for(const expression of ['() => false && unknown()', '() => true || unknown()']){
  const row=issue(expression);
  assert.equal(callback.specializeStaticCallback(row.unresolved,{},row.sourceText),expression.includes('false')?false:true);
 }
});

test('predefined root attributes specialize four owner types without executing TypeScript',()=>{
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 const unresolved=extraction.entries.find(row=>row.symbol==='PredefinedRules').properties.find(row=>row.type==='XMLRoot').parameters.rootAttributes;
 for(const [itemType,expected] of [
  ['MetadataChartOfAccounts','ChartOfAccountsPredefinedItems'],
  ['MetadataChartOfCharacteristicTypes','PlanOfCharacteristicKindPredefinedItems'],
  ['MetadataChartOfCalculationTypes','CalculationTypePredefinedItems'],
  ['MetadataCatalog','CatalogPredefinedItems'],
  ['AnotherOwner','CatalogPredefinedItems'],
 ]){
  const attributes=callback.specializeStaticCallback(unresolved,{ownerMetadataItem:{itemType}});
  assert.equal(attributes['_xsi:type'],expected);
  assert.equal(attributes._xmlns,'http://v8.1c.ru/8.3/xcf/predef');
  assert.equal(attributes._version,'2.20');
 }
});

test('callback specialization rejects stale source and unsupported or changed expressions',()=>{
 const row=issue('(params) => ({_version: params.version})');
 const changed=structuredClone(row.unresolved);changed.$unresolved.expression='() => "changed"';
 assert.throws(()=>callback.specializeStaticCallback(changed,{},row.sourceText),/callback/);
 assert.throws(()=>callback.specializeStaticCallback(row.unresolved,{},row.sourceText+' '),/callback/);
 for(const argument of [{version:undefined},{version:NaN},{version:-0},{version:()=>1}])
  assert.throws(()=>callback.specializeStaticCallback(row.unresolved,argument,row.sourceText),/callback/);
 for(const expression of ['() => unknown()', 'async () => "value"', '() => { while(true) {} return "value"; }']){
  const entry=issue(expression);
  assert.throws(()=>callback.specializeStaticCallback(entry.unresolved,{},entry.sourceText),/callback/);
 }
});
