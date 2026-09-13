import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {yaml,dependencyFiles} from './candidate-catalog.mjs';
import {loadSources} from './source-snapshot.mjs';
import {composeAttachment} from './compose-attachment.mjs';

export function readyOwnerCases(entries,catalog,externalCases) {
  const root='tests/migration/rules-contract-catalog/';
  const snapshot=JSON.parse(readFileSync(root+'manifest.json','utf8'));
  const manifest=JSON.parse(readFileSync('tests/migration/rules-contract-cases.json','utf8'));
  const candidates=JSON.parse(readFileSync('tests/migration/rules-candidates/manifest.json','utf8'));
  loadSources(candidates.sourceHashes);
  for(const row of [...candidates.declarationHashes,...manifest.sources])if(createHash('sha256').update(readFileSync(row.path)).digest('hex')!==row.sha256)throw new Error(`Stale migration source: ${row.path}`);
  const contractCatalog=new Map();
  for(const [path,text]of Object.entries(snapshot.generatedFiles)) {
    if(readFileSync(root+path,'utf8')!==text)throw new Error(`Modified contract: ${path}`);
    const module=yaml.load(text);contractCatalog.set(module.id,module);
  }
  for(const [id,module]of catalog)if(!contractCatalog.has(id))contractCatalog.set(id,module);
  const modules=[],cases=[];
  for(const [symbol,caseId]of [['MetadataConfigurationRules','e2e-properties-Конфигурация'],['MetadataCommonFormRules','e2e-properties-Button']]) {
    const mapped=entries.find(row=>row.symbol===symbol && row.property==='help');
    if(mapped?.status!=='ready')throw new Error(`Missing ready attachment: ${symbol}`);
    const source=manifest.cases.find(row=>row.id===caseId);
    if(!source)throw new Error(`Missing independent case: ${caseId}`);
    for(const row of source.source??[])if(createHash('sha256').update(readFileSync(row.path)).digest('hex')!==row.sha256)throw new Error(`Stale fixture: ${row.path}`);
    const primary=contractCatalog.get(source.entry);
    const module=composeAttachment(primary,mapped,`candidate.joined.${symbol}`);
    modules.push(module);
    const help=externalCases.cases.find(row=>row.entry==='candidate.attachment.fragment.help');
    // Existing expectations remain unchanged; the ordinary external Help value is omitted.
    for(const present of [false,true])cases.push({...source,id:`joined-${symbol}-${present?'external-help':'absent-help'}`,entry:module.id,
      inputs:{...source.inputs,attachment_pages:present?help.inputs.pages:[]},
      ...(present?{documents:help.documents}:{documents:[]}),
      scope:'Properties projection plus Help; external-present case combines independent e2e fixtures, not a full owner'});
  }
  for(const id of new Set(manifest.factSources.map(source=>source.entry))) {
    const provider=contractCatalog.get(id);
    if(!provider)throw new Error(`Missing fact provider: ${id}`);
    modules.push(provider);
  }
  const dependencies=dependencyFiles(modules,contractCatalog);
  return {modules:[...modules,...dependencies],cases,factSources:manifest.factSources};
}
