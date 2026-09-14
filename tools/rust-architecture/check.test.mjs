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
 assert.ok(violations(graph([pkg('nkdk',[dep('nkdk-rule-compiler')]),pkg('nkdk-rule-compiler')])).length);
 assert.deepEqual(violations(graph([pkg('nkdk-compiled-rules',[dep('nkdk-rule-compiler','build')]),pkg('nkdk-rule-compiler')])),[]);
 assert.ok(violations(graph([pkg('nkdk-compiled-rules',[dep('nkdk-rule-compiler')]),pkg('nkdk-rule-compiler')])).length);
 assert.ok(violations(graph([pkg('nkdk-conversion-core',[dep('external-handler',null,{path:'/local/handler'})])])).length);
 assert.deepEqual(violations(graph([pkg('nkdk-conversion-core',[dep('quick-xml')])])),[]);
 const vendor=path=>({...graph([pkg('nkdk-conversion-core',[dep('yaml-rust2',null,{path})])]),workspace_root:'/project/rust'});
 assert.deepEqual(violations(vendor('/project/third-party/yaml-rust2')),[]);
 assert.ok(violations(vendor('/project/other/yaml-rust2')).length);

});
