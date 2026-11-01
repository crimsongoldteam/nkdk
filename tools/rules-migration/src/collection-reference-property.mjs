import {commonInputs} from './common-inputs.mjs';

// A checked child collection remains one ordinary declared value.
export function mapCollectionReference(property,descriptor,namespaces={}) {
  const p=property.parameters,module=descriptor?.module;
  const fail=()=>({status:'blocked',reason:'collection-value-profile'});
  if(property.status!=='static-parameters' || !p || module?.kind!=='value' || module.value?.kind!=='sequence' || typeof module.id!=='string' || !module.id ||
    module.representations?.xml?.kind!=='element-sequence' || !Array.isArray(module.representations.xml.path) || module.representations.xml.path.length!==1 ||
    typeof module.representations.xml.path[0]!=='string' ||
    typeof p.xml!=='string' || module.representations.xml.path[0].split(':').at(-1)!==p.xml.split(':').at(-1) ||
    Object.keys(p).some(key=>!['type','xml','xmlParents','yaml','yamlInline','fromYAML','defaultValue'].includes(key)) ||
    (Object.hasOwn(p,'fromYAML') && p.fromYAML!==false) ||
    (Object.hasOwn(p,'defaultValue') && (!Array.isArray(p.defaultValue) || p.defaultValue.length!==0)) ||
    Object.keys(descriptor).some(key=>!['module','bindings','inputs'].includes(key)) ||
    (p.yaml!==undefined && (typeof p.yaml!=='string' || !p.yaml)) ||
    (p.yamlInline!==undefined && typeof p.yamlInline!=='boolean') ||
    !Array.isArray(p.xmlParents??[]) || (p.xmlParents??[]).some(part=>typeof part!=='string'||!part))return fail();
  if(p.xml.includes(':')) {
    const sourcePrefix=p.xml.split(':')[0],targetPrefix=module.representations.xml.path[0].split(':')[0];
    if(!module.representations.xml.path[0].includes(':') || !namespaces[sourcePrefix] ||
      namespaces[sourcePrefix]!==module.namespaces?.[targetPrefix])return fail();
  }
  const context=commonInputs(module);
  const extra=commonInputs({...module,inputs:descriptor.inputs??{}});
  Object.assign(context.imports,extra.imports);
  for(const [name,input] of Object.entries(extra.inputs)) {
    if(!input?.type || Object.hasOwn(context.inputs,name))return fail();
    context.inputs[name]=structuredClone(input);
  }
  for(const [name,expression] of Object.entries(descriptor.bindings??{})) {
    if(!Object.hasOwn(context.bind,name) || !expression || typeof expression!=='object' || Array.isArray(expression))return fail();
    context.bind[name]=structuredClone(expression);
  }
  return {status:'candidate',id:module.id,type:{use:'value',...(Object.keys(context.bind).length?{bind:context.bind}:{})},
    // The legacy parent restored these rows through child-item assembly.
    // A supplied complete collection declaration owns both directions instead.
    ...((Object.hasOwn(p,'fromYAML') || Object.hasOwn(p,'defaultValue'))?{parameterEquivalences:[
      ...(Object.hasOwn(p,'fromYAML')?[{parameter:'fromYAML',equivalentTo:'declared-collection-read',via:module.id}]:[]),
      ...(Object.hasOwn(p,'defaultValue')?[{parameter:'defaultValue',equivalentTo:'empty-declared-collection',via:module.id}]:[]),
    ]}:{}),
    inputs:context.inputs,imports:context.imports,path:p.xmlParents??[],key:p.yaml??property.name,
    // A registered item collection has no YAML key when it has no items.
    // Express this through ordinary presence, including the reverse default.
    presence:{target:{field:property.name},
      xml:{missing:{denotes:{sequence:[]}}},
      yaml:{missing:{denotes:{sequence:[]}},omitWhen:{not:{exists:{in:{field:property.name},as:'row',where:{literal:true}}}}}},
    ...(module.namespaces?{namespaces:structuredClone(module.namespaces)}:{}),
    ...(p.yamlInline?{yamlInline:true}:{})};
}
