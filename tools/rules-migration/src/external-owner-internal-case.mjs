import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {yaml} from './candidate-catalog.mjs';
import {asOwnerFragment} from './owner-fragment.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';
import {internalInfoAttachment} from './internal-info-attachment.mjs';

export function externalOwnerInternalCases(catalog) {
  const contracts=JSON.parse(readFileSync('tests/migration/rules-contract-cases.json','utf8'));
  const generated=JSON.parse(readFileSync('tests/migration/rules-contract-catalog/manifest.json','utf8')).generatedFiles;
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries;
  const modules=[catalog.get('migration.metadata-child-index')],cases=[];
  const factSources=contracts.factSources.filter(row=>['migration.metadata-root-index','migration.metadata-child-index'].includes(row.entry));
  if(!modules[0] || !factSources.some(row=>row.entry==='migration.metadata-child-index'))throw new Error('Missing owner membership facts');
  const lookup=id=>{
    const source=generated[`${id}.yaml`];
    if(!source)throw new Error(`Missing generated owner declaration: ${id}`);
    return yaml.load(source);
  };
  for(const [symbol,name,kind,xmlPath,yamlPath] of [
    ['MetadataExternalDataSourceTableRules','ТаблицаВсеСвойства','Table',
      'e2e/fixtures/xml/cf/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства.xml',
      'e2e/fixtures/nkdk/cf/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойства/Таблицы/ТаблицаВсеСвойства/Свойства.yaml'],
    ['MetadataExternalDataSourceDimensionTableRules','ТаблицаИзмеренияВсеСвойства','DimensionTable',
      'e2e/fixtures/xml/cf/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml',
      'e2e/fixtures/nkdk/cf/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойства/Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияВсеСвойства/Свойства.yaml'],
  ]) {
    const original=contracts.cases.find(row=>row.id===`e2e-properties-${name}`);
    if(!original)throw new Error(`Missing independent owner projection: ${name}`);
    for(const source of original.source)if(createHash('sha256').update(readFileSync(source.path)).digest('hex')!==source.sha256)
      throw new Error(`Stale owner source: ${source.path}`);
    const primary=lookup(original.entry);
    const owner=extraction.find(entry=>entry.symbol===symbol);
    const internal=internalInfoAttachment(owner);
    if(internal.status!=='candidate')throw new Error(`${symbol}: ${internal.reason}`);
    const parts=[{alias:'internal',fragment:internal.module,bindings:{
      owner:'internalOwner',name:'internalName',typeIds:'typeIds',valueIds:'valueIds'}}];
    for(const [index,part] of primary.compose.entries()) {
      const source=lookup(primary.imports[part.use]);
      const fragment=asOwnerFragment({...source,namespaces:{...source.namespaces,md:'http://v8.1c.ru/8.3/MDClasses'}},
        `${source.id}.joined-${kind}`,['md:MetaDataObject',`md:${kind}`],'md');
      modules.push(fragment);
      parts.push({alias:`properties${index}`,fragment,
        bindings:Object.fromEntries(Object.entries(part.bind??{}).map(([key,value])=>[key,value.input]))});
    }
    const joined=composeOwnerFragments(`candidate.joined.internal-${kind}`,parts);
    for(const [key,input] of Object.entries(primary.inputs??{}))if(input.index) {
      if(!joined.inputs[key])throw new Error(`Missing composed owner input: ${key}`);
      joined.inputs[key].index=input.index;
    }
    joined.inputs.typeIds.index='metadata.internal-type-ids';
    joined.inputs.valueIds.index='metadata.internal-value-ids';
    modules.push(internal.module,joined);
    const [selected]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
      encoding:'utf8',input:JSON.stringify([{xml:xmlPath,yaml:yamlPath,ownerFields:{xmlProjection:original.xml,internalInfo:true}}])}));
    const expected=internal.module.presence[0].yaml.default.sequence[0].record.name.concat[1].input;
    if(expected!=='name')throw new Error('Unexpected generated-name binding');
    const qualifiedName=internal.module.presence[0].yaml.default.sequence[0].record.name.concat[0].literal;
    const segments=xmlPath.split('/');
    const parentNames=segments.flatMap((segment,index)=>['ExternalDataSources','Cubes'].includes(segment)?[segments[index+1]]:[]);
    const fullName=[...parentNames,name].join('.');
    if(!selected.xml.includes(`GeneratedType name="${qualifiedName}${fullName}"`))
      throw new Error(`Unexpected internal type fixture: ${symbol}`);
    cases.push({id:`joined-internal-${kind}`,entry:joined.id,xml:selected.xml,yaml:original.yaml,
      source:selected.source,inputs:{...original.inputs,internalOwner:selected.ownerIdentity,internalName:fullName},
      factBindings:{...original.factBindings,typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids'},
      xmlQNamePaths:selected.xmlQNamePaths});
  }
  return {modules,cases,factSources};
}
