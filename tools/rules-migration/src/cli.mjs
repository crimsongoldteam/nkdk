import { loadSources } from './source-snapshot.mjs';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { inventory } from './inventory.mjs';
import { groupOf, summarize } from './summary.mjs';
import { report } from './report.mjs';

const sources = loadSources();
const result = inventory(sources);
result.sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
const coverage = JSON.parse(readFileSync('tests/migration/coverage.json', 'utf8'));
const entries = new Map(coverage.entries.map(e => [e.path, e]));
function category(file) {
  if (/(__fixtures__|\.snap\.)/.test(file.path)) return 'fixture';
  if (/\.(test|spec)\.ts$/.test(file.path) || file.path.startsWith('e2e/')) return 'test';
  return 'production';
}
for (const file of result.files) {
  file.category = category(file);
  file.group = groupOf(file.path);
  const entry = entries.get(file.path);
  file.coverage = entry ? {status: entry.status, hashMatches: entry.sha256 === file.sha256, implementation: entry.implementation} : null;
  // Keep evidence coordinates and expression shapes without duplicating whole function bodies.
  for (const call of file.calls) call.arguments = call.arguments.map(a => ({...a, text: a.text.slice(0, 240), truncated: a.text.length > 240}));
  for (const expr of file.expressions) { expr.truncated = expr.text.length > 240; expr.text = expr.text.slice(0, 240); }
  for (const object of file.objects) for (const field of object.fields ?? []) {
    field.truncated = field.expression.length > 240; field.expression = field.expression.slice(0, 240);
  }
  if (file.category !== 'production') {
    file.objects = [];
    file.calls = [];
    file.expressions = [];
    // Fixture spreads are data, not migration blockers. Test extraction has its own status.
    file.blockers = file.blockers.filter(b => b.reason === 'unresolved-relative-import');
  }
}
result.summary = structuredClone(summarize(result.files));
result.coverageNotScanned = coverage.entries.filter(e => !Object.hasOwn(sources, e.path)).map(e => e.path);
writeFileSync('docs/superpowers/reports/2026-09-12-rules-migration-inventory.md', report(result));
for (const file of result.files) {
  file.definitions = file.definitions.filter(d => d.topLevel);
  file.objects = file.objects.filter(o => /\/(rules|builders)\.ts$/.test(file.path) || /properties|rules/i.test(o.name));
  const callGroups = new Map();
  for (const call of file.calls) {
    const key = JSON.stringify([call.callee, call.target]);
    const item = callGroups.get(key) ?? {callee: call.callee, target: call.target, sites: [], examples: []};
    item.sites.push([call.source.line, call.source.column]);
    if (item.examples.length < 2) item.examples.push(call.arguments);
    callGroups.set(key, item);
  }
  file.calls = [...callGroups.values()];
  const expressions = new Map();
  for (const expression of file.expressions) {
    const item = expressions.get(expression.kind) ?? {kind: expression.kind, sites: [], examples: []};
    item.sites.push([expression.source.line, expression.source.column]);
    if (item.examples.length < 3) item.examples.push(expression.text);
    expressions.set(expression.kind, item);
  }
  file.expressions = [...expressions.values()];
}
result.command = 'node tools/rules-migration/src/cli.mjs';
// Omitted path in a location means the containing file; original sources remain hash-addressed.
result.locationConvention = 'location.path omitted when equal to containing file.path';
for (const file of result.files) {
  function compact(value) {
    if (!value || typeof value !== 'object') return;
    if (value.path === file.path && typeof value.line === 'number') delete value.path;
    for (const child of Object.values(value)) compact(child);
  }
  compact(file);
}
const {files, ...header} = result;
writeFileSync('tests/migration/rules-inventory.json', `${JSON.stringify(header).slice(0, -1)},"files":[\n${files.map(f => JSON.stringify(f)).join(',\n')}\n]}\n`);
console.log(JSON.stringify({files: result.files.length, production: result.files.filter(f => f.category === 'production').length,
  tests: result.files.reduce((n, f) => n + f.tests.length, 0), parseErrors: result.files.reduce((n, f) => n + f.parseErrors.length, 0)}));
