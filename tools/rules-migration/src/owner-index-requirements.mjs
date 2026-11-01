// Trace declared providers through the same bindings used by the AOT compiler.
// Equal index shapes do not imply that two indexes contain the same facts.
export function ownerIndexRequirements(owner,catalog,providers={}) {
 const nodes=new Map(),edges=[];
 const projections=new Map([...catalog.values()].flatMap(module=>
  (module.projections??[]).map(projection=>[projection.id,module])));
 const add=(module,bindings,name,index)=>{
  const input=module.inputs?.[name];
  if(!input || (!input.index && input.type?.kind!=='index'))
   throw new Error(`Index provider requires a declared index input: ${module.id}.${name}`);
  if(typeof index!=='string'||!index)throw new Error('Invalid index provider');
  if(bindings[name] && bindings[name]!==index)
   throw new Error(`Conflicting index provider: ${module.id}.${name}`);
  const changed=!bindings[name];bindings[name]=index;return changed;
 };
 const visit=module=>{
  if(nodes.has(module.id))return;
  const bindings={};nodes.set(module.id,{module,bindings});
  for(const [name,input] of Object.entries(module.inputs??{}))if(input.index)add(module,bindings,name,input.index);
  for(const [name,index] of Object.entries(providers[module.id]??{}))add(module,bindings,name,index);
  const reference=type=>{
   if(!type || typeof type!=='object')return;
   if(type.use) {
    const id=module.imports?.[type.use];
    const target=catalog.get(id)??projections.get(id);
    if(!target)throw new Error(`Missing index binding declaration: ${module.id}.${type.use}`);
    edges.push({module,target,type});visit(target);
   }
   for(const field of type.fields??[])reference(field.type);
   for(const variant of type.variants??[])reference(variant.type);
   if(type.item)reference(type.item);
  };
  for(const part of module.compose??[])reference(part);
  reference(module.value);
 };
 visit(owner);
 // Recursive value declarations are valid. Propagate the finite set of input
 // providers until stable rather than treating value recursion as an error.
 let changed;
 do {
  changed=false;
  for(const {module,target,type} of edges) {
   for(const [name,index] of Object.entries(nodes.get(target.id).bindings)) {
    const binding=type.bind?.[name];
    if(!binding || Object.keys(binding).length!==1 || typeof binding.input!=='string')
     throw new Error(`Index provider requires an input binding: ${module.id}.${type.use}.${name}`);
    changed=add(module,nodes.get(module.id).bindings,binding.input,index)||changed;
   }
  }
 } while(changed);
 const bindings=nodes.get(owner.id).bindings;
 const missing=Object.entries(owner.inputs??{}).filter(([name,input])=>
  input.type?.kind==='index' && !bindings[name]).map(([name])=>name);
 return {bindings,missing};
}

export function bindPreparedOwnerIndexes(owner,{bindings,missing}) {
 if(owner.kind!=='object')throw new Error('Prepared indexes require an operation root');
 if(missing.length)throw new Error(`Missing index provider: ${missing.join(', ')}`);
 const result=structuredClone(owner);
 for(const [name,index] of Object.entries(bindings)) {
  if(!result.inputs?.[name])throw new Error(`Missing operation index input: ${name}`);
  result.inputs[name].index=index;
 }
 return result;
}
