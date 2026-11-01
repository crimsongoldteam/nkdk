import {taggedScalarProperties} from './state-contributions.mjs';
import {numericOwnerFragment,orderNumericHistory} from './numeric-owner-fragment.mjs';
import {mergeOwnerHistory} from './owner-composition.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {stateValueOmission} from './state-history.mjs';

const xmlName=property=>property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1);

// Add source-registered boolean/enum states to the already shared history.
// Reuse the existing declarative scalar builder, not a second conversion path.
export function ownerStateScalars(fragment,source,catalog,{id}={}) {
 const names=new Set(fragment.value.fields.map(row=>row.name));
 const properties=taggedScalarProperties(source).filter(property=>!names.has(xmlName(property)));
 if(!properties.length)return {module:structuredClone(fragment),properties:[]};
 const extra=numericOwnerFragment((id??fragment.id)+'.scalars',sourceOwnerXmlRoute(source),[],catalog,properties,source);
 for(const property of properties) {
  const field=xmlName(property),presence=extra.presence.find(row=>row.target.field===field);
  const value=presence.yaml.default;
  presence.yaml={missing:{denotes:value},omitWhen:stateValueOmission(field,value)};
 }
 const module=mergeOwnerHistory(id??fragment.id+'.scalars',fragment,extra);
 const byName=new Map(source.properties.map(property=>[property.name,property]));
 const ranks=new Map(source.xmlOrder.keys.map((name,index)=>[
  byName.has(name)?xmlName(byName.get(name)):name,index]));
 module.representations.xml.fields.sort((left,right)=>
  (ranks.get(left.field)??-1)-(ranks.get(right.field)??-1));
 orderNumericHistory(module);
 return {module,properties:properties.map(row=>row.name)};
}
