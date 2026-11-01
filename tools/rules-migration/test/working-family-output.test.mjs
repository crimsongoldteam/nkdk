import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workingFamilyOutput} from '../src/working-family-output.mjs';

test('working family preserves shared imports, fact roots and independent expectations',()=>{
  const shared={id:'shared',kind:'value'};
  const fragment={id:'candidate.part',kind:'fragment',imports:{shared:'shared'}};
  const owner={id:'candidate.owner',kind:'object',imports:{part:fragment.id},compose:[{use:'part'}]};
  const facts={id:'candidate.facts',kind:'object',contributions:[{index:'names'}]};
  const example={id:'example',entry:owner.id,xml:'<Root/>',yaml:'Значение: 1',factSourceEntries:['source']};
  const source={id:'source',entry:facts.id,xml:'<Root/>'};
  const ownerRequirements=[{property:'rows',indexAddressing:'yamlPath'}];
  const generated={modules:[owner,fragment,facts],cases:[example],factSources:[source],ownerRequirements};
  const result=workingFamilyOutput(generated,
    new Map([[shared.id,shared]]),{rename:module=>module.id.replace('candidate.','working.'),scope:'test'});
  assert.equal(result.declarations.length,3);
  assert.deepEqual(result.declarations.find(module=>module.id==='working.owner').imports,{part:'working.part'});
  assert.deepEqual(result.declarations.find(module=>module.id==='working.part').imports,{shared:'shared'});
  assert.deepEqual(result.manifest.cases,[{...example,entry:'working.owner'}]);
  assert.deepEqual(result.manifest.factSources,[{...source,entry:'working.facts'}]);
  assert.deepEqual(result.manifest.ownerRequirements,ownerRequirements);
  assert.notEqual(result.manifest.ownerRequirements,ownerRequirements);
  assert.deepEqual(owner.imports,{part:fragment.id});
  const existing=new Map([[shared.id,shared],...result.declarations.map(row=>[row.id,row])]);
  const reused=workingFamilyOutput(generated,
    existing,{rename:module=>module.id.replace('candidate.','working.'),scope:'test'});
  assert.equal(reused.declarations.length,0);
  assert.deepEqual(reused.manifest,result.manifest);
  existing.set('working.part',{...existing.get('working.part'),imports:{shared:'different'}});
  assert.throws(()=>workingFamilyOutput({modules:[owner,fragment,facts],cases:[example],factSources:[source]},
    existing,{rename:module=>module.id.replace('candidate.','working.')}),/Ambiguous/);
});

test('working family rejects missing declarations and colliding generated identifiers',()=>{
  const generated={modules:[{id:'a',kind:'object'},{id:'b',kind:'object'}],
    cases:[{entry:'a'},{entry:'b'}],factSources:[]};
  assert.throws(()=>workingFamilyOutput(generated,new Map(),{rename:()=> 'same'}),/Ambiguous/);
  assert.throws(()=>workingFamilyOutput({...generated,cases:[{entry:'missing'}]},new Map(),
    {rename:module=>module.id}),/Missing working root/);
  assert.throws(()=>workingFamilyOutput(generated,new Map([['a',{id:'a',kind:'value'}]]),
    {rename:module=>module.id}),/shadows a different/);
});

test('common publication exposes library names without exporting owners or copying shared values',async()=>{
  const {commonFamilyOutput}=await import('../src/common-family-output.mjs');
  const shared={id:'common.shared',kind:'value'};
  const part={id:'candidate.part',kind:'fragment',imports:{shared:shared.id}};
  const value={id:'common.library',kind:'value',imports:{part:part.id},compose:[{use:'part'}]};
  const owner={id:'working.owner',kind:'object',imports:{value:value.id}};
  const catalog=new Map([[shared.id,shared]]);
  const generated={modules:[part,value,owner]};
  const result=commonFamilyOutput(generated,catalog);
  assert.deepEqual(result.declarations.map(row=>row.id),[value.id,part.id]);
  assert(!result.declarations.some(row=>row.kind==='object'));
  assert.equal(commonFamilyOutput(generated,new Map([...catalog,...result.declarations.map(row=>[row.id,row])])).declarations.length,0);
  assert.throws(()=>commonFamilyOutput(generated,new Map([...catalog,[value.id,{...value,imports:{part:'different'}}]])),/different contract/);
});

test('common publication includes dependencies added to the catalog during generation',async()=>{
  const {commonFamilyOutput}=await import('../src/common-family-output.mjs');
  const original={format:'nkdk-declarations/1',kind:'value',id:'common.original',value:{kind:'scalar',scalar:'text'}};
  const catalog=new Map([[original.id,original]]);
  const existingIds=new Set(catalog.keys());
  const transient={...original,id:'candidate.generated-list',imports:{item:original.id}};
  catalog.set(transient.id,transient);
  const root={...original,id:'common.new',imports:{rows:transient.id}};
  const result=commonFamilyOutput({modules:[root]},catalog,{existingIds});
  assert.deepEqual(result.declarations.map(row=>row.id).sort(),[transient.id,root.id].sort());
});
