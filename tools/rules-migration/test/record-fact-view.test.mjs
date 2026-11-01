import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recordFactView} from '../src/record-fact-view.mjs';

test('record fact views reuse source semantics and retain attributes with arbitrary names',()=>{
  for(const name of ['title','renamed']){
    const base={format:'nkdk-declarations/1',kind:'value',id:`test.${name}`,
      imports:{text:'common.string'},value:{kind:'record',fields:[{name,type:{use:'text'}}]},
      representations:{xml:{kind:'with-attributes',attributes:[{name:'kind',value:{literal:'plain'}}],
        content:{kind:'record',fields:[{field:name,path:['Name']}]}},yaml:{kind:'projection',field:name}},
      presence:[{target:{field:name},xml:{missing:{denotes:{literal:'default'}}}}]};
    const extension={value:{kind:'record',fields:[{name:'sourceKind',type:{use:'text'}}]},
      representations:{xml:{kind:'record',fields:[{field:'sourceKind',path:[],attribute:'kind'}]}},
      presence:[{target:{field:'sourceKind'},xml:{missing:{denotes:{absent:true}}}}]};
    assert.throws(()=>recordFactView(base,{...extension,parameters:{ignored:true}}),/Unsupported fact view section/);
    assert.throws(()=>recordFactView(base,{...extension,representations:{...extension.representations,unknown:{}}}),/Unsupported fact view representation/);
    const source=structuredClone(base);
    const view=recordFactView(base,extension);
    assert.deepEqual(base,source);
    assert.equal(view.value.fields[0].name,name);
    assert.deepEqual(view.presence[0],base.presence[0]);
    assert.deepEqual(view.representations.yaml.fields.map(field=>field.field),[name,'sourceKind']);
    assert.equal(recordFactView(base,extension).id,view.id);
    const primaryExtension={...extension,representations:{...extension.representations,yaml:base.representations.yaml}};
    const primaryView=recordFactView(base,primaryExtension);
    assert.deepEqual(primaryView.representations.yaml,base.representations.yaml);
    assert.notEqual(primaryView.id,view.id);
    primaryView.representations.yaml.field='changed';
    assert.equal(base.representations.yaml.field,name);
    assert.throws(()=>recordFactView(base,{...extension,value:base.value}),/Repeated fact view field/);
    assert.throws(()=>recordFactView(base,{...extension,representations:{xml:{kind:'record',fields:[]}}}),
      /retain every source attribute/);
  }
});

test('fact default profiles bind declared parameters without changing source constraints',async()=>{
  const {bindFactDefaults}=await import('../src/record-fact-view.mjs');
  const source={parameters:{arbitrary:{default:false},label:{default:'local'}},
    constraints:[{when:{parameter:'arbitrary'},assert:{eq:[{parameter:'label'},{literal:'local'}]}}]};
  const profile=bindFactDefaults(source);
  assert.equal(profile.parameters,undefined);
  assert.deepEqual(profile.constraints,[{when:{literal:false},assert:{eq:[{literal:'local'},{literal:'local'}]}}]);
  assert.deepEqual(source.constraints[0].when,{parameter:'arbitrary'});
  assert.throws(()=>bindFactDefaults({...source,constraints:[{when:{parameter:'undeclared'}}]}),/Missing static fact parameter/);
  assert.throws(()=>bindFactDefaults({parameters:{missing:{}},when:{parameter:'missing'}}),/Missing static fact parameter/);
});
