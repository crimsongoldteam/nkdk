import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,statSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {publishGenerated} from '../src/shared-aot-output.mjs';

test('removed AOT packages leave no empty Cargo workspace members and keep unowned files',()=>{
  const directory=mkdtempSync(join(tmpdir(),'nkdk-aot-empty-'));
  try {
    const first=new Map([
      ['packages/old/Cargo.toml',Buffer.from('[package]')],
      ['packages/old/src/lib.rs',Buffer.from('')],
      ['packages/kept/src/lib.rs',Buffer.from('')],
    ]);
    publishGenerated(directory,first);
    writeFileSync(join(directory,'packages/kept/notes.txt'),'keep');
    publishGenerated(directory,new Map([['src/lib.rs',Buffer.from('new')]]));
    assert.equal(existsSync(join(directory,'packages/old')),false);
    assert.equal(readFileSync(join(directory,'packages/kept/notes.txt'),'utf8'),'keep');
  } finally {rmSync(directory,{recursive:true,force:true});}
});

test('shared AOT production mode owns selection and cannot mix ad hoc exports',async()=>{
  const {sharedAotArguments}=await import('../src/shared-aot-args.mjs');
  const root=join(tmpdir(),'nkdk-production');
  const output=join(root,'prepared');
  assert.deepEqual(sharedAotArguments(['--production-group','bodies-5','--output',output,'--check'],root),
    {productionGroup:'bodies-5',output,check:true});
  const sources=join(root,'sources');
  assert.deepEqual(sharedAotArguments(['--production-group','bodies-5','--output',output,'--prepared-sources',sources],root),
    {productionGroup:'bodies-5',output,sources,check:false});
  const generic=sharedAotArguments(['--catalog',root,'--exports',join(root,'exports.txt'),'--output',output],root);
  assert.equal(generic.catalog,root);
  for(const args of [
    ['--production-group','bodies-5','--catalog',root,'--exports',join(root,'exports.txt'),'--output',output],
    ['--production-group','unknown','--output',output],
    ['--production-group','bodies-5','--output',output,'--prepared-sources',output],
    ['--production-group','bodies-5','--output',output,'--prepared-sources',join(output,'nested')],
    ['--production-group','bodies-5','--output',output,'--prepared-sources',join(root,'../outside')],
    ['--production-group','bodies-5','--output',output,'--output',output],
    ['--production-group','bodies-5','--output',join(root,'../outside')],
  ])assert.throws(()=>sharedAotArguments(args,root));
});

test('shared AOT publication is repeatable and removes only owned files',()=>{
  const directory=mkdtempSync(join(tmpdir(),'nkdk-aot-output-'));
  try {
    writeFileSync(join(directory,'notes.txt'),'keep');
    const initial=new Map([['package/src/generated.rs',Buffer.from('first')],['package/table.bin',Buffer.from([0,255])]]);
    publishGenerated(directory,initial);
    const stamp=statSync(join(directory,'package/src/generated.rs')).mtimeMs;
    publishGenerated(directory,initial);
    assert.equal(statSync(join(directory,'package/src/generated.rs')).mtimeMs,stamp);
    publishGenerated(directory,initial,{check:true});
    writeFileSync(join(directory,'package/src/generated.rs'),'stale');
    assert.throws(()=>publishGenerated(directory,initial,{check:true}),/Stale/);
    publishGenerated(directory,initial);
    publishGenerated(directory,new Map([['package/src/generated.rs',Buffer.from('second')]]));
    assert.equal(existsSync(join(directory,'package/table.bin')),false);
    assert.equal(readFileSync(join(directory,'notes.txt'),'utf8'),'keep');
    for(const path of ['../outside','/absolute','package/../notes.txt','notes.txt']) {
      assert.throws(()=>publishGenerated(directory,new Map([[path,Buffer.from('bad')]])),/Unsafe|Unowned/);
      assert.equal(readFileSync(join(directory,'notes.txt'),'utf8'),'keep');
    }
  } finally {rmSync(directory,{recursive:true,force:true});}
});


test('prepared runner uses the existing conversion checks with the selected package graph',async()=>{
  const {preparedRunnerManifest}=await import('../src/shared-aot-runner.mjs');
  const project=join(tmpdir(),'project');
  const manifest=preparedRunnerManifest(join(project,'runner'),join(project,'prepared'));
  assert.match(manifest,/default = \["working-catalog"\]/);
  assert.match(manifest,/package = "nkdk-shared-catalog"/);
  assert.match(manifest,/path = "\.\.\/prepared"/);
  assert.match(manifest,/src\/main\.rs/);
  assert.doesNotMatch(manifest,/\[build-dependencies\]/);
  assert.match(preparedRunnerManifest(join(project,'runner'),join(project,'prepared'),{catalogPackage:'nkdk-compiled-rules'}),/package = "nkdk-compiled-rules"/);
});

