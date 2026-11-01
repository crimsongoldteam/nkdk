import {isDeepStrictEqual} from 'node:util';

// Additional state fields reuse the owner's history rather than creating a
// second XML route or YAML key for the same rows.
export function mergeOwnerHistory(id,fragment,additional) {
  const extra=structuredClone(additional);
  const defaults=extra.presence.find(row=>row.target.field==='history')?.yaml?.default?.concat;
  if(!defaults || !fragment.presence.find(row=>row.target.field==='history')?.yaml?.default?.concat)
    throw new Error('Shared scalar history required');
  extra.value.fields=extra.value.fields.filter(row=>row.name!=='history');
  for(const side of ['xml','yaml'])extra.representations[side].fields=extra.representations[side].fields.filter(row=>row.field!=='history');
  extra.presence=extra.presence.filter(row=>row.target.field!=='history');
  const module=mergeOwnerFragments(id,[fragment,extra]);
  module.presence.find(row=>row.target.field==='history').yaml.default.concat.push(...defaults);
  return module;
}

export function mergeOwnerFragments(id,fragments) {
  if(!id || !Array.isArray(fragments) || fragments.length<2)throw new Error('Owner record merge needs at least two fragments');
  const merged={format:'nkdk-declarations/1',kind:'fragment',id,imports:{},namespaces:{},inputs:{},
    value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}},presence:[]};
  const names=new Set(),paths=new Set(),keys=new Set(),constraintIds=new Set(),relationFields=new Set();
  for(const fragment of fragments) {
    if(fragment.kind!=='fragment' || fragment.value?.kind!=='record' || fragment.representations?.xml?.kind!=='record' || fragment.representations?.yaml?.kind!=='mapping' ||
      Object.keys(fragment).some(key=>!['format','kind','id','imports','namespaces','inputs','value','representations','presence','constraints','state-relations'].includes(key)))throw new Error('Unsupported owner record fragment');
    for(const [section,source] of [['imports',fragment.imports??{}],['namespaces',fragment.namespaces??{}],['inputs',fragment.inputs??{}]])
      for(const [key,value] of Object.entries(source)) {
        if(Object.hasOwn(merged[section],key) && !isDeepStrictEqual(merged[section][key],value))throw new Error(`Conflicting owner ${section}: ${key}`);
        merged[section][key]=structuredClone(value);
      }
    for(const field of fragment.value.fields) {
      if(names.has(field.name))throw new Error(`Duplicate owner field: ${field.name}`);
      names.add(field.name);merged.value.fields.push(structuredClone(field));
    }
    for(const field of fragment.representations.xml.fields) {
      const route=JSON.stringify(field.path);
      if(paths.has(route))throw new Error(`Duplicate owner XML path: ${route}`);
      paths.add(route);merged.representations.xml.fields.push(structuredClone(field));
    }
    for(const field of fragment.representations.yaml.fields) {
      if(keys.has(field.key))throw new Error(`Duplicate owner YAML key: ${field.key}`);
      keys.add(field.key);merged.representations.yaml.fields.push(structuredClone(field));
    }
    merged.presence.push(...structuredClone(fragment.presence??[]));
    for(const [section,identity,seen,label] of [['constraints','id',constraintIds,'constraint'],['state-relations','field',relationFields,'state relation']])
      for(const row of fragment[section]??[]) {
        if(seen.has(row[identity]))throw new Error(`Duplicate owner ${label}: ${row[identity]}`);
        seen.add(row[identity]);(merged[section]??=[]).push(structuredClone(row));
      }
  }
  return merged;
}

export function composeOwnerFragments(id,parts) {
  const result={format:'nkdk-declarations/1',kind:'object',id,imports:{},inputs:{},
    compose:[],value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
  for(const {alias,fragment,bindings} of parts) {
    if(fragment.kind!=='fragment' || !alias || Object.hasOwn(result.imports,alias))throw new Error('Invalid owner fragment');
    if(!isDeepStrictEqual(Object.keys(bindings).sort(),Object.keys(fragment.inputs??{}).sort()))throw new Error('Incomplete owner fragment bindings');
    result.imports[alias]=fragment.id;
    const bind={};
    for(const [name,target] of Object.entries(bindings)) {
      const input=structuredClone(fragment.inputs[name]);
      const rewriteUses=value=>{
        if(!value || typeof value!=='object')return;
        if(typeof value.use==='string') {
          const source=value.use,dependency=fragment.imports?.[source];
          if(!dependency)throw new Error(`Missing input type import: ${source}`);
          const renamed=Object.entries(result.imports).find(([,id])=>id===dependency)?.[0]??`${alias}_${source}`;
          result.imports[renamed]=dependency;
          value.use=renamed;
        }
        for(const child of Object.values(value))rewriteUses(child);
      };
      rewriteUses(input);
      if(typeof target==='object' && target!==null && !Array.isArray(target) && Object.keys(target).length) {
        bind[name]=structuredClone(target);
        continue;
      }
      if(typeof target!=='string' || !target)throw new Error(`Invalid owner binding: ${name}`);
      if(Object.hasOwn(result.inputs,target) && !isDeepStrictEqual(result.inputs[target],input))throw new Error(`Conflicting owner input: ${target}`);
      result.inputs[target]=input;
      bind[name]={input:target};
    }
    result.compose.push({use:alias,bind});
    for(const [prefix,uri]of Object.entries(fragment.namespaces??{})) {
      result.namespaces??={};
      if(result.namespaces[prefix] && result.namespaces[prefix]!==uri)throw new Error(`Conflicting namespace: ${prefix}`);
      result.namespaces[prefix]=uri;
    }
  }
  return result;
}
