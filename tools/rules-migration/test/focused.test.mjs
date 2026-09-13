import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectContracts} from '../src/focused-catalog.mjs';

const leaf={id:'leaf',kind:'value'};
const shared={id:'shared',imports:{leaf:'leaf'}};
const a={id:'a',kind:'object',imports:{shared:'shared'},value:{kind:'record',fields:[{name:'first'}]}};
const b={id:'b',kind:'object',imports:{shared:'shared'},value:{kind:'record',fields:[{name:'second'}]}};
const catalog=new Map([leaf,shared,a,b,{id:'unused'}].map(m=>[m.id,m]));
const manifest={cases:[{id:'one',entry:'a',yaml:'independent',rejectedYAML:['bad']},{id:'two',entry:'b'}],factSources:[{entry:'unused'}]};

test('selection keeps full expectations and shared transitive dependencies without mutation',()=>{
 const before=JSON.stringify([...catalog]);
 const selected=selectContracts(manifest,catalog,['two','one']);
 assert.deepEqual(selected.modules.map(m=>m.id),['a','b','leaf','shared']);
 assert.deepEqual(selected.manifest.cases,manifest.cases);
 assert.deepEqual(selected.manifest.factSources,[]);
 assert.equal(selected.propertyCount,2);
 assert.equal(JSON.stringify([...catalog]),before);
});

test('selection fails closed for empty, repeated, unknown cases and missing imports',()=>{
 for(const ids of [[],['missing'],['one','one']])assert.throws(()=>selectContracts(manifest,catalog,ids));
 assert.throws(()=>selectContracts(manifest,new Map([['a',a]]),['one']),/dependency/);
});

test('bound facts retain providers and their dependencies; compose fields are counted once per entry',()=>{
 const provider={id:'producer',imports:{leaf:'leaf'},contributions:[{index:'index'}]};
 const fragment={id:'fragment',value:{kind:'record',fields:[{name:'nested'}]}};
 const modules=new Map([...catalog,['producer',provider],['fragment',fragment],['a',{...a,imports:{part:'fragment'},compose:[{use:'part'}]}]]);
 const source={entry:'producer',xml:'source'};
 const input={...manifest,cases:[{...manifest.cases[0],factBindings:{lookup:'index'}}],factSources:[source,{entry:'unused'}]};
 const selected=selectContracts(input,modules,['one']);
 assert.deepEqual(selected.manifest.factSources,[source]);
 assert.equal(selected.propertyCount,2);
 assert(selected.modules.some(m=>m.id==='producer'));
 assert(!selected.modules.some(m=>m.id==='unused'));
 assert.throws(()=>selectContracts({...input,factSources:[]},modules,['one']),/fact/);
});

test('import cycles terminate; composition cycles and duplicate fields fail',()=>{
 const modules=new Map([...catalog,['shared',{...shared,imports:{back:'a'}}]]);
 assert.equal(selectContracts(manifest,modules,['one']).modules.length,2);
 const recursive={...a,imports:{self:'a'},compose:[{use:'self'}]};
 assert.throws(()=>selectContracts(manifest,new Map([['a',recursive]]),['one']),/cycle/);
 const duplicate={...a,imports:{part:'b'},compose:[{use:'part'}]};
 assert.throws(()=>selectContracts(manifest,new Map([['a',duplicate],['b',{...b,imports:{},value:a.value}]]),['one']),/Duplicate field/);
});

import {mkdtempSync,statSync,rmSync,writeFileSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {writeFocused} from '../src/focused-output.mjs';

test('unchanged catalogs keep timestamps; expectation edits do not rebuild declarations',()=>{
 const directory=mkdtempSync(join(tmpdir(),'nkdk-focused-'));
 try {
  const files={'one.yaml':'id: one\n'};
  const result=writeFocused(directory,files,{cases:[{id:'one',yaml:'expected'}]});
  const state=join(result.catalog,'manifest.json'),before=statSync(state).mtimeMs;
  writeFocused(directory,files,{cases:[{id:'one',yaml:'changed'}]});
  assert.equal(statSync(state).mtimeMs,before);
  writeFileSync(join(result.catalog,'extra.yaml'),'unexpected');
  assert.throws(()=>writeFocused(directory,files,{cases:[]}),/unowned candidate/);
  rmSync(join(result.catalog,'extra.yaml'));
  rmSync(result.cases);symlinkSync(state,result.cases);
  assert.throws(()=>writeFocused(directory,files,{cases:[]}),/Unsafe generated output/);
  rmSync(result.cases);
  writeFileSync(join(result.catalog,'one.yaml'),'edited');
  assert.throws(()=>writeFocused(directory,files,{cases:[]}),/modified candidate/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});
