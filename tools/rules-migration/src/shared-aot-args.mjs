import {resolve,relative} from 'node:path';

export function sharedAotArguments(args,root) {
  const check=args.includes('--check');
  const pairs=args.filter(arg=>arg!=='--check');
  const values=new Map();
  for(let i=0;i<pairs.length;i+=2) {
    const key=pairs[i],value=pairs[i+1];
    if(!['--catalog','--exports','--production-group','--output','--prepared-sources'].includes(key) || !value || values.has(key)) {
      throw new Error('Missing, repeated or unknown shared AOT argument');
    }
    values.set(key,value);
  }
  if(args.filter(arg=>arg==='--check').length>1 || !values.has('--output'))throw new Error('Missing output or repeated --check');
  const output=resolve(values.get('--output'));
  if(relative(root,output).split(/[\\/]/)[0]==='..')throw new Error('Output must be inside this project');
  if(values.has('--production-group')) {
    if(values.size!==(values.has('--prepared-sources')?3:2) || values.get('--production-group')!=='bodies-5')throw new Error('Production mode owns its catalog and exports');
    const result={productionGroup:values.get('--production-group'),output,check};
    if(values.has('--prepared-sources')) {
      const sources=resolve(values.get('--prepared-sources'));
      const within=(parent,child)=>!relative(parent,child).split(/[\\/]/).includes('..');
      if(!within(root,sources) || within(output,sources) || within(sources,output))throw new Error('Prepared source and Cargo directories must be separate inside this project');
      result.sources=sources;
    }
    return result;
  }
  if(values.size!==3 || !values.has('--catalog') || !values.has('--exports'))throw new Error('Expected catalog, exports and output');
  return {catalog:resolve(values.get('--catalog')),exports:resolve(values.get('--exports')),output,check};
}
