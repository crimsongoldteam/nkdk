import {mapProperty} from './mappings.mjs';

// Migration-only binding: the normal declaration supplies the value on export.
// Missing or altered source correspondence remains blocked, never guessed.
export function mapReconstructedProperty(property,binding,catalog,namespaces) {
  const p=property.parameters;
  const fail=()=>({status:'blocked',reason:'reconstructed-property-profile'});
  if(property.status!=='static-parameters' || p?.type!=='string' || p.xmlOnly!==true ||
    Object.keys(p).some(key=>!['type','xml','xmlParents','xmlOnly'].includes(key)) ||
    !binding || Object.keys(binding).some(key=>!['inputs','expression','constraints'].includes(key)) ||
    !binding.expression || typeof binding.expression!=='object' || Array.isArray(binding.expression) ||
    !Object.keys(binding.expression).length || !binding.inputs || typeof binding.inputs!=='object' ||
    Array.isArray(binding.inputs) || (binding.constraints!==undefined && !Array.isArray(binding.constraints)))return fail();
  const {xmlOnly,...parameters}=p;
  const mapped=mapProperty({...property,parameters:{...parameters,yaml:property.name}},catalog,namespaces);
  if(mapped.status!=='candidate')return mapped;
  delete mapped.key;
  mapped.inputs=structuredClone(binding.inputs);
  mapped.presence.yaml={missing:{denotes:structuredClone(binding.expression)}};
  if(binding.constraints)mapped.constraints=structuredClone(binding.constraints);
  return mapped;
}
