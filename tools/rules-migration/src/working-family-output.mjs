import {dependencyFiles,yaml} from './candidate-catalog.mjs';
import {isDeepStrictEqual} from 'node:util';
import {renameDeclarationModules} from './declaration-identifiers.mjs';

// Promote the checked family assembly, preserving its dependency graph and
// independent examples. Only local declaration identifiers change.
export function workingFamilyOutput(generated,catalog,{rename,scope}) {
  for(const module of generated.modules)if(catalog.has(module.id) && !isDeepStrictEqual(catalog.get(module.id),module))
    throw new Error('Working declaration shadows a different shared contract: '+module.id);
  const local=new Map([...catalog,...generated.modules.map(module=>[module.id,module])]);
  const roots=[...new Set([...generated.cases,...generated.factSources].map(row=>row.entry))]
    .map(id=>{const module=local.get(id);if(!module)throw new Error('Missing working root: '+id);return module;});
  const modules=[...roots,...dependencyFiles(roots,local)].filter(module=>!catalog.has(module.id));
  const names=new Map(modules.map(module=>[module.id,rename(module)]));
  if(new Set(names.values()).size!==names.size || [...names.values()].some(id=>!id))
    throw new Error('Ambiguous working family identifiers');
  const renamed=id=>names.get(id)??id;
  const renamedModules=renameDeclarationModules(modules,renamed);
  for(const module of renamedModules)if(catalog.has(module.id) && !isDeepStrictEqual(catalog.get(module.id),module))
    throw new Error('Ambiguous working family identifiers: '+module.id);
  const declarations=renamedModules.filter(module=>!catalog.has(module.id));
  return {
    declarations,
    yaml:yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations},{noRefs:true}),
    manifest:{scope,...(generated.ownerRequirements?{ownerRequirements:structuredClone(generated.ownerRequirements)}:{}),cases:generated.cases.map(row=>({...row,entry:renamed(row.entry)})),
      factSources:generated.factSources.map(row=>({...row,entry:renamed(row.entry)}))},
  };
}
