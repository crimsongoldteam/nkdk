import {isDeepStrictEqual} from 'node:util';
import {dependencyFiles} from './candidate-catalog.mjs';

function moduleIndexes(catalog,id,own,visited=new Set()) {
  if(visited.has(id))return [];
  const module=catalog.get(id);
  if(!module)return [];
  visited.add(id);
  const nested=[];
  const visit=type=>{
    if(!type||typeof type!=='object')return;
    if(type.use)nested.push(...moduleIndexes(catalog,module.imports?.[type.use],own,visited));
    for(const field of type.fields??[])visit(field.type);
    for(const variant of type.variants??[])visit(variant.type);
    visit(type.item);
  };
  for(const part of module.compose??[])visit(part);
  visit(module.value);
  return [...new Set([...own(module),...nested])];
}

export function providedIndexes(catalog,id) {
  return moduleIndexes(catalog,id,module=>(module.contributions??[]).map(item=>item.index));
}
function requiredIndexes(catalog,id) {
  // Named fact bindings belong to the source entry; nested values use its slots.
  return Object.values(catalog.get(id)?.inputs??{}).flatMap(input=>typeof input.index==='string'?[input.index]:[]);
}

export function selectContracts(manifest,catalog,caseIds) {
  if(!Array.isArray(caseIds) || !caseIds.every(id=>typeof id==='string') || !caseIds.length || new Set(caseIds).size!==caseIds.length)throw new Error('Select nonempty, unique case identifiers');
  const wanted=new Set(caseIds);
  const known=new Set(manifest.cases.map(c=>c.id));
  if(known.size!==manifest.cases.length)throw new Error('Duplicate case identifier in source manifest');
  for(const id of wanted)if(!known.has(id))throw new Error(`Unknown case: ${id}`);
  const cases=manifest.cases.filter(c=>wanted.has(c.id));
  const indexes=new Set(cases.flatMap(c=>Object.values(c.factBindings??{})));
  const selectedSources=cases.every(item=>!Object.keys(item.factBindings??{}).length || Array.isArray(item.factSourceEntries))?
    new Set(cases.flatMap(item=>item.factSourceEntries??[])):undefined;
  const sourceId=source=>source.id??source.entry;
  if(selectedSources)for(const id of selectedSources)
    if(!(manifest.factSources??[]).some(source=>sourceId(source)===id))throw new Error(`Unknown fact source: ${id}`);
  const candidates=(manifest.factSources??[]).filter(source=>!selectedSources || selectedSources.has(sourceId(source)));
  const profiles=new Map(candidates.map(source=>[source.entry,{provided:providedIndexes(catalog,source.entry),required:requiredIndexes(catalog,source.entry)}]));
  const retained=new Set();
  let changed=true;
  while(changed) {
    changed=false;
    for(const source of candidates) {
      const profile=profiles.get(source.entry);
      if(!profile.provided.some(index=>indexes.has(index)))continue;
      retained.add(source);
      for(const index of profile.required)if(!indexes.has(index)){indexes.add(index);changed=true;}
    }
  }
  const factSources=candidates.filter(source=>retained.has(source));
  const providers=new Set(factSources.flatMap(source=>profiles.get(source.entry).provided));
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

// Shared fixtures may reuse one independently prepared source. Named source
// identities are unique; anonymous rows intentionally retain their multiplicity.
export function mergeFactSources(...groups) {
 const sources=[],known=new Map();
 for(const source of groups.flat()) {
  if(source.id!==undefined && known.has(source.id)) {
   if(!isDeepStrictEqual(source,known.get(source.id)))throw new Error(`Conflicting fact source: ${source.id}`);
   continue;
  }
  if(source.id!==undefined)known.set(source.id,source);
  sources.push(source);
 }
 return sources;
}
