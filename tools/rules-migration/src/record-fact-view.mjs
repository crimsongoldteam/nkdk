import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';

// Build a read-only fact view from one canonical record declaration. Semantic
// expressions remain declarations, and the original conversion stays unchanged.
export function recordFactView(base,extension) {
  if(base.value?.kind!=='record'||extension.value?.kind!=='record'||
    extension.representations?.xml?.kind!=='record')
    throw new Error('Fact view requires record declarations');
  const sections=['imports','namespaces','value','representations','presence','constraints'];
  for(const key of Object.keys(extension))if(!sections.includes(key))
    throw new Error(`Unsupported fact view section: ${key}`);
  for(const key of Object.keys(extension.representations))if(!['xml','yaml'].includes(key))
    throw new Error(`Unsupported fact view representation: ${key}`);
  const view=structuredClone(base);
  const xml=view.representations.xml;
  if(xml.kind==='with-attributes'){
    if(xml.content.kind!=='record'||xml.attributes.some(attribute=>
      !extension.representations.xml.fields.some(field=>field.attribute===attribute.name&&field.path.length===0)))
      throw new Error('Fact view must explicitly retain every source attribute');
    view.representations.xml=xml.content;
  }
  if(view.representations.xml.kind!=='record')throw new Error('Fact view requires an XML record');
  for(const section of ['imports','namespaces'])for(const [key,value] of Object.entries(extension[section]??{})){
    view[section]??={};
    if(Object.hasOwn(view[section],key)&&!isDeepStrictEqual(view[section][key],value))
      throw new Error(`Conflicting fact view ${section}: ${key}`);
    view[section][key]=structuredClone(value);
  }
  for(const field of extension.value.fields){
    if(view.value.fields.some(existing=>existing.name===field.name))
      throw new Error(`Repeated fact view field: ${field.name}`);
    view.value.fields.push(structuredClone(field));
  }
  view.representations.xml.fields.push(...structuredClone(extension.representations.xml.fields));
  view.representations.yaml=structuredClone(extension.representations.yaml??
    {kind:'mapping',fields:view.value.fields.map(field=>({field:field.name,key:field.name}))});
  view.presence=[...view.presence??[],...structuredClone(extension.presence??[])];
  view.constraints=[...view.constraints??[],...structuredClone(extension.constraints??[])];
  view.id=`candidate.member-source.view.${createHash('sha256').update(JSON.stringify(view)).digest('hex').slice(0,20)}`;
  return view;
}

// Read-only source profiles use the declaration's static defaults. Keep the
// predicates themselves; replacing their arguments does not reinterpret them.
export function bindFactDefaults(source) {
  const expand=value=>{
    if(Array.isArray(value))return value.map(expand);
    if(value&&typeof value==='object'){
      if(Object.keys(value).length===1&&typeof value.parameter==='string'){
        const parameter=source.parameters?.[value.parameter];
        if(!parameter||!Object.hasOwn(parameter,'default'))
          throw new Error(`Missing static fact parameter: ${value.parameter}`);
        return {literal:structuredClone(parameter.default)};
      }
      return Object.fromEntries(Object.entries(value).map(([key,value])=>[key,expand(value)]));
    }
    return value;
  };
  const profile=expand(source);
  delete profile.parameters;
  return profile;
}
