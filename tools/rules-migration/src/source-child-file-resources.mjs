import {readFileSync} from 'node:fs';

const profiles=JSON.parse(readFileSync(new URL('../profiles/child-file-resources.json',import.meta.url),'utf8'));

// This bridge mounts accepted resource declarations. The descriptor and all
// transfers share the same declaration; no filenames are duplicated in Rust.
export function sourceChildFileResources(property,catalog) {
 const profile=profiles[property.parameters?.type];
 if(!profile)return undefined;
 const original=catalog.get(profile.fragment);
 if(original?.kind!=='fragment' || original.value?.fields?.length!==0 ||
  original.inputs?.[profile.namesInput]?.type?.kind!=='sequence')
  throw new Error('Missing registered child resource fragment: '+profile.fragment);
 const resources=structuredClone(original.resources);
 const descriptor=resources?.[profile.descriptorResource]?.oneOf;
 if(descriptor?.length!==1)throw new Error('One registered child descriptor required');
 const parts=descriptor[0].yaml?.sequence;
 const [directory,name,file]=parts??[];
 if(parts?.length!==3 || typeof directory?.literal!=='string' || !name?.var ||
  typeof file?.literal!=='string')throw new Error('Unresolved child descriptor path');
 const folder=property.parameters.folderName;
 for(const resource of resources) {
  if(resource.forEach?.in?.input!==profile.namesInput || resource.forEach.as!==name.var)
   throw new Error('Unresolved child resource iteration');
  resource.forEach.in={input:property.name};
  for(const path of [...(resource.oneOf??[]),...(resource.remainder?[resource.remainder]:[])]) {
   if(path.yaml?.sequence?.[0]?.literal!==directory.literal)
    throw new Error('Unresolved child resource directory');
   path.yaml.sequence[0]={literal:folder};
  }
 }
 return {resources,entryFile:file.literal};
}
