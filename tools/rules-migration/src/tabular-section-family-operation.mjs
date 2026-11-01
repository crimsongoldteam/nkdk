import {existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {candidateCatalog,yaml} from './candidate-catalog.mjs';
import {emitBaseCollections} from './base-collection.mjs';
import {internalInfoAttachment} from './internal-info-attachment.mjs';
import {assembleTabularSection} from './tabular-section-assembly.mjs';
import {rootSource,sourceOwnerXmlRoute} from './owner-root-source.mjs';

const md='http://v8.1c.ru/8.3/MDClasses';
const fixtureRoot='e2e/fixtures/xml/cf';
const fixtureFolders=readdirSync(fixtureRoot,{withFileTypes:true})
  .filter(item=>item.isDirectory()).map(item=>item.name);

function canonicalExtensionYaml(text,standardNames) {
  // Legacy extension YAML spells an empty ChoiceForm element as null; the
  // declaration omits it while restoring the same XML element.
  let result=text;
  for(const yamlName of Object.values(standardNames)) {
    const row=`  ${yamlName}:\n    ФормаВыбора: null`;
    if(result.includes(row))result=result.replace(row,`  ${yamlName}:\n    {}`);
  }
  return result.replace(/^    ФормаВыбора: null(?:\n|$)/gm,'');
}

function projectedFixtures(requests) {
  return JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify(requests),encoding:'utf8'}));
}

function fixtureOwner(kind,name) {
  if(!name || /[/\\]/.test(name))throw new Error(`Unsafe fixture owner name: ${name}`);
  const paths=fixtureFolders.map(folder=>join(fixtureRoot,folder,`${name}.xml`)).filter(existsSync);
  const matches=projectedFixtures(paths.map(xml=>({xml,ownerHeader:true})))
    .map((header,index)=>({header,xml:paths[index]}))
    .filter(item=>item.header.kind===kind && item.header.name===name);
  if(matches.length!==1)throw new Error(`Ambiguous e2e metadata owner: ${kind}.${name}`);
  return matches[0];
}
const sources=[
  {owner:'MetadataBusinessProcessRules',item:'MetadataBusinessProcessTabularSectionRules',
    folder:'BusinessProcesses',yamlFolder:'БизнесПроцесс',name:'БизнесПроцессВсеСвойства'},
  {owner:'MetadataCatalogRules',item:'MetadataCatalogTabularSectionRules',
    folder:'Catalogs',yamlFolder:'Справочник',name:'СправочникВладелец',
    tabularName:'ТабличнаяЧастьПолный'},
  {owner:'MetadataChartOfAccountsRules',item:'MetadataChartOfAccountsTabularSectionRules',
    folder:'ChartsOfAccounts',yamlFolder:'ПланСчетов',name:'ПланСчетовВсеСвойства'},
  {owner:'MetadataChartOfCalculationTypesRules',item:'MetadataChartOfCalculationTypesTabularSectionRules',
    folder:'ChartsOfCalculationTypes',yamlFolder:'ПланВидовРасчета',name:'ПланРасчетаВсеСвойства'},
  {owner:'MetadataChartOfCharacteristicTypesRules',item:'MetadataChartOfCharacteristicTypesTabularSectionRules',
    folder:'ChartsOfCharacteristicTypes',yamlFolder:'ПланВидовХарактеристик',
    name:'ПланВидовХарактеристикВсеСвойства',tabularName:'ТабличнаяЧасть'},
  {owner:'MetadataDataProcessorRules',item:'MetadataDataProcessorTabularSectionRules',
    folder:'DataProcessors',yamlFolder:'Обработка',name:'ОбработкаВсеСвойства'},
  {owner:'MetadataDocumentRules',item:'MetadataDocumentTabularSectionRules',
    folder:'Documents',yamlFolder:'Документ',name:'ДокументВсеСвойства',
    tabularName:'ТабличнаяЧасть'},
  {owner:'MetadataExchangePlanRules',item:'MetadataExchangePlanTabularSectionRules',
    folder:'ExchangePlans',yamlFolder:'ПланОбмена',name:'ПланОбменаВсеСвойства'},
  {owner:'MetadataReportRules',item:'MetadataReportTabularSectionRules',
    folder:'Reports',yamlFolder:'Отчет',name:'ОтчетВсеСвойства'},
  {owner:'MetadataTaskRules',item:'MetadataTaskTabularSectionRules',
    folder:'Tasks',yamlFolder:'Задача',name:'ЗадачаВсеСвойства'},
].flatMap(source=>[source,{...source,name:source.name+'Ext',component:'cfe/all-extension'}]);
const catalogSource=sources.find(source=>source.folder==='Catalogs' && !source.component);
if(!catalogSource)throw new Error('Missing base catalog tabular-section example');
sources.push({...catalogSource,
  tabularName:'ТабличнаяЧастьМинимальный',caseLabel:'minimal'});

