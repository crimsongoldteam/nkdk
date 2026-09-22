import {isDeepStrictEqual} from 'node:util';

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
          const renamed=`${alias}_${source}`;
          result.imports[renamed]=dependency;
          value.use=renamed;
        }
        for(const child of Object.values(value))rewriteUses(child);
      };
      rewriteUses(input);
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
