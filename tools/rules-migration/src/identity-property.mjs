import {commonInputs} from './common-inputs.mjs';

// Source correspondence only; conversion behavior belongs to common.uuid.
export function mapIdentity(property,catalog) {
  const p=property.parameters,fail=reason=>({status:'blocked',reason});
  const allowed=['type','xml','xmlParents','xmlOnly','fromYAML','toYAML','toEnterprise'];
  if(Object.keys(p).some(key=>!allowed.includes(key)) || p.xml!=='_uuid' || p.xmlOnly!==true ||
    ['fromYAML','toYAML','toEnterprise'].some(key=>Object.hasOwn(p,key)&&p[key]!==false))return fail('identity-property-profile');
  const path=p.xmlParents??[];
  if(!Array.isArray(path)||path.some(part=>typeof part!=='string'||!/^[A-Za-z][A-Za-z0-9]*$/.test(part)))return fail('identity-path-profile');
  const common=catalog.get('common.uuid');
  if(!common)return fail('unsupported-common');
  const context=commonInputs(common);
  return {status:'candidate',id:common.id,type:{use:'value',bind:context.bind},
    inputs:context.inputs,imports:context.imports,path,attribute:'uuid',identityProjection:true};
}