export function tabularSectionFamilyOperation(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  const modules=[],cases=[],factSources=[];
  for(const source of sources) {
    const variant=(source.component?'.cfe':'.cf')+(source.caseLabel?`.${source.caseLabel}`:'');
    const edge=graph.edges.filter(item=>item.owner.symbol===source.owner &&
      item.item.symbol===source.item && item.property==='tabularSections');
    const nestedGraph={...graph,edges:graph.edges.filter(item=>item.owner.symbol===source.item &&
      item.property==='attributes')};
    if(edge.length!==1 || nestedGraph.edges.length!==1)throw new Error(`Incomplete tabular-section links: ${source.item}`);
    const rule=extraction.entries.find(item=>item.symbol===source.item);
    const nested=emitBaseCollections(nestedGraph,extraction.entries,catalog,{md});
    if(nested.results[0].status!=='candidate')throw new Error(`Blocked nested attributes: ${source.item}`);
    modules.push(...nested.modules);
    const internal=internalInfoAttachment(rule);
    if(internal.status!=='candidate')throw new Error(`Blocked internal types: ${source.item}`);
    const internalSource=structuredClone(catalog.get('migration.journal-internal-types'));
    internalSource.id=internal.module.id+'.source';
    internalSource.representations=structuredClone(internal.module.representations);
    internalSource.namespaces=internal.module.namespaces;
    modules.push(internal.module,internalSource);
    const assembled=assembleTabularSection(catalog,rule,
      nested.modules.find(item=>item.id===nested.results[0].declaration),internal.module,
      `migration.${source.item.replace(/Rules$/,'')}`);
    for(const [name,index] of [['roots','metadata.roots'],['forms','metadata.forms']])
      if(assembled.entry.inputs[name])assembled.entry.inputs[name]={index};
    modules.push(...assembled.modules);
    const standardNames=rule.properties.find(item=>item.name==='standardAttributes')?.parameters.standartAttributeNames;
    if(!standardNames || !Object.keys(standardNames).length)throw new Error(`Missing standard attribute names: ${source.item}`);
    const paths={xml:`e2e/fixtures/xml/${source.component??'cf'}/${source.folder}/${source.name}.xml`,
      yaml:`e2e/fixtures/nkdk/${source.component?'cfe/Расширение_All':'cf'}/${source.yamlFolder}/${source.name}/Свойства.yaml`};
    const child={type:'TabularSection',name:source.tabularName ?? 'ТабличнаяЧастьВсеСвойства'};
    const example=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
      input:JSON.stringify([{...paths,xmlItems:[child],
        yamlPath:['ТабличныеЧасти',child.name],wholeItem:true}]),encoding:'utf8'}))[0];
    const ownerRule=extraction.entries.find(entry=>entry.symbol===source.owner);
    const ownerKind=sourceOwnerXmlRoute(ownerRule)[1].slice(3);
    const ownRoot=rootSource(catalog,assembled.entry.id+'.root',ownerKind);
    modules.push(ownRoot);
    const formsPath=join(dirname(paths.xml),source.name,'Forms');
    const formPaths=readdirSync(formsPath,{withFileTypes:true})
      .filter(item=>item.isFile() && item.name.endsWith('.xml'))
      .map(item=>join(formsPath,item.name)).sort();
    const formExamples=projectedFixtures(formPaths.map(xml=>({xml,formHeader:true})));
    const internalExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
      input:JSON.stringify([{xml:paths.xml,xmlItems:[child],internalTypes:true}]),encoding:'utf8'}))[0];
    const profile=Object.entries(standardNames).map(([name,yamlName])=>({name,yamlName,pathName:yamlName,
      emptyForm:'mapping',policy:'notSpecified',expectedKind:'',maxTextLength:'',maxNumberDigits:'',
      allowedTextLength:'',owners:[]}));
    const inputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],component:source.component??'cf',
      itemName:example.name,parentOwner:example.parentIdentity,itemOwner:example.ownerIdentity,
      qualifiedName:`${example.parentName}.${example.name}`,kind:'TabularSection',profiles:profile,
      owners:[],componentKind:source.component?'extension':'configuration',canonicalNames:Object.keys(standardNames),
      elidableNames:source.component?[]:Object.keys(standardNames)};
    const itemSourceId=assembled.entry.id+variant;
    const rootSourceId=assembled.entry.id+variant+'.root';
    const internalSourceId=internalSource.id+variant;
    factSources.push({id:itemSourceId,entry:assembled.entry.id,xml:example.xml,inputs});
    factSources.push({id:rootSourceId,entry:ownRoot.id,xml:readFileSync(paths.xml,'utf8')});
    const formSources=formExamples.map(form=>({id:`${assembled.entry.id}${variant}.form.${form.name}`,
      entry:'migration.form-metadata-header',xml:form.xml,
      inputs:{parent:example.parentIdentity,name:form.name,identity:form.identity,
        defaultLanguage:'ru',registeredLanguages:['ru','en']}}));
    factSources.push(...formSources);
    const externalRoots=new Map(),externalSources=[],externalPaths=[];
    for(const reference of example.formReferences) {
      if(reference.kind===ownerKind && reference.name===example.parentName)continue;
      const target=fixtureOwner(reference.kind,reference.name);
      if(!externalRoots.has(reference.kind)) {
        const module=rootSource(catalog,`${assembled.entry.id}.external-root.${reference.kind}`,reference.kind);
        externalRoots.set(reference.kind,module);
        modules.push(module);
      }
      const ownerId=`${assembled.entry.id}${variant}.external-owner.${reference.kind}.${reference.name}`;
      if(!externalSources.some(item=>item.id===ownerId))externalSources.push({id:ownerId,
        entry:externalRoots.get(reference.kind).id,xml:readFileSync(target.xml,'utf8')});
      const formPath=join(dirname(target.xml),reference.name,'Forms',`${reference.form}.xml`);
      const [form]=projectedFixtures([{xml:formPath,formHeader:true}]);
      if(form.name!==reference.form)throw new Error(`Unexpected form fixture: ${formPath}`);
      const formId=`${assembled.entry.id}${variant}.form.${reference.kind}.${reference.name}.${form.name}`;
      if(!externalSources.some(item=>item.id===formId))externalSources.push({id:formId,
        entry:'migration.form-metadata-header',xml:form.xml,
        inputs:{parent:target.header.identity,name:form.name,identity:form.identity,
          defaultLanguage:'ru',registeredLanguages:['ru','en']}});
      externalPaths.push(...target.header.source,...form.source);
    }
    factSources.push(...externalSources);
    factSources.push({id:internalSourceId,entry:internalSource.id,xml:internalExample.xml,
      inputs:{owner:internalExample.owner}});
    const expectedYaml=source.component?
      canonicalExtensionYaml(example.yaml,standardNames):example.yaml;
    cases.push({id:`e2e-${source.folder.toLowerCase()}-tabular-section-${source.caseLabel??'whole'}-${source.component?'cfe':'cf'}`,entry:assembled.entry.id,
      xml:example.xml,yaml:expectedYaml,inputs,xmlQNamePaths:example.xmlQNamePaths,
      ...(source.component?{adaptation:'An explicit null ChoiceForm in the legacy extension YAML is an empty XML element; the canonical declaration keeps its standard-attribute row as an empty YAML mapping.'}:{}),
      factBindings:{identities:'metadata.own-identities',roots:'metadata.roots',forms:'metadata.forms',
        typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids'},
      factSourceEntries:[itemSourceId,rootSourceId,...formSources.map(form=>form.id),
        ...externalSources.map(item=>item.id),internalSourceId],
      source:[...new Map([...example.source,...formExamples.flatMap(form=>form.source),...externalPaths]
        .map(item=>[item.path,item])).values()]});
  }
  const unique=new Map();
  for(const module of modules) {
    const existing=catalog.get(module.id);
    if(existing) {
      if(JSON.stringify(existing)!==JSON.stringify({format:'nkdk-declarations/1',...module}))
        throw new Error(`Conflicting existing tabular-section declaration: ${module.id}`);
      continue;
    }
    const previous=unique.get(module.id);
    if(previous && JSON.stringify(previous)!==JSON.stringify(module))
      throw new Error(`Conflicting tabular-section declaration: ${module.id}`);
    unique.set(module.id,module);
  }
  return {modules:[...unique.values()],cases,factSources};
}

if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const {catalog}=candidateCatalog({excludePaths:['rust/declarations/candidates/tabular-sections.generated.yaml']});
  const {modules,cases,factSources}=tabularSectionFamilyOperation(catalog);
  const outputs={
    'rust/declarations/candidates/tabular-sections.generated.yaml':
      '# Generated by tools/rules-migration/src/tabular-section-family-operation.mjs\n'+
      yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:modules},{noRefs:true}),
    'tests/migration/tabular-section-family-operation.json':JSON.stringify({factSources,cases},null,2)+'\n',
  };
  for(const [path,content] of Object.entries(outputs)) {
    if(process.argv.includes('--check')) {
      if(readFileSync(path,'utf8')!==content)throw new Error('Stale tabular-section family operation: '+path);
    } else if(!existsSync(path)||readFileSync(path,'utf8')!==content) {
      mkdirSync(dirname(path),{recursive:true});writeFileSync(path,content);
    }
  }
}
