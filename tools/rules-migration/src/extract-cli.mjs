import { exposedRules } from './exposed-rules.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { extract } from './extract.mjs';
import { assembled } from './assembled.mjs';
import { compare } from './compare.mjs';
import { extractionReport } from './extraction-report.mjs';
import { loadSources } from './source-snapshot.mjs';

const inventory = JSON.parse(readFileSync('tests/migration/rules-inventory.json', 'utf8'));
const sources = loadSources(inventory.files);
const requests = inventory.files.filter(f => f.category === 'production' && /\/(?:rules|childRules)\.ts$/.test(f.path))
  .flatMap(f => f.definitions.filter(d => d.kind === 'VariableDeclaration' && /Rules$/.test(d.name)).map(d => ({path:f.path, symbol:d.name})));
const extracted = extract(sources, requests);
const comparable = extracted.filter(e => e.exportStatus === 'owner-candidate');
const exposed=exposedRules(sources,extracted);
const runtime = assembled([...comparable.map(({path,symbol}) => ({path,symbol})),...exposed]);
const loaded = new Map(runtime.map(e => [`${e.path}:${e.symbol}`, e]));
const entries = extracted.map(entry => ({...entry, propertyStates:loaded.get(`${entry.path}:${entry.symbol}`)?.propertyStates??null, runtimeAccess:exposed.find(item=>item.path===entry.path&&item.symbol===entry.symbol)?.via, comparison:compare(entry,
  loaded.get(`${entry.path}:${entry.symbol}`) ?? {status:entry.exportStatus})}));
const summary = {};
for (const entry of entries) summary[entry.comparison.status] = (summary[entry.comparison.status] ?? 0) + 1;
const result = {version:1, sourceRevision:inventory.sourceRevision,
  scope:'Item *Rules variables in inventoried rules.ts and childRules.ts, including local rules exposed through owners; key/order comparison is not semantic migration acceptance',
  sourceHashes:inventory.files.map(f => ({path:f.path, sha256:f.sha256})), summary, entries};
writeFileSync('tests/migration/rules-extraction.json', `${JSON.stringify(result, null, 2)}\n`);
writeFileSync('docs/superpowers/reports/2026-09-12-rules-extraction.md', extractionReport(result));
console.log(JSON.stringify(summary));
if (entries.some(e => e.comparison.status === 'mismatch' || e.comparison.status === 'load-error')) process.exitCode = 1;