test('shared AOT production wrappers separate reproducible source from tracked manifests',async()=>{
  const {sharedAotManifests}=await import('../src/shared-aot-manifests.mjs');
  const root=join(tmpdir(),'nkdk-manifests');
  const output=join(root,'rust/generated-aot/bodies-5');
  const sources=join(root,'rust/prepared-aot/bodies-5');
  const layout={packages:[{package:'nkdk-aot-0123456789abcdef',dependencies:[],facade:false}],facadeDependencies:['nkdk-aot-0123456789abcdef']};
  const files=sharedAotManifests(root,output,layout,{sources,facadeName:'nkdk-compiled-rules-bodies-5',workspace:false});
  const manifest=files.get('Cargo.toml').toString();
  assert.match(manifest,/name="nkdk-compiled-rules-bodies-5"/);
  assert.doesNotMatch(manifest,/\[workspace\]|\[build-dependencies\]/);
  for(const [path,contents] of files)if(path.endsWith('Cargo.toml'))assert.match(contents.toString(),/\[lib\]\ntest=false\n/);
  assert.match(files.get('src/lib.rs').toString(),/prepared-aot\/bodies-5\/src\/generated.rs/);
  assert.match(files.get('packages/nkdk-aot-0123456789abcdef/src/lib.rs').toString(),/prepared-aot\/bodies-5\/packages\/nkdk-aot-0123456789abcdef\/src\/generated.rs/);
  const standalone=sharedAotManifests(root,output,layout);
  assert.match(standalone.get('Cargo.toml').toString(),/\[workspace\]/);
  assert.equal(standalone.get('src/lib.rs').toString(),'include!("generated.rs");\n');
});

test('production preparation publishes reproducible code separately from the Cargo graph',async()=>{
  const {sharedAotArtifacts}=await import('../src/shared-aot-artifacts.mjs');
  const root=join(tmpdir(),'nkdk-publish');
  const output=join(root,'rust/generated-aot/bodies-5');
  const sources=join(root,'rust/prepared-aot/bodies-5');
  const layout={packages:[{package:'nkdk-aot-0123456789abcdef',dependencies:[],facade:false}],facadeDependencies:['nkdk-aot-0123456789abcdef']};
  const files=new Map([['layout.json',Buffer.from(JSON.stringify(layout))],['src/generated.rs',Buffer.from('facade')],['packages/nkdk-aot-0123456789abcdef/src/generated.rs',Buffer.from('body')],['packages/nkdk-aot-0123456789abcdef/src/table.bin',Buffer.from([0,255])]]);
  const outputs=sharedAotArtifacts(root,output,files,{sources,facadeName:'nkdk-shared-catalog-bodies-5'});
  assert.equal(outputs.length,2);
  const tracked=outputs.find(value=>value.directory===output).files;
  const prepared=outputs.find(value=>value.directory===sources).files;
  assert.equal(prepared.get('src/generated.rs').toString(),'facade');
  assert.deepEqual(prepared.get('packages/nkdk-aot-0123456789abcdef/src/table.bin'),Buffer.from([0,255]));
  assert.equal(tracked.has('src/generated.rs'),false);
  assert.equal(prepared.has('Cargo.toml'),false);
  assert.equal(tracked.has('layout.json'),true);
  assert.match(tracked.get('Cargo.toml').toString(),/name="nkdk-shared-catalog-bodies-5"/);
  assert.doesNotMatch(tracked.get('Cargo.toml').toString(),/\[workspace\]/);
  const oversized=new Map(files);oversized.set('packages/nkdk-aot-0123456789abcdef/src/generated.rs',Buffer.alloc(16*1024*1024));
  assert.throws(()=>sharedAotArtifacts(root,output,oversized,{sources,facadeName:'nkdk-shared-catalog-bodies-5'}),/Rust.*budget/);
  const acceptedLayout=JSON.parse(tracked.get('layout.json').toString());
  assert.ok(acceptedLayout.packages[0].compiledRustBytes>Buffer.byteLength('body'));
});

test('split publication validates every destination before changing either directory',async()=>{
  const {publishPrepared}=await import('../src/shared-aot-artifacts.mjs');
  const directory=mkdtempSync(join(tmpdir(),'nkdk-aot-split-'));
  try {
    const source=join(directory,'source'),graph=join(directory,'graph');
    publishGenerated(source,new Map([['src/generated.rs',Buffer.from('original')]]));
    publishGenerated(graph,new Map([['notes.txt',Buffer.from('keep')]]));
    writeFileSync(join(graph,'Cargo.toml'),'user-owned');
    assert.throws(()=>publishPrepared([
      {directory:source,files:new Map([['src/generated.rs',Buffer.from('changed')]])},
      {directory:graph,files:new Map([['Cargo.toml',Buffer.from('replace')]])},
    ]),/Unowned/);
    assert.equal(readFileSync(join(source,'src/generated.rs'),'utf8'),'original');
    assert.equal(readFileSync(join(graph,'Cargo.toml'),'utf8'),'user-owned');
  } finally {rmSync(directory,{recursive:true,force:true});}
});
