import {createHash} from 'node:crypto';
import {allowedMetadataPaths} from './allowed-metadata-paths.mjs';
import {commonInputs} from './common-inputs.mjs';

export function metadataAllowedPathProperty(property,catalog,xmlNamespaces) {
  const p=property.parameters;
  const target=p.metadataTarget;
  if(p.type!=='MetadataItemLinks' || target?.kind!=='member' || target.owner!=='explicit' ||
    !Array.isArray(target.allowedObjectPaths) || !Array.isArray(target.allowedMemberPaths))return null;
  const allowed=new Set(['type','metadataTarget','yaml','xml','xmlParents','metadataItemLinksXMLItem','defaultValueXMLRaw']);
  if(Object.keys(p).some(key=>!allowed.has(key)) || p.defaultValueXMLRaw!=='' ||
    typeof p.yaml!=='string' || !p.yaml || typeof p.xml!=='string' ||
    !Array.isArray(p.xmlParents) || !p.xmlParents.every(part=>typeof part==='string') ||
    typeof xmlNamespaces.xr!=='string' || p.metadataItemLinksXMLItem!=='xr:Object')return null;
  const path=[...p.xmlParents,p.xml];
  if(path.some(part=>!/^[A-Za-z][A-Za-z0-9]*$/.test(part)))return null;
  const digest=createHash('sha256').update(JSON.stringify([target,p.metadataItemLinksXMLItem])).digest('hex').slice(0,16);
  const id=`common.metadata-allowed-paths-${digest}`;
  let declarations;
  try {declarations=allowedMetadataPaths(target,catalog,{id,item:p.metadataItemLinksXMLItem,verifyTargets:true});}
  catch(error) {return {status:'blocked',reason:`metadata-path-policy:${error.message}`};}
  for(const declaration of declarations) {
    if(catalog.has(declaration.id) && JSON.stringify(catalog.get(declaration.id))!==JSON.stringify(declaration))
      throw new Error(`Conflicting generated path declaration: ${declaration.id}`);
    catalog.set(declaration.id,declaration);
  }
  const lifted=commonInputs(catalog.get(id));
  const providers={roots:'metadata.roots',pathChildren:'metadata.path-children'};
  return {status:'candidate',id,type:{use:'value',bind:lifted.bind},path,key:p.yaml,
    inputs:lifted.inputs,imports:lifted.imports,namespaces:{xr:xmlNamespaces.xr},
    indexProviders:Object.fromEntries(Object.keys(lifted.inputs).map(name=>[name,providers[name]])),
    parameterEquivalences:[{parameter:'defaultValueXMLRaw',equivalentTo:'empty-element',via:id}],
    presence:{target:{field:property.name},
      xml:{missing:{denotes:{sequence:[]}},empty:[{form:'empty-element',denotes:{sequence:[]}}],
        canonical:[{when:{not:{exists:{in:{field:property.name},as:'row',where:{literal:true}}}},form:'empty-element'},{form:'ordinary'}]},
      yaml:{missing:{denotes:{sequence:[]}},omitWhen:{not:{exists:{in:{field:property.name},as:'row',where:{literal:true}}}}}}};
}
