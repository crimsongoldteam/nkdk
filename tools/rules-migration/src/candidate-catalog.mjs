import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
export const yaml = createRequire(new URL('../../../packages/runtime/package.json',import.meta.url))('js-yaml');

export function candidateCatalog() {
  const paths = execFileSync('rg',['--files','rust/declarations'],{encoding:'utf8'}).trim().split('\n').filter(p => p.endsWith('.yaml')).sort();
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

export function dependencyFiles(modules,catalog) {
  const own = new Set(modules.map(m => m.id)), needed = new Set();
  function include(id) {
    if (own.has(id) || needed.has(id)) return;
    const module = catalog.get(id);
    if (!module) throw new Error(`Missing declaration dependency: ${id}`);
    needed.add(id);
    for (const value of Object.values(module.imports ?? {})) include(value);
  }
  for (const module of modules) for (const id of Object.values(module.imports ?? {})) include(id);
  return [...needed].sort().map(id => catalog.get(id));
}
