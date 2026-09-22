export function asOwnerFragment(source,id,prefix) {
  if(source.kind!=='object' || source.representations?.xml?.kind!=='record' || !Array.isArray(prefix) || !prefix.length)
    throw new Error('Owner fragment requires an object record and XML prefix');
  const fragment=structuredClone(source);
  fragment.kind='fragment';
  fragment.id=id;
  for(const input of Object.values(fragment.inputs??{}))if(input.index) {
    if(!input.type)throw new Error('Composed index input requires a declared type');
    delete input.index;
  }
  for(const field of fragment.representations.xml.fields)field.path=[...prefix,...field.path];
  return fragment;
}
