export function asOwnerFragment(source,id,prefix,defaultNamespace) {
  if(!['object','fragment'].includes(source.kind) || source.representations?.xml?.kind!=='record' || !Array.isArray(prefix))
    throw new Error('Owner fragment requires an object record and XML prefix');
  if(defaultNamespace && !source.namespaces?.[defaultNamespace])throw new Error('Unknown owner XML namespace');
  const fragment=structuredClone(source);
  fragment.kind='fragment';
  fragment.id=id;
  for(const input of Object.values(fragment.inputs??{}))if(input.index) {
    if(!input.type)throw new Error('Composed index input requires a declared type');
    delete input.index;
  }
  for(const field of fragment.representations.xml.fields)field.path=[...prefix,...field.path.map(part=>defaultNamespace && !part.includes(':')?`${defaultNamespace}:${part}`:part)];
  return fragment;
}

// Rename the owner's fields only. A member selected from a collection row
// (get.field) belongs to that row, not to this record's field namespace.
export function renameOwnerFields(source,mapping) {
  const module=structuredClone(source),fields=module.value?.fields;
  if(module.value?.kind!=='record' || !fields ||
    Object.keys(mapping).some(name=>!fields.some(field=>field.name===name)) ||
    Object.values(mapping).some(name=>typeof name!=='string'||!name))
    throw new Error('Invalid owner field mapping');
  const names=fields.map(field=>mapping[field.name]??field.name);
  if(new Set(names).size!==names.length)throw new Error('Duplicate renamed owner field');
  const rewrite=value=>{
    if(Array.isArray(value))return value.map(rewrite);
    if(!value || typeof value!=='object')return value;
    return Object.fromEntries(Object.entries(value).map(([key,child])=>[
      key,key==='field'&&typeof child==='string' ? mapping[child]??child : rewrite(child),
    ]));
  };
  const result=rewrite(module);
  for(const [index,field] of result.value.fields.entries())field.name=names[index];
  // get.field is a row selector; rewrite only its 'of' expression.
  const restoreSelectors=(original,changed)=>{
    if(!original || typeof original!=='object')return;
    if(original.get?.field!==undefined)changed.get.field=original.get.field;
    for(const [key,child] of Object.entries(original))restoreSelectors(child,changed[key]);
  };
  restoreSelectors(module,result);
  for(const key of ['xmlOrder','yamlOrder'])if(result[key])result[key]=result[key].map(name=>mapping[name]??name);
  return result;
}
