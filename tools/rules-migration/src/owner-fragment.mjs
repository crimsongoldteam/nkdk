export function asOwnerFragment(source,id,prefix,defaultNamespace) {
  if(!['object','fragment'].includes(source.kind) || source.representations?.xml?.kind!=='record' || !Array.isArray(prefix) || !prefix.length)
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
