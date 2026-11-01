import {sourceOwnerXmlRoute} from './owner-root-source.mjs';

// Keep registered membership in the independent snapshot. Consumers select
// context from this enum; the operation never inspects a metadata XML root.
export function attachOwnerMembership(source,base) {
 const belonging=source.properties.find(row=>row.name==='objectBelonging');
 if(!belonging)return base;
 if(belonging.type!=='SystemEnumeration' || !belonging.parameters.typeSE ||
  !belonging.parameters.implicitValueYAML)
  throw new Error('Unreviewed owner membership');
 base.imports={...base.imports,belonging:'system.'+belonging.parameters.typeSE};
 base.value.fields.push({name:'objectBelonging',type:{use:'belonging'}});
 base.representations.xml.fields.push({field:'objectBelonging',
  path:[...sourceOwnerXmlRoute(source),'md:Properties','md:ObjectBelonging']});
 base.representations.yaml.fields.push({field:'objectBelonging',key:'objectBelonging'});
 base.presence.push({target:{field:'objectBelonging'},
  xml:{missing:{denotes:{literal:belonging.parameters.implicitValueYAML}}},
  yaml:{missing:{denotes:{if:{present:{field:'base'}},then:{literal:'Adopted'},
   else:{literal:belonging.parameters.implicitValueYAML}}}}});
 return base;
}
