import {readFileSync} from 'node:fs';

export function runtimeExports(cases,factSources=[]) {
  return [...new Set([...cases,...factSources].map(item=>item.entry))];
}

export function runtimeExportsFromCaseFile(path) {
  const manifest=JSON.parse(readFileSync(path,'utf8'));
  return runtimeExports(manifest.cases,manifest.factSources).join(',');
}
