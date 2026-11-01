import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {yaml} from '../src/candidate-catalog.mjs';
import {selectContracts,mergeFactSources} from '../src/focused-catalog.mjs';

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
 const nested={id:'nested-payload',inputs:{unused:{index:'unused-index'}}};
 modules.set(nested.id,nested);
 const linkedProvider={...provider,imports:{...provider.imports,payload:nested.id},value:{kind:'record',fields:[{name:'payload',type:{use:'payload'}}]}};
 assert.deepEqual(selectContracts(input,new Map([...modules,['producer',linkedProvider]]),['one']).manifest.factSources,[source]);
 const intermediate={id:'intermediate',inputs:{base:{index:'base-index'}},contributions:[{index:'prepared-index'}]};
 const base={id:'base',contributions:[{index:'base-index'}]};
 modules.set('producer',{...provider,inputs:{prepared:{index:'prepared-index'}}});
 modules.set(intermediate.id,intermediate);modules.set(base.id,base);
 const upstream={entry:intermediate.id,yaml:'intermediate'},initial={entry:base.id,yaml:'base'};
 const chained={...input,cases:[{...input.cases[0],factSourceEntries:['producer','intermediate','base']}],factSources:[source,upstream,initial,{entry:'unused'}]};
 assert.deepEqual(selectContracts(chained,modules,['one']).manifest.factSources,[source,upstream,initial]);
 assert.throws(()=>selectContracts({...chained,cases:[{...chained.cases[0],factSourceEntries:['producer']}],factSources:[source]},modules,['one']),/Missing fact provider: prepared-index/);

});

test('fact source composed from a contributing fragment remains in a focused catalog',()=>{
 const fragment={id:'child-facts',contributions:[{index:'children'}],value:{kind:'record',fields:[]}};
 const composed={id:'composed-source',imports:{children:'child-facts'},compose:[{use:'children'}],value:{kind:'record',fields:[]}};
 const modules=new Map([...catalog,[fragment.id,fragment],[composed.id,composed]]);
 const selected=selectContracts({cases:[{id:'one',entry:'a',factBindings:{children:'children'}}],
   factSources:[{entry:composed.id,xml:'<Root/>'}]},modules,['one']);
 assert.deepEqual(selected.manifest.factSources,[{entry:composed.id,xml:'<Root/>'}]);
 const recursive={id:'recursive-source',imports:{child:composed.id,self:'recursive-source'},
  value:{kind:'sequence',item:{kind:'choice',variants:[{name:'leaf',type:{use:'child'}},
   {name:'branch',type:{kind:'record',fields:[{name:'next',type:{use:'self'}}]}}]}}};
 modules.set(recursive.id,recursive);
 const nested=selectContracts({cases:[{id:'one',entry:'a',factBindings:{children:'children'}}],
  factSources:[{entry:recursive.id,xml:'<Root/>'}]},modules,['one']);
 assert.deepEqual(nested.manifest.factSources,[{entry:recursive.id,xml:'<Root/>'}],
  'Facts from sequence items and choice branches remain providers, including recursive values');
});

test('a case can select the fact sources needed for its own index path',()=>{
 const first={id:'first-source',contributions:[{index:'children'}]};
 const second={id:'second-source',contributions:[{index:'children'}]};
 const modules=new Map([...catalog,[first.id,first],[second.id,second]]);
 const input={cases:[{id:'one',entry:'a',factBindings:{children:'children'},factSourceEntries:['first-source']}],
   factSources:[{entry:first.id,xml:'first'},{entry:second.id,xml:'second'}]};
 const selected=selectContracts(input,modules,['one']);
 assert.deepEqual(selected.manifest.factSources,[{entry:first.id,xml:'first'}]);
 assert(!selected.modules.some(module=>module.id===second.id));
 input.cases.push({id:'no-facts',entry:'b'});
 const mixed=selectContracts(input,modules,['one','no-facts']);
 assert.deepEqual(mixed.manifest.factSources,[{entry:first.id,xml:'first'}],
  'An unrelated case with no fact inputs must not broaden the selected providers');
});

test('a case keeps distinct fixture sources that share one declaration',()=>{
 const provider={id:'forms',contributions:[{index:'metadata.forms'}]};
 const modules=new Map([...catalog,[provider.id,provider]]);
 const sources=[{id:'form.one',entry:'forms',xml:'one'},
   {id:'form.two',entry:'forms',xml:'two'}];
 const selected=selectContracts({cases:[{id:'one',entry:'a',
   factBindings:{forms:'metadata.forms'},factSourceEntries:sources.map(source=>source.id)}],
   factSources:sources},modules,['one']);
 assert.deepEqual(selected.manifest.factSources,sources);
 assert.equal(selected.modules.filter(module=>module.id==='forms').length,1);
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

test('cases can share an unchanged catalog without sharing their manifests',()=>{
 const root=mkdtempSync(join(tmpdir(),'nkdk-focused-shared-'));
 try {
  const files={'one.yaml':'id: one\n'};
  const catalogDirectory=join(root,'catalog-version');
  const first=writeFocused(join(root,'first'),files,{cases:[{id:'first'}]},{catalogDirectory});
  const before=statSync(join(first.catalog,'manifest.json')).mtimeMs;
  const second=writeFocused(join(root,'second'),files,{cases:[{id:'second'}]},{catalogDirectory});
  assert.equal(first.catalog,second.catalog);
  assert.notEqual(first.cases,second.cases);
  assert.equal(statSync(join(second.catalog,'manifest.json')).mtimeMs,before);
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('shared named fact sources merge only when their complete contracts agree',()=>{
 const source={id:'same',entry:'producer',xml:'<Root/>',inputs:{scope:'cf'}};
 const anonymous={entry:'producer',xml:'<Other/>'};
 assert.deepEqual(mergeFactSources([source,anonymous],[structuredClone(source),anonymous]),
  [source,anonymous,anonymous],'Anonymous producer entries are independently scoped rows');
 assert.throws(()=>mergeFactSources([source],[{...source,inputs:{scope:'cfe'}}]),/Conflicting fact source: same/);
 assert.deepEqual(source,{id:'same',entry:'producer',xml:'<Root/>',inputs:{scope:'cf'}});
});

// The existing owner batch must include actual form targets, not an empty index.
test('document and journal corpus resolves its form index from immutable fixture observations',()=>{
 const read=path=>JSON.parse(readFileSync(new URL('../../../'+path,import.meta.url),'utf8'));
 const batch=read('tests/migration/batches/document-journal.json');
 const contracts=read('tests/migration/rules-contract-cases.json');
 const generated=read('tests/migration/rules-contract-catalog/manifest.json');
 const modules=new Map(Object.values(generated.generatedFiles).map(text=>{const value=yaml.load(text);return [value.id,value];}));
 const selected=selectContracts(contracts,modules,batch.cases);
 assert.equal(selected.propertyCount,batch.expectedPropertyCount);
 assert.equal(selected.manifest.cases.find(row=>row.id==='e2e-properties-ДокументПоУмолчанию').yaml,'Characteristics: !xml/raw\n  $xml: ""');
 const forms=selected.manifest.factSources.filter(source=>modules.get(source.entry)?.contributions?.some(item=>item.index==='metadata.forms'));
 assert.ok(forms.length>0);
 const observations=read('tests/migration/metadata-root-index-inventory.json').forms;
 for(const source of forms){
  const row=observations.find(item=>item.source===source.source);
  assert.ok(row,source.source);
  for(const field of ['parent','name','identity'])assert.ok(source.xml.includes(row[field]),field);
 }
});
