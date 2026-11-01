import {existsSync,readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

// Only explicit committed catalogues extend package boundaries.
export function sharedCatalogues(workspace) {
 const directory=join(workspace,'generated-aot');
 if(!existsSync(directory))return [];
 return readdirSync(directory,{withFileTypes:true}).filter(entry=>entry.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name)).map(entry=>({
  facadeName:`nkdk-shared-catalog-${entry.name}`,
  layout:JSON.parse(readFileSync(join(directory,entry.name,'layout.json'),'utf8')),
 }));
}
