import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export function checkSnapshot(sources, snapshot) {
  if (JSON.stringify(Object.keys(sources).sort()) !== JSON.stringify(snapshot.map(s => s.path).sort())) throw new Error('Stale snapshot: source file set changed');
  for (const source of snapshot) if (createHash('sha256').update(sources[source.path]).digest('hex') !== source.sha256) throw new Error(`Stale snapshot: ${source.path}`);
}

export function loadSources(snapshot) {
  const runtime=JSON.parse(readFileSync('packages/runtime/package.json','utf8'));
  if(runtime.exports?.['./rule-kit']!=='./rule-kit.ts')throw new Error('Reviewed runtime rule-kit export changed');
  const paths = execFileSync('rg',['--files','packages/rules','packages/runtime','e2e'],{encoding:'utf8'}).trim().split('\n').filter(p => p.endsWith('.ts')).sort();
  const sources = Object.fromEntries(paths.map(path => [path,readFileSync(path,'utf8')]));
  if (snapshot) checkSnapshot(sources,snapshot);
  return sources;
}
