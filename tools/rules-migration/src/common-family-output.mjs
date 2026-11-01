import {isDeepStrictEqual} from 'node:util';
import {dependencyFiles,yaml} from './candidate-catalog.mjs';

// Accepted library names stay common.* so the ordinary rules mapper sees them.
export function commonFamilyOutput(generated,catalog,{existingIds=new Set(catalog.keys())}={}) {
  for(const module of generated.modules)if(catalog.has(module.id) && !isDeepStrictEqual(catalog.get(module.id),module))
    throw new Error('Common declaration shadows a different contract: '+module.id);
  const local=new Map([...catalog,...generated.modules.map(module=>[module.id,module])]);
  const roots=generated.modules.filter(module=>module.kind==='value' && module.id.startsWith('common.'));
  const declarations=[...new Map([...roots,...dependencyFiles(roots,local)].map(module=>[module.id,module])).values()]
    .filter(module=>!existingIds.has(module.id));
  if(declarations.some(module=>module.kind==='object'))throw new Error('Object owner cannot belong to a common library');
  return {declarations,yaml:yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations},{noRefs:true})};
}
