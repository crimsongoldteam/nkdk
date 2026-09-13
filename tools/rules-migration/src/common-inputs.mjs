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
    if(Object.hasOwn(target,name) && JSON.stringify(target[name])!==JSON.stringify(type))throw new Error(`Conflicting input declaration: ${name}`);
    target[name]=type;
  }
}
