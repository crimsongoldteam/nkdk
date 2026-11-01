import { createHash } from 'node:crypto';

export function constraintFieldNames(value, fields=new Set()) {
  if(!value || typeof value!=='object')return fields;
  if(typeof value.field==='string')fields.add(value.field);
  for(const child of Object.values(value))constraintFieldNames(child,fields);
  return fields;
}

// Compare already isolated contracts, resolving local import aliases and retaining inputs.
// Equal signatures share a behavioral matrix; they do not accept their complete owners.
export function propertyContractSignature(module) {
  const inputs=new Set();
  function normalize(value) {
    if(Array.isArray(value))return value.map(normalize);
    if(!value || typeof value!=='object')return value;
    if(typeof value.input==='string')inputs.add(value.input);
    return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,child])=>{
      if(key==='use') {
        if(!module.imports?.[child])throw new Error('Unresolved contract import');
        return [key,module.imports[child]];
      }
      return [key,normalize(child)];
    }));
  }
  const {id,format,imports,inputs:declaredInputs,...contract}=module;
  // Filtering unrelated owner constraints may leave an empty list. It has
  // the same behavior as an omitted list; nonempty constraints remain signed.
  if(Array.isArray(contract.constraints) && !contract.constraints.length)delete contract.constraints;
  const normalized=normalize(contract);
  normalized.inputs=Object.fromEntries([...inputs].sort().map(name=>{
    if(!declaredInputs?.[name])throw new Error('Unresolved contract input');
    return [name,normalize(declaredInputs[name])];
  }));
  return JSON.stringify(normalized);
}

// Isolate an existing candidate field only when its contract is independent.
export function propertyContract(projection, field, catalog, container) {
  const matches=projection.fragments.map(id=>catalog.get(id)).filter(module=>module?.value.fields.some(value=>value.name===field));
  if(matches.length!==1)throw new Error('Ambiguous property contract');
  const original=matches[0];
  if(original.shorthands?.length || original.normalization || original.compose?.length || original.representations.xml.kind!=='record' || original.representations.yaml.kind!=='mapping')throw new Error('Unsupported property contract boundary');
  const module=structuredClone(original);
  module.kind='object';
  module.id='contract.property.'+createHash('sha256').update(JSON.stringify([projection.id,field,...(container?[container]:[])])).digest('hex').slice(0,20);
  module.value.fields=module.value.fields.filter(value=>value.name===field);
  for(const side of ['xml','yaml'])module.representations[side].fields=module.representations[side].fields.filter(value=>value.field===field);
  if(module.presence)module.presence=module.presence.filter(value=>{
    if(!value.target?.field)throw new Error('Unsupported property presence boundary');
    return value.target.field===field;
  });
  if(module.constraints)module.constraints=module.constraints.filter(constraint=>{
    const fields=constraintFieldNames(constraint);
    if(!fields.size)throw new Error('Unscoped constraint cannot be isolated');
    if(!fields.has(field))return false;
    if(fields.size!==1)throw new Error('Cross-property constraint cannot be isolated');
    return true;
  });
  function independent(value) {
    if(!value || typeof value!=='object')return;
    if(Object.hasOwn(value,'field') && value.field!==field)throw new Error('Cross-property contract cannot be isolated');
    for(const child of Object.values(value))independent(child);
  }
  independent(module);
  if(container) {
    if(!/^[A-Za-z][A-Za-z0-9]*$/.test(container))throw new Error('Invalid property container');
    for(const value of module.representations.xml.fields)value.path.unshift(container);
  }
  return {module,source:{entry:module.id,sourceProjection:projection.id,sourceFragment:original.id,field,...(projection.sourceTag?{sourceTag:projection.sourceTag}:{}),...(container?{container,adaptation:'Relative field paths bound to an explicit test container'}:{})}};
}
