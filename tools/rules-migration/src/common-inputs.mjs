import { createHash } from 'node:crypto';

export function commonInputs(common) {
  const imports={},inputs=structuredClone(common.inputs??{}),bind={};
  function qualify(value) {
    if(!value || typeof value!=='object')return;
    if(Object.hasOwn(value,'use')) {
      const target=common.imports?.[value.use];
      if(!target)throw new Error('Unresolved common input type');
      const alias='inputType'+createHash('sha256').update(target).digest('hex').slice(0,12);
      imports[alias]=target;value.use=alias;
    }
    for(const child of Object.values(value))qualify(child);
  }
  for(const [name,input] of Object.entries(inputs)) {
    if(!input.type)throw new Error('Named index input needs an explicit provider');
    qualify(input.type);bind[name]={input:name};
  }
  return {imports,inputs,bind};
}

export function mergeInputs(target, source) {
  for(const [name,type] of Object.entries(source)) {
    if(Object.hasOwn(target,name) && JSON.stringify(target[name])!==JSON.stringify(type))throw new Error(`Conflicting input declaration: ${name}; existing=${JSON.stringify(target[name])}; incoming=${JSON.stringify(type)}`);
    target[name]=type;
  }
}

export function mergeMappedInputs(target, mapped) {
  const source=mapped.inputs??{};
  for(const [name,type] of Object.entries(source)) {
    const alias=Object.hasOwn(target,name) && JSON.stringify(target[name])!==JSON.stringify(type)
      ? `${name}_${createHash('sha256').update(JSON.stringify(type)).digest('hex').slice(0,20)}` : name;
    if(Object.hasOwn(target,alias) && JSON.stringify(target[alias])!==JSON.stringify(type))throw new Error(`Conflicting input alias: ${alias}`);
    if(alias!==name) {
      const rename=value=>{
        if(!value || typeof value!=='object')return;
        if(value.input===name)value.input=alias;
        for(const child of Object.values(value))rename(child);
      };
      for(const field of ['type','file','presence','constraints','ownerConstraints'])rename(mapped[field]);
      if(Object.hasOwn(mapped.indexProviders??{},name)) {
        mapped.indexProviders[alias]=mapped.indexProviders[name];
        delete mapped.indexProviders[name];
      }
      delete source[name];source[alias]=type;
    }
    target[alias]=type;
  }
}

export function bindSiblingExpressions(fields, missing) {
  for(const {mapped} of fields) for(const [input,spec] of Object.entries(mapped.siblingExpressions??{})) {
    const sibling=fields.find(field=>field.property.name===spec.source && field.mapped.status==='candidate' && field.mapped.id===spec.sourceId);
    if(!sibling) {missing(input,spec.source,spec);continue;}
    (mapped.type.bind??={})[input]=structuredClone(spec.value);
    delete mapped.inputs?.[input];
  }
}
