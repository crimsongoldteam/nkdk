import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
export const yaml = createRequire(new URL('../../../packages/runtime/package.json',import.meta.url))('js-yaml');

export function candidateCatalog({excludePaths=[]}={}) {
  const excluded=new Set(excludePaths);
  const paths = execFileSync('rg',['--files','rust/declarations'],{encoding:'utf8'}).trim().split('\n')
    .filter(p => p.endsWith('.yaml') && !excluded.has(p)).sort();
  const catalog = new Map(), sourceHashes = [];
  for (const path of paths) {
    const bytes = readFileSync(path,'utf8');
    sourceHashes.push({path,sha256:createHash('sha256').update(bytes).digest('hex')});
    for (const document of yaml.loadAll(bytes)) for (const module of document.kind === 'catalog' ? document.declarations : [document]) {
      if (catalog.has(module.id)) throw new Error(`Duplicate declaration: ${module.id}`);
      catalog.set(module.id,{format:'nkdk-declarations/1',...module});
    }
  }
  return {catalog,sourceHashes};
}

export function dependencyFiles(modules,catalog,{includeIndexes=false}={}) {
  const own = new Set(modules.map(m => m.id)), needed = new Set();
  const projections=new Map([...catalog.values()].flatMap(module=>(module.projections??[]).map(projection=>[projection.id,module])));
  const contributors=new Map();
  const contributed=(module,seen=new Set())=>{
    if(seen.has(module.id))return new Set();
    seen.add(module.id);
    const indexes=new Set((module.contributions??[]).map(row=>row.index));
    for(const id of Object.values(module.imports??{})) {
      const dependency=catalog.get(id)??projections.get(id);
      if(dependency)for(const index of contributed(dependency,seen))indexes.add(index);
    }
    return indexes;
  };
  if(includeIndexes)for(const module of catalog.values())if(['object','resources'].includes(module.kind))
    for(const index of contributed(module)) {
      const previous=contributors.get(index);
      if(!previous || JSON.stringify(module).length<JSON.stringify(previous).length)
        contributors.set(index,module);
    }
  function indexes(module) {
    if(!includeIndexes)return;
    for(const input of Object.values(module.inputs??{}))if(input.index) {
      const producer=contributors.get(input.index);
      if(!producer)throw new Error(`Missing index declaration dependency: ${input.index}`);
      include(producer.id);
    }
  }
  function include(id) {
    if (own.has(id) || needed.has(id)) return;
    const module = catalog.get(id) ?? projections.get(id);
    if (!module) throw new Error(`Missing declaration dependency: ${id}`);
    if(own.has(module.id) || needed.has(module.id))return;
    needed.add(module.id);
    for (const value of Object.values(module.imports ?? {})) include(value);
    indexes(module);
  }
  for (const module of modules) {
    for (const id of Object.values(module.imports ?? {})) include(id);
    indexes(module);
  }
  return [...needed].sort().map(id => catalog.get(id));
}
