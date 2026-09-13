import {dependencyFiles} from './candidate-catalog.mjs';

export function selectContracts(manifest,catalog,caseIds) {
  if(!Array.isArray(caseIds) || !caseIds.every(id=>typeof id==='string') || !caseIds.length || new Set(caseIds).size!==caseIds.length)throw new Error('Select nonempty, unique case identifiers');
  const wanted=new Set(caseIds);
  const known=new Set(manifest.cases.map(c=>c.id));
  if(known.size!==manifest.cases.length)throw new Error('Duplicate case identifier in source manifest');
  for(const id of wanted)if(!known.has(id))throw new Error(`Unknown case: ${id}`);
  const cases=manifest.cases.filter(c=>wanted.has(c.id));
  const indexes=new Set(cases.flatMap(c=>Object.values(c.factBindings??{})));
  const providers=new Set();
  const factSources=(manifest.factSources??[]).filter(source=>{
    const contributions=catalog.get(source.entry)?.contributions??[];
    const provided=contributions.map(c=>c.index).filter(index=>indexes.has(index));
    for(const index of provided)providers.add(index);
    return provided.length>0;
  });
  for(const index of indexes)if(!providers.has(index))throw new Error(`Missing fact provider: ${index}`);
  const roots=[...new Set([...cases,...factSources].map(c=>c.entry))].map(id=>{
    const module=catalog.get(id);
    if(!module)throw new Error(`Missing declaration dependency: ${id}`);
    return module;
  });
  const modules=[...roots,...dependencyFiles(roots,catalog)].sort((a,b)=>a.id.localeCompare(b.id));
  function fields(id,ancestors=new Set()) {
    if(ancestors.has(id))throw new Error(`Composition cycle: ${id}`);
    const module=catalog.get(id), path=new Set([...ancestors,id]);
    const result=(module.value?.fields??[]).map(f=>f.name);
    for(const part of module.compose??[])result.push(...fields(module.imports[part.use],path));
    if(new Set(result).size!==result.length)throw new Error(`Duplicate field in ${id}`);
    return result;
  }
  const propertyCount=[...new Set(cases.map(c=>c.entry))].reduce((n,id)=>n+fields(id).length,0);
  return {modules,propertyCount,manifest:{...manifest,cases,factSources}};
}
