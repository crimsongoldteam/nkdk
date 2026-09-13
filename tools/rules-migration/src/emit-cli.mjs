import { readFileSync, writeFileSync } from 'node:fs';
import { emitCandidates } from './emit.mjs';
import { writeCandidates } from './candidate-output.mjs';
import { candidateCatalog,dependencyFiles,yaml } from './candidate-catalog.mjs';
import { ts } from './syntax.mjs';
import { loadSources } from './source-snapshot.mjs';
import { candidateReport } from './candidate-report.mjs';
import { candidateDiff } from './candidate-diff.mjs';
import { literalFixture } from './test-cases.mjs';

const extraction = JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
const sources = new Map(Object.entries(loadSources(extraction.sourceHashes)));
const parsed = new Map();
function origin(property) {
  const {path,line,column} = property.source;
  if (!parsed.has(path)) parsed.set(path,ts.createSourceFile(path,sources.get(path),ts.ScriptTarget.Latest,true));
  const file = parsed.get(path), position = file.getPositionOfLineAndCharacter(line-1,column-1);
  const statement = file.statements.find(s => s.getStart() <= position && position < s.end);
  const declaration = statement && ts.isVariableStatement(statement) ? statement.declarationList.declarations.find(d => d.getStart() <= position && position < d.end) : statement;
  return `${path}#${declaration?.name?.getText() ?? 'module'}`;
}
const {catalog,sourceHashes} = candidateCatalog();
const namespacePath='packages/rules/metadata/forms/clientApplicationForm/namespaces.ts';
const namespaceSource=literalFixture(namespacePath,sources.get(namespacePath),'FORM_NAMESPACES');
const namespaces=Object.fromEntries(Object.entries(namespaceSource.data).filter(([name])=>name.startsWith('_xmlns:')).map(([name,uri])=>[name.slice(7),uri]));
const emitted = emitCandidates(extraction.entries,catalog,origin,namespaces);
const dependencies = dependencyFiles(emitted.modules,catalog);
const files = Object.fromEntries([...emitted.modules,...dependencies].map(module =>
  [`${module.id}.yaml`,yaml.dump(module,{noRefs:true,lineWidth:120,quotingType:'"'})]));
const blocked = new Map();
let count = 0;
for (const entry of emitted.entries) for (const property of entry.properties) {
  if (property.status === 'candidate') count++;
  else blocked.set(property.reason,(blocked.get(property.reason) ?? 0)+1);
}
const manifest = {version:1,status:'candidates-only',sourceRevision:extraction.sourceRevision,
  sourceHashes:extraction.sourceHashes,declarationHashes:sourceHashes,
  xmlNamespaces:{source:namespaceSource.source,bindings:namespaces},
  existingComparison:candidateDiff(emitted.modules,catalog),
  summary:{properties:count,fragments:emitted.modules.filter(m => m.kind === 'fragment').length,
    projections:emitted.modules.filter(m => m.kind === 'object').length,dependencies:dependencies.length,
    blockers:[...blocked].sort((a,b) => b[1]-a[1])},entries:emitted.entries};
writeCandidates('tests/migration/rules-candidates',files,manifest);
writeFileSync('docs/superpowers/reports/2026-09-12-rules-candidates.md',candidateReport(manifest));
const {blockers,...totals} = manifest.summary;
console.log(JSON.stringify({...totals,blockedPropertyOccurrences:blockers.reduce((n,[,count]) => n+count,0)}));
