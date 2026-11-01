import assert from 'node:assert/strict';
import {test} from 'node:test';
import {composedCollection} from '../src/composed-collection.mjs';

const edge={status:'linked-structure',owner:{symbol:'Owner'},item:{symbol:'Item'},property:'items',
  mapping:{xml:'Item',xmlParents:['Items'],yaml:'Элементы',keyField:'name'}};
const fragment={id:'fragment.row',kind:'fragment',
  value:{kind:'record',fields:[{name:'name',type:{kind:'scalar',scalar:'text'}}]},
  representations:{xml:{kind:'record',fields:[{field:'name',path:['md:Item','Name']}]},
    yaml:{kind:'mapping',fields:[{field:'name',key:'Имя'}]}},
  contributions:[{index:'metadata.names',key:{field:'name'},value:{field:'name'}}]};
const item={id:'owner.item',kind:'object',imports:{row:fragment.id},inputs:{},
  compose:[{use:'row',bind:{}}],contributions:[],
  value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
const options={bindings:{},extraInputs:{},namespaces:{md:'urn:test'},defaultXmlNamespace:'md'};

test('composed collection retains item fact providers in the compiled row',()=>{
  const contextual=structuredClone(item);
  contextual.inputs.rowName={type:{kind:'scalar',scalar:'text'}};
  contextual.compose[0].bind.title={concat:[{literal:'prefix:'},{input:'rowName'}]};
  contextual.constraints=[{id:'name',assert:{eq:[{input:'rowName'},{field:'name'}]}}];
  const bound=composedCollection(edge,contextual,new Map([[fragment.id,fragment]]),[],{
    ...options,bindings:{rowName:{field:'name'}},
  });
  const boundItem=bound.modules.find(module=>module.kind==='value'&&module.compose);
  assert.equal(boundItem.inputs.rowName,undefined);
  assert.deepEqual(boundItem.compose[0].bind.title,{concat:[{literal:'prefix:'},{field:'name'}]});
  assert.deepEqual(boundItem.constraints[0].assert,{eq:[{field:'name'},{field:'name'}]});
  assert.deepEqual(contextual.compose[0].bind.title,{concat:[{literal:'prefix:'},{input:'rowName'}]},
    'Item-local bindings must not mutate the standalone operation');

  const direct={...structuredClone(item),value:structuredClone(fragment.value),
    representations:structuredClone(fragment.representations)};
  const empty={...structuredClone(fragment),value:{kind:'record',fields:[]},
    representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
  const ownKey=composedCollection(edge,direct,new Map([[fragment.id,empty]]),[],options);
  const ownItem=ownKey.modules.find(module=>module.kind==='value'&&module.compose);
  assert.deepEqual(ownItem.representations.xml.fields[0].path,['Name']);
  assert.deepEqual(direct.representations.xml.fields[0].path,['md:Item','Name']);
  assert.throws(()=>composedCollection(edge,direct,new Map([[fragment.id,fragment]]),[],options),
    /Named collection key must be provided exactly once/);

  const indexed=structuredClone(item);
  indexed.inputs.lookup={type:{kind:'index',key:{kind:'scalar',scalar:'text'},value:{kind:'scalar',scalar:'text'}},index:'metadata.names'};
  const result=composedCollection(edge,indexed,new Map([[fragment.id,fragment]]),[],options);
  for(const module of result.modules.filter(module=>module.kind==='value'))
    assert.equal(module.inputs?.lookup?.index,undefined);
  assert.equal(result.entry.inputs.lookup.index,'metadata.names');

  const relative=result.modules.find(module=>module.kind==='fragment');
  assert.deepEqual(relative.contributions,fragment.contributions);
  assert.equal(result.modules.find(module=>module.kind==='value'&&module.compose)?.imports.row,
    relative.id);

  const container={...structuredClone(fragment),id:'fragment.container',
    imports:{leaf:fragment.id},compose:[{use:'leaf',bind:{}}],
    value:{kind:'record',fields:[]},
    representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}},contributions:[]};
  const nested={...structuredClone(indexed),imports:{row:container.id},yamlOrder:[]};
  const nestedResult=composedCollection(edge,nested,new Map([[fragment.id,fragment],[container.id,container]]),[],options);
  assert.deepEqual(nestedResult.modules.find(module=>module.kind==='value'&&module.compose).yamlOrder,['name']);
  assert.deepEqual(nested.yamlOrder,[]);
  const nestedRelative=nestedResult.modules.find(module=>module.kind==='fragment'&&module.value.fields.some(field=>field.name==='name'));
  assert.deepEqual(nestedRelative.representations.xml.fields[0].path,['Name']);
  assert.deepEqual(nestedRelative.contributions,fragment.contributions);
  const parent=nestedResult.modules.find(module=>module.compose?.some(part=>part.use==='leaf'));
  assert.equal(parent.imports.leaf,nestedRelative.id);
  assert.deepEqual(fragment.representations.xml.fields[0].path,['md:Item','Name'],
    'Relativizing a collection must not mutate the standalone declaration');
  const repeated={...structuredClone(nested),imports:{first:container.id,second:container.id},
    compose:[{use:'first',bind:{}},{use:'second',bind:{}}]};
  assert.throws(()=>composedCollection(edge,repeated,new Map([[fragment.id,fragment],[container.id,container]]),[],options),
    /Named collection key must be provided exactly once/);
});
