import {execFileSync} from 'node:child_process';
// Fixture orchestration only. The production project supplies this context;
// its source is the component's Configuration.xml, never an owner name.
export function attachCompatibilityContext(modules,cases) {
 const contexts=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify(['e2e/fixtures/xml/cf/Configuration.xml','e2e/fixtures/xml/cfe/all-extension/Configuration.xml']
   .map(xml=>({xml,configurationCompatibility:true}))),encoding:'utf8'}));
 const entries=new Map(modules.map(module=>[module.id,module]));
 for(const example of cases) {
  if(!entries.get(example.entry)?.inputs?.compatibilityMode)continue;
  const context=contexts[example.source[0].path.startsWith('e2e/fixtures/xml/cfe/')?1:0];
  example.inputs.compatibilityMode??=context.compatibilityMode;
  for(const source of context.source)if(!example.source.some(row=>row.path===source.path))example.source.push(source);
 }
}
