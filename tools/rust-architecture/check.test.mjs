import {test} from 'node:test';
import assert from 'node:assert/strict';
import {violations} from './policy.mjs';
test('Rust boundaries reject unknown packages and dependencies of every kind',()=>{
 const pkg=(name,dependencies=[])=>({id:name,name,dependencies});
 const graph=packages=>({packages,workspace_members:packages.map(p=>p.id)});
 const dep=(name,kind=null,extra={})=>({name,kind,...extra});
 assert.deepEqual(violations(graph([pkg('nkdk-decimal'),pkg('nkdk-conversion-core',[dep('nkdk-decimal')])])),[]);
 for(const kind of [null,'build','dev'])assert.ok(violations(graph([pkg('nkdk-decimal',[dep('nkdk-conversion-core',kind,{rename:'innocent',target:'cfg(windows)'})]),pkg('nkdk-conversion-core')])).length);
 assert.ok(violations(graph([pkg('new-private-handler')])).length);
 assert.ok(violations(graph([pkg('nkdk-system-enum-shard-8')])).length);
 assert.deepEqual(violations(graph([pkg('nkdk-system-enum-shard-0',[dep('nkdk-rule-compiler','build')]),pkg('nkdk-rule-compiler')])),[]);
 assert.ok(violations(graph([pkg('nkdk-system-enum-shard-0',[dep('nkdk-rule-model')]),pkg('nkdk-rule-model')])).length);
 assert.deepEqual(violations(graph([pkg('nkdk-probe-sequences-fill',[dep('nkdk-conversion-core'),dep('nkdk-rule-compiler','build')]),pkg('nkdk-conversion-core'),pkg('nkdk-rule-compiler')])),[]);
 assert.ok(violations(graph([pkg('nkdk-probe-sequences-fill',[dep('nkdk-rule-model')]),pkg('nkdk-rule-model')])).length);
 assert.deepEqual(violations(graph([pkg('nkdk-candidate-document-attributes',[dep('nkdk-conversion-core'),dep('nkdk-rule-compiler','build')]),pkg('nkdk-conversion-core'),pkg('nkdk-rule-compiler')])),[]);
 assert.ok(violations(graph([pkg('nkdk',[dep('nkdk-rule-compiler')]),pkg('nkdk-rule-compiler')])).length);
 assert.deepEqual(violations(graph([pkg('nkdk-compiled-rules',[dep('nkdk-rule-compiler','build')]),pkg('nkdk-rule-compiler')])),[]);
 assert.ok(violations(graph([pkg('nkdk-compiled-rules',[dep('nkdk-rule-compiler')]),pkg('nkdk-rule-compiler')])).length);
 for(const name of ['nkdk-compiled-rules-base','nkdk-compiled-rules-owners','nkdk-compiled-rules-owners-2','nkdk-compiled-rules-owners-3']) {
  assert.deepEqual(violations(graph([pkg(name,[dep('nkdk-conversion-core'),dep('nkdk-rule-compiler','build')]),pkg('nkdk-conversion-core'),pkg('nkdk-rule-compiler')])),[]);
  assert.ok(violations(graph([pkg('nkdk-conversion-core',[dep(name)]),pkg(name)])).length);
  assert.ok(violations(graph([pkg(name,[dep('nkdk-rule-compiler')]),pkg('nkdk-rule-compiler')])).length);
 }
 assert.ok(violations(graph([pkg('nkdk-conversion-core',[dep('external-handler',null,{path:'/local/handler'})])])).length);
 assert.deepEqual(violations(graph([pkg('nkdk-conversion-core',[dep('quick-xml')])])),[]);
 const vendor=path=>({...graph([pkg('nkdk-conversion-core',[dep('yaml-rust2',null,{path})])]),workspace_root:'/project/rust'});
 assert.deepEqual(violations(vendor('/project/third-party/yaml-rust2')),[]);
 const cliVendor={...graph([pkg('nkdk',[dep('yaml-rust2',null,{path:'/project/third-party/yaml-rust2'})])]),workspace_root:'/project/rust'};
 assert.deepEqual(violations(cliVendor),[]);
 assert.ok(violations(vendor('/project/other/yaml-rust2')).length);

});

test('shared AOT boundaries permit only the committed layout and dependency kind',()=>{
 const pkg=(name,dependencies=[])=>({id:name,name,dependencies});
 const dep=(name,kind=null)=>({name,kind});
 const first='nkdk-aot-0123456789abcdef',second='nkdk-aot-fedcba9876543210';
 const layout={format:'nkdk-aot-layout/1',facadeDependencies:[second],packages:[
  {package:first,dependencies:[],facade:false},
  {package:second,dependencies:[first],facade:false},
 ]};
 const configuration={facadeName:'nkdk-shared-catalog-bodies-5',layout};
 const graph=dependencies=>({packages:[pkg('nkdk-conversion-core'),pkg(first),pkg(second,dependencies),pkg(configuration.facadeName,[dep(second)])],workspace_members:['nkdk-conversion-core',first,second,configuration.facadeName]});
 assert.deepEqual(violations(graph([dep(first),dep('nkdk-conversion-core')]),[configuration]),[]);
 const production=graph([dep(first)]);production.packages.push(pkg('nkdk-compiled-rules-bodies-5',[dep(configuration.facadeName)]));production.workspace_members.push('nkdk-compiled-rules-bodies-5');
 assert.deepEqual(violations(production,[configuration]),[]);
 production.packages.find(pkg=>pkg.name==='nkdk-compiled-rules-bodies-5').dependencies=[dep(first)];
 assert.ok(violations(production,[configuration]).length);
 for(const kind of ['build','dev'])assert.ok(violations(graph([dep(first,kind)]),[configuration]).length);
 assert.ok(violations(graph([dep(configuration.facadeName)]),[configuration]).length);
 const unknown=graph([]);unknown.packages.push(pkg('nkdk-aot-aaaaaaaaaaaaaaaa'));unknown.workspace_members.push('nkdk-aot-aaaaaaaaaaaaaaaa');
 assert.ok(violations(unknown,[configuration]).some(error=>error.includes('Unknown workspace package')));
 assert.throws(()=>violations(graph([]),[{...configuration,layout:{...layout,packages:[{package:first,dependencies:['nkdk-rule-compiler'],facade:false}]}}]),/layout|dependency/i);
});

test('shared layouts are loaded from tracked catalog roots before dependency verification',async()=>{
 const {mkdtempSync,mkdirSync,writeFileSync,rmSync}=await import('node:fs');
 const {join}=await import('node:path');
 const {tmpdir}=await import('node:os');
 const {sharedCatalogues}=await import('./shared-layouts.mjs');
 const root=mkdtempSync(join(tmpdir(),'nkdk-shared-policy-'));
 try {
  assert.deepEqual(sharedCatalogues(root),[]);
  const directory=join(root,'generated-aot/bodies-5');mkdirSync(directory,{recursive:true});
  const layout={format:'nkdk-aot-layout/1',packages:[],facadeDependencies:[]};
  writeFileSync(join(directory,'layout.json'),JSON.stringify(layout));
  assert.deepEqual(sharedCatalogues(root),[{facadeName:'nkdk-shared-catalog-bodies-5',layout}]);
  mkdirSync(join(root,'generated-aot/broken'));
  assert.throws(()=>sharedCatalogues(root));
 }finally{rmSync(root,{recursive:true,force:true});}
});
