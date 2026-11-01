import {createHash} from 'node:crypto';

const identifier=(kind,source)=>`candidate.composed-collection.${kind}.${createHash('sha256').update(JSON.stringify(source)).digest('hex').slice(0,20)}`;

export function composedCollection(edge,entry,catalog,additional,{
  bindings,extraInputs,namespaces,defaultXmlNamespace,identity,
}) {
  if(edge.status!=='linked-structure' || edge.mapping.yamlAsArray || !edge.mapping.keyField ||
    !Array.isArray(edge.mapping.xmlParents) || edge.mapping.xmlParents.length!==1)
    throw new Error('Composed collection requires a named one-level owner path');
  if(!namespaces?.[defaultXmlNamespace])throw new Error('Missing collection XML namespace');
  if((entry.contributions?.length??0)!==(identity?1:0) ||
    (identity && entry.contributions[0].index!==identity.index))
    throw new Error('Composed item contributions require an explicit owner-level projection');
  const qualified=name=>name.includes(':')?name:`${defaultXmlNamespace}:${name}`;
  const root=qualified(edge.mapping.xml);
  const modules=[];
  const item=structuredClone(entry);
  item.kind='value';
  item.id=identifier('item',[edge.item,entry.id]);
  delete item.contributions;
  item.inputs={...item.inputs,...structuredClone(extraInputs)};
  for(const [name,expression] of Object.entries(bindings)) {
    if(!Object.hasOwn(item.inputs,name))throw new Error(`Unknown item-local input: ${name}`);
    delete item.inputs[name];
  }
  // Substitute once in the item's own expression scope. A replacement may
  // itself refer to an outer input; it must not be rebound as an item input.
  const substitute=value=>{
    if(!value || typeof value!=='object')return value;
    if(Object.keys(value).length===1 && typeof value.input==='string' &&
      Object.hasOwn(bindings,value.input))return structuredClone(bindings[value.input]);
    if(Array.isArray(value))return value.map(substitute);
    return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,substitute(child)]));
  };
  for(const [section,value] of Object.entries(item))
    if(section!=='inputs')item[section]=substitute(value);
  const ownerInputs=structuredClone(item.inputs);
  for(const input of Object.values(item.inputs))if(input.index) {
    if(!input.type)throw new Error('Composed collection index requires a declared type');
    delete input.index;
  }
  const lookup=new Map([...catalog,...additional.map(module=>[module.id,module])]);
  const makeRelative=module=>{
    for(const field of module.representations.xml.fields??[]) {
      if(field.path[0]!==root)throw new Error(`Fragment is outside item XML root: ${module.id}`);
      field.path=field.path.slice(1);
    }
    if(!module.value.fields?.some(field=>field.name===edge.mapping.keyField))return 0;
    const fields=module.representations.yaml.fields;
    if(!fields.some(field=>field.field===edge.mapping.keyField))
      fields.push({field:edge.mapping.keyField,key:edge.mapping.keyField});
    for(const rule of module.presence??[])
      if(rule.target?.field===edge.mapping.keyField && rule.yaml?.missing)
        rule.yaml.missing={denotes:{absent:true}};
    return 1;
  };
  let keyFieldCount=makeRelative(item);
  const relativeFragments=new Map(),active=new Set();
  const mount=id=>{
    if(relativeFragments.has(id))return relativeFragments.get(id);
    if(active.has(id))throw new Error(`Cyclic composed item fragment: ${id}`);
    const source=lookup.get(id);
    if(!source || source.kind!=='fragment')throw new Error(`Missing composed item fragment: ${id}`);
    active.add(id);
    const relative=structuredClone(source);
    relative.id=identifier('fragment',[edge.item,source.id]);
    if(relative.resources?.length)throw new Error(`Item-local resources need a separate lifecycle: ${source.id}`);
    let keys=makeRelative(relative);
    for(const part of relative.compose??[]) {
      const nested=mount(relative.imports[part.use]);
      relative.imports[part.use]=nested.module.id;
      keys+=nested.keys;
    }
    modules.push(relative);
    active.delete(id);
    const mounted={module:relative,keys};relativeFragments.set(id,mounted);
    return mounted;
  };
  for(const part of item.compose) {
    const mounted=mount(item.imports[part.use]);
    keyFieldCount+=mounted.keys;
    item.imports[part.use]=mounted.module.id;
  }
  if(keyFieldCount!==1)throw new Error(`Named collection key must be provided exactly once: ${edge.mapping.keyField}`);
  if(item.yamlOrder && !item.yamlOrder.includes(edge.mapping.keyField))
    item.yamlOrder.unshift(edge.mapping.keyField);
  modules.push(item);
  const importTypes=structuredClone(item.imports);
  const forward=Object.fromEntries(Object.keys(item.inputs).map(name=>[name,{input:name}]));
  const list={format:'nkdk-declarations/1',kind:'value',id:identifier('list',[edge.owner,item.id]),
    imports:{...importTypes,item:item.id},inputs:structuredClone(item.inputs),namespaces,
    value:{kind:'sequence',item:{use:'item',bind:forward}},
    representations:{xml:{kind:'element-sequence',path:[root]},
      yaml:{kind:'record-mapping',key:edge.mapping.keyField}}};
  modules.push(list);
  const property=edge.property;
  const projection={format:'nkdk-declarations/1',kind:'object',id:identifier('owner',[edge.owner,list.id]),
    imports:{...importTypes,items:list.id},inputs:ownerInputs,namespaces,
    value:{kind:'record',fields:[{name:property,type:{use:'items',bind:forward}}]},
    representations:{xml:{kind:'record',fields:[{field:property,path:edge.mapping.xmlParents.map(qualified)}]},
      yaml:{kind:'mapping',fields:[{field:property,key:edge.mapping.yaml}]}},
    ...(identity?{contributions:[{index:identity.index,forEach:{in:{field:property},as:'row'},
      key:structuredClone(identity.key),value:structuredClone(identity.value)}]}:{}),
  };
  modules.push(projection);
  return {modules,entry:projection};
}
