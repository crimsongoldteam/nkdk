import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {emitCandidates} from './emit.mjs';
import {propertyContract} from './property-contract.mjs';
import {yaml} from './candidate-catalog.mjs';
import {loadSources} from './source-snapshot.mjs';

export function emptyTextCases(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
  loadSources(extraction.sourceHashes);
  const source=extraction.entries.find(entry=>entry.symbol==='StandardAttributeDescriptionRules');
  const selected={...source,properties:source.properties.filter(p=>p.name==='synonym')};
  const xr='http://v8.1c.ru/8.3/xcf/readable';
  const emitted=emitCandidates([selected],catalog,undefined,{xr});
  const projection=emitted.entries[0].projections[0];
  if(!projection)throw new Error('Missing empty text default contract');
  const local=new Map([...catalog,...emitted.modules.map(module=>[module.id,module])]);
  const {module}=propertyContract(projection,'synonym',local);
  const xmlPath='e2e/fixtures/xml/cf/Enums/ПеречислениеВсеСвойства.xml';
  const yamlPath='e2e/fixtures/nkdk/cf/Перечисление/ПеречислениеВсеСвойства/Свойства.yaml';
  const [example]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{encoding:'utf8',input:JSON.stringify([{xml:xmlPath,propertySelector:`.//{${xr}}StandardAttribute[@name="Ref"]/{${xr}}Synonym`,root:`{${xr}}Synonym`}])}));
  const expected=yaml.load(readFileSync(yamlPath,'utf8')).СтандартныеРеквизиты.Ссылка.Синоним;
  if(typeof expected!=='string' || !expected)throw new Error('Changed independent synonym fixture');
  const common={entry:module.id,inputs:{ownerName:'Ссылка',defaultLanguage:'ru',registeredLanguages:['ru','en']},source:[...example.source,{path:yamlPath,sha256:createHash('sha256').update(readFileSync(yamlPath)).digest('hex')}]};
  const empty=example.xml.replace(/<v8:content>[^<]*<\/v8:content>/,'<v8:content />');
  if(empty===example.xml)throw new Error('Missing original default-language content');
  const ownerTexts=ownerEmptyTextCases(extraction,catalog);
  return {modules:[module,...ownerTexts.modules],cases:[...ownerTexts.cases,
    {...common,id:'empty-text-default-normal',xml:example.xml,yaml:`Синоним: ${expected}`},
    {...common,id:'empty-text-default-shell',xml:`<xr:Synonym xmlns:xr="${xr}"/>`,yaml:''},
    {...common,id:'empty-text-default-empty-translation',xml:empty,annotation:'  !xml/invalid ru: ""'},
    {...common,id:'empty-text-default-other-language',xml:empty.replace('<v8:lang>ru</v8:lang>','<v8:lang>en</v8:lang>'),annotation:'  !xml/invalid en: ""'},
  ]};
}

// Source wiring uses immutable XML and independent YAML expectations. The
// localized-text matrix owns language, repetition and anomaly semantics.
function ownerEmptyTextCases(extraction,catalog) {
  const original=extraction.entries.find(row=>row.symbol==='MetadataCatalogRules');
  const properties=original.properties.filter(row=>row.parameters?.type==='I8nText' &&
    JSON.stringify(row.parameters.defaultValueXMLRaw)==='{}');
  if(properties.length!==6)throw new Error('Changed catalog localized text registrations');
  const emitted=emitCandidates([{...original,propertyStates:[],properties}],catalog);
  const local=new Map([...catalog,...emitted.modules.map(row=>[row.id,row])]);
  const projection=emitted.entries[0].projections[0];
  const xmlPath='e2e/fixtures/xml/cf/Catalogs/СправочникПолный.xml';
  const yamlPath='e2e/fixtures/nkdk/cf/Справочник/СправочникПолный/Свойства.yaml';
  const xml=readFileSync(xmlPath,'utf8'),expected=readFileSync(yamlPath,'utf8');
  const modules=[],cases=[];
  const source=[xmlPath,yamlPath].map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}));
  for(const property of properties) {
    const {module}=propertyContract(projection,property.name,local);
    modules.push(module);
    const tag=module.representations.xml.fields[0].path.at(-1);
    const fragment=xml.match(new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`))?.[0];
    const expectedLine=expected.split('\n').find(line=>line.startsWith(property.parameters.yaml+': '));
    const value=expectedLine&&yaml.load(expectedLine)[property.parameters.yaml];
    if(!fragment || typeof value!=='string')throw new Error('Missing independent localized text fixture: '+tag);
    const wrap=text=>'<Properties xmlns:v8="http://v8.1c.ru/8.1/data/core">'+text+'</Properties>';
    const common={entry:module.id,inputs:{ownerName:'СправочникПолный',defaultLanguage:'ru',registeredLanguages:['ru','en']},source,noRaw:true};
    cases.push({...common,id:'owner-text-'+property.name,xml:wrap(fragment),yaml:yaml.dump({[property.parameters.yaml]:value}).trimEnd()},
      {...common,id:'owner-text-empty-'+property.name,xml:wrap(`<${tag}/>`),
        yaml:property.parameters.excludeIfEqualNameYAML?yaml.dump({[property.parameters.yaml]:''}).trimEnd():''});
  }
  return {modules,cases};
}
