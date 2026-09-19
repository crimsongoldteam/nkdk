import {readFileSync,writeFileSync} from 'node:fs';
import {familyRequirements,legacyCases,parseFamilySelectionArgs,reportFamily,selectFamily} from './family-requirements.mjs';
import {loadSources} from './source-snapshot.mjs';
import {candidateCatalog,dependencyFiles} from './candidate-catalog.mjs';
import {mapProperty} from './mappings.mjs';

const read = name => JSON.parse(readFileSync(`tests/migration/${name}.json`,'utf8'));
const extraction=read('rules-extraction'), inventory=read('rules-inventory');
loadSources(extraction.sourceHashes);
const report=familyRequirements(extraction,read('collection-links'),read('unified-families'));
const {catalog,sourceHashes}=candidateCatalog();
report.declarationHashes=sourceHashes;
for(const family of report.families) {
  const modules=[];
  for(const property of family.properties.filter(p=>!p.collection)) {
    const mapped=mapProperty(property,catalog);
    property.emission=mapped;
    if(mapped.status==='candidate') modules.push({imports:{value:mapped.id,...mapped.imports}});
    else family.blockers.push({path:property.owner.path,symbol:property.owner.symbol,property:property.name,source:property.source,reason:mapped.reason});
  }
  family.declarations=dependencyFiles(modules,catalog).map(module=>module.id);
  Object.assign(family,reportFamily(family));
}
report.blockers=report.families.flatMap(family=>family.blockers.map(blocker=>({family:family.id,...blocker})));
const existing = (() => {
  try { return read('unified-test-map'); }
  catch(error) { if(error.code==='ENOENT')return {cases:[],staleCases:[]}; throw error; }
})();
const testMap=legacyCases(inventory,report.families,existing), {cases}=testMap;
report.scope='Structural requirements and potentially related legacy cases selected by source/import; not semantic coverage or object acceptance';
report.unresolvedRegistrations=read('collection-links').unresolved;
for(const family of report.families)family.legacyCases=cases.filter(c=>c.families.includes(family.id)).map(c=>c.id);
for(const [name,value] of [['unified-family-requirements',report],['unified-test-map',testMap]]) {
  const fields=Object.entries(value).map(([key,item])=>`${JSON.stringify(key)}:${Array.isArray(item)?`[\n${item.map(row=>JSON.stringify(row)).join(',\n')}\n]`:JSON.stringify(item)}`);
  writeFileSync(`tests/migration/${name}.json`,'{\n'+fields.join(',\n')+'\n}\n');
}
const familyId=parseFamilySelectionArgs(process.argv.slice(2));
const selected=familyId===undefined?report.families:selectFamily(report,familyId);
console.log(JSON.stringify({families:selected.map(f=>({
  id:f.id,
  properties:f.properties.length,
  candidates:f.properties.filter(property=>property.emission?.status==='candidate').length,
  commonTypes:f.commonTypes.length,
  legacyCases:f.legacyCases.length,
  blockers:f.blockers.length,
})),legacyCases:cases.length,blockers:report.blockers.length}));
