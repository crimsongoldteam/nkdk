import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {yaml} from './candidate-catalog.mjs';
import {asOwnerFragment} from './owner-fragment.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {loadSources} from './source-snapshot.mjs';
import {deriveOwnerDefaultProfiles} from './owner-default-profiles.mjs';

export function enumerationPropertiesFragment(source) {
 const fail=reason=>({status:'blocked',reason});
 if(source?.symbol!=='MetadataEnumerationRules')return fail('enumeration-source-required');
 let route;
 try{route=sourceOwnerXmlRoute(source)}catch{return fail('enumeration-root-required')}
 const manifest=JSON.parse(readFileSync('tests/migration/rules-candidates/manifest.json','utf8'));
 const candidate=manifest.entries.find(entry=>entry.symbol===source.symbol);
 const projection=candidate?.projections?.find(row=>row.fields.includes('name') &&
  row.fields.includes('characteristics') && row.fragments.length===1);
 if(!projection || projection.fields.some(field=>!source.properties.some(property=>
   property.name===field && property.status==='static-parameters')))
  return fail('enumeration-projection-required');
 const id=projection.fragments[0],path=`tests/migration/rules-candidates/${id}.yaml`;
 if(readFileSync(path,'utf8')!==manifest.generatedFiles[`${id}.yaml`])
  return fail('stale-enumeration-projection');
 const candidateFragment=yaml.load(readFileSync(path,'utf8'));
 if(candidateFragment.kind!=='fragment' ||
   JSON.stringify(candidateFragment.value.fields.map(field=>field.name))!==JSON.stringify(projection.fields))
  return fail('enumeration-projection-shape');
 candidateFragment.namespaces={...(candidateFragment.namespaces??{}),md:'http://v8.1c.ru/8.3/MDClasses'};
 const module=deriveOwnerDefaultProfiles(
  asOwnerFragment(candidateFragment,'fragment.enumeration-properties',route,'md'),source);
 return {status:'candidate',module};
}

function main() {
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 loadSources(extraction.sourceHashes);
 const source=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
 const result=enumerationPropertiesFragment(source);
 if(result.status!=='candidate')throw new Error(`Enumeration properties: ${result.reason}`);
 const names=yaml.load(readFileSync('rust/declarations/fragments/enumeration-child-names.generated.yaml','utf8'));
 if(!names)throw new Error('Missing generated child-name fragment');
 const internal=yaml.load(readFileSync('rust/declarations/fragments/enumeration-internal-info.generated.yaml','utf8'))
  .declarations.find(module=>module.id==='fragment.enumeration-internal-info');
 if(!internal)throw new Error('Missing generated InternalInfo fragment');
 const moduleSource=source.properties.find(property=>property.name==='managerModule');
 if(moduleSource?.status!=='static-parameters' || moduleSource.type!=='Module' ||
   moduleSource.parameters?.xmlPath!=='Ext/ManagerModule.bsl' ||
   moduleSource.parameters?.nkdkPath!=='МодульМенеджера.bsl')
  throw new Error('Unsupported enumeration manager module source');
 const manager=yaml.load(readFileSync('rust/declarations/fragments/manager-module-resource.yaml','utf8'));
 const modules=yaml.load(readFileSync('rust/declarations/fragments/child-module-resources.yaml','utf8'));
 const commands=yaml.load(readFileSync('rust/declarations/fragments/enumeration-commands.generated.yaml','utf8'))
  .declarations.find(module=>module.id==='fragment.enumeration-commands');
 if(!commands)throw new Error('Missing generated command fragment');
 const values=yaml.load(readFileSync('rust/declarations/objects/enumeration-values.generated.yaml','utf8'))
  .declarations.find(module=>module.id==='metadata.enumeration-values');
 if(values?.kind!=='object' || values.value.fields.map(field=>field.name).join()!=='enumValues' ||
    values.representations.xml.fields[0]?.path.join()!=='md:ChildObjects')
  throw new Error('Changed generated enumeration values owner');
 values.kind='fragment';
 values.id='fragment.enumeration-values';
 delete values.inputs.baseIds.index;
 delete values.inputs.identities.index;
 values.representations.xml.fields[0].path=[...sourceOwnerXmlRoute(source),
  ...values.representations.xml.fields[0].path];
 for(const fragment of [values]) {
  const [field]=fragment.value.fields;
  if(fragment.value.fields.length!==1 || !field?.type?.use ||
    fragment.representations.yaml.fields[0]?.field!==field.name ||
    !source.properties.some(property=>property.name===field.name))
   throw new Error('Changed source-derived owner collection shape');
  fragment.presence=[...(fragment.presence??[]),{target:{field:field.name},
   yaml:{missing:{denotes:{sequence:[]}},
    omitWhen:{not:{exists:{in:{field:field.name},as:'row',where:{literal:true}}}}}}];
 }
 const standard=yaml.load(readFileSync('rust/declarations/candidates/standard-attributes.generated.yaml','utf8'))
  .declarations.find(module=>module.id==='fragment.enumeration-standard-attributes');
 const standardNames=source.properties.find(property=>property.name==='standardAttributes')
  ?.parameters?.standartAttributeNames;
 if(standard?.kind!=='fragment' || !standardNames || !Object.keys(standardNames).length)
  throw new Error('Missing generated enumeration standard attributes');
 const bindings=Object.fromEntries(Object.keys(result.module.inputs??{}).map(name=>[name,name]));
 const combined=composeOwnerFragments('metadata.enumeration',[
  {alias:'internal',fragment:internal,bindings:{owner:'ownerIdentity',name:'ownerName',
   typeIds:'typeIds',valueIds:'valueIds'}},
  {alias:'properties',fragment:result.module,bindings},
  {alias:'names',fragment:names,bindings:{forms:'forms',templates:'templates'}},
  {alias:'manager',fragment:manager,bindings:{}},
  {alias:'modules',fragment:modules,bindings:{forms:'forms',commands:'commandNames'}},
  {alias:'commands',fragment:commands,bindings:{defaultLanguage:'defaultLanguage',
   registeredLanguages:'registeredLanguages',roots:'roots',identities:'commandIds',
   baseIds:'baseIds',component:'component',owner:'ownerIdentity'}},
  {alias:'values',fragment:values,bindings:{defaultLanguage:'defaultLanguage',
   registeredLanguages:'registeredLanguages',identities:'valueMemberIds',
   baseIds:'baseIds',component:'component',owner:'ownerIdentity',
   compatibilityMode:'compatibilityMode'}},
 {alias:'standard',fragment:standard,bindings:{defaultLanguage:'defaultLanguage',
   registeredLanguages:'registeredLanguages',ownerName:'ownerName',roots:'roots',
   forms:'standardForms',owners:'owners',componentKind:'componentKind',
   profiles:'profiles',canonicalNames:'canonicalNames',
   elidableNames:'elidableNames'}},
 ]);
 combined.inputs.roots.index='metadata.roots';
 combined.inputs.typeIds.index='metadata.internal-type-ids';
 combined.inputs.valueIds.index='metadata.internal-value-ids';
 combined.inputs.commandIds.index='metadata.own-identities';
 combined.inputs.valueMemberIds.index='metadata.own-identities';
 combined.inputs.standardForms.index='metadata.forms';
 const root=source.properties.find(property=>property.name==='xmlRoot');
 const uuid=source.properties.find(property=>property.name==='uuid');
 const extension=source.properties.find(property=>property.name==='extendedConfigurationObject');
 if(root?.parameters?.rootAttributes?._version==null || uuid?.parameters?.xml!=='_uuid')
  throw new Error('Unsupported enumeration identity envelope');
 if(extension?.status!=='static-parameters' || extension.type!=='string' ||
   extension.parameters?.runtimeOnly!==true ||
   extension.parameters?.yaml!=='ОбъектРасширяемойКонфигурации')
  throw new Error('Unsupported enumeration extension state');
 combined.value.fields.push({name:'uuid',type:{kind:'scalar',scalar:'text'}});
 combined.imports.extensionText='common.string';
 combined.inputs.component={type:{kind:'scalar',scalar:'text'}};
 combined.inputs.baseIds={index:'metadata.base-identities',type:{kind:'index',
  key:{kind:'record',fields:[
   {name:'component',type:{kind:'scalar',scalar:'text'}},
   {name:'identity',type:{kind:'scalar',scalar:'text'}}]},
  value:{kind:'scalar',scalar:'text'}}};
 const extensionXml=extension.name[0].toUpperCase()+extension.name.slice(1);
 const baseLookup={lookup:{in:{input:'baseIds'},key:{record:{
  component:{input:'component'},identity:{input:'ownerIdentity'}}}}};
 combined.value.fields.push({name:extension.name,type:{use:'extensionText'}});
 combined.representations.xml={kind:'with-attributes',
  attributes:[{name:'version',value:{text:root.parameters.rootAttributes._version}}],
  content:{kind:'record',fields:[
   {field:'uuid',path:sourceOwnerXmlRoute(source),attribute:uuid.parameters.xml.slice(1)},
   {field:extension.name,path:[...sourceOwnerXmlRoute(source),'md:Properties',`md:${extensionXml}`]}]}};
 combined.presence=[
  {target:{field:'uuid'},yaml:{missing:{denotes:{input:'ownerIdentity'}}}},
  {target:{field:extension.name},xml:{missing:{denotes:{absent:true}}},
   yaml:{missing:{denotes:{if:{present:baseLookup},then:{require:baseLookup},else:{absent:true}}}}}];
 if(source.xmlOrder?.status!=='static' || !Array.isArray(source.xmlOrder.keys))
  throw new Error('Missing enumeration XML order from rules.ts');
 combined.xmlOrder=source.xmlOrder.keys
  .map(name=>name==='standardAttributes'?'items':name)
  .flatMap(name=>name==='internalInfo'
   ?internal.value.fields.map(field=>field.name)
   :name==='comment'?[name,extension.name]:[name]);
 const path='rust/declarations/fragments/enumeration-properties.generated.yaml';
 const content='# Generated from rules.ts and candidate projection by tools/rules-migration/src/enumeration-properties-operation.mjs\n'+
  yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:[result.module,values]},{noRefs:true});
 const objectPath='rust/declarations/objects/enumeration.generated.yaml';
 const objectContent='# Generated by tools/rules-migration/src/enumeration-properties-operation.mjs\n'+
  yaml.dump(combined,{noRefs:true});
 const projection=(xml,yamlPath,internalInfo,emptyYaml=false)=>{
  const keys=new Set([...readFileSync(yamlPath,'utf8').matchAll(/^([^\s:#][^:\n]*):/gm)].map(match=>match[1]));
  return {xml,yaml:yamlPath,ownerFields:{identity:true,internalInfo,internalStateYaml:true,
   properties:[...result.module.representations.xml.fields.map(field=>{
    const key=result.module.representations.yaml.fields.find(row=>row.field===field.field)?.key;
    const property=source.properties.find(row=>row.name===field.field);
    const presence=result.module.presence?.find(row=>row.target?.field===field.field);
    const optional=property?.parameters?.required!==true && Boolean(presence?.xml?.missing);
    return {xml:field.path.at(-1).slice(3),...(keys.has(key)?{yaml:key}:{}),...(optional||emptyYaml?{optional:true}:{})};
   }),{xml:extensionXml,optional:true},{xml:'StandardAttributes',yaml:'СтандартныеРеквизиты',optional:true}],
   collections:[{item:'Form',xmlOnly:true},{item:'Template',xmlOnly:true},
    {item:'Command',yaml:'Команды',optional:emptyYaml},
    {item:'EnumValue',yaml:'Значения',optional:emptyYaml}],
   collectionIdentities:['Command','EnumValue']}};
 };
 const specs=[
  {suffix:'',name:'ПеречислениеВсеСвойства',component:'cf'},
  {suffix:'-extension',name:'ПеречислениеВсеСвойства',component:'cfe',base:0},
  {suffix:'-default',name:'ПеречислениеПоУмолчанию',component:'cf',empty:true},
  {suffix:'-default-extension',name:'ПеречислениеПоУмолчанию',component:'cfe',base:2,empty:true},
  {suffix:'-own-extension',name:'ПеречислениеПоУмолчаниюExt',component:'cfe',empty:true},
  {suffix:'-simple',name:'Перечисление1',component:'cf',empty:true},
  {suffix:'-full-own-extension',name:'ПеречислениеВсеСвойстваExt',component:'cfe'},
 ];
 const locations=specs.map(({name,component,empty})=>projection(
  `e2e/fixtures/xml/${component==='cf'?'cf':'cfe/all-extension'}/Enums/${name}.xml`,
  `e2e/fixtures/nkdk/${component==='cf'?'cf':'cfe/Расширение_All'}/Перечисление/${name}/Свойства.yaml`,
  true,empty));
 const available=['cf','cfe/all-extension'].flatMap(component=>
  readdirSync(`e2e/fixtures/xml/${component}/Enums`).filter(name=>name.endsWith('.xml'))
   .map(name=>`e2e/fixtures/xml/${component}/Enums/${name}`)).sort();
 const selected=locations.map(row=>row.xml).sort();
 if(JSON.stringify(selected)!==JSON.stringify(available))
  throw new Error('Enumeration e2e XML coverage changed');
 const fixtures=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],
  {input:JSON.stringify(locations),encoding:'utf8'}));
 const inputs=(row,component)=>({ownerName:row.ownerPath.split('.').at(-1),
  owner:row.ownerPath,ownerIdentity:row.ownerIdentity,
  forms:row.ownerForms,templates:row.ownerTemplates,
  commandNames:row.ownerChildIdentities.filter(child=>child.kind==='Command').map(child=>child.name),
 defaultLanguage:'ru',registeredLanguages:['ru','en'],component,
  compatibilityMode:'Version8_3_27',componentKind:component==='cf'?'configuration':'extension',
  profiles:Object.entries(standardNames).map(([name,yamlName])=>({
   name,yamlName,pathName:yamlName,emptyForm:'mapping',policy:'notSpecified',expectedKind:'',
   maxTextLength:'',maxNumberDigits:'',allowedTextLength:'',owners:[]})),
  owners:[],canonicalNames:Object.keys(standardNames),
  elidableNames:component==='cf'?Object.keys(standardNames):[]});
 const assembled=new Set([...result.module.value.fields.map(field=>field.name),
 'xmlRoot','uuid','internalInfo','forms','templates','managerModule',extension.name]);
 assembled.add('commands');
 assembled.add('enumValues');
 assembled.add('standardAttributes');
 const coverage={assembled:source.properties.filter(property=>assembled.has(property.name)).map(property=>property.name),
  pending:source.properties.filter(property=>!assembled.has(property.name)).map(property=>property.name)};
 const cases=specs.map((spec,index)=>({
  path:`tests/migration/enumeration-properties${spec.suffix}.json`,
  content:JSON.stringify({entry:combined.id,coverage,...fixtures[index],
   ...(spec.base===undefined?{}:{baseIdentity:fixtures[spec.base].ownerIdentity}),
   inputs:inputs(fixtures[index],spec.component)},null,2)+'\n',
 }));
 const snapshot=(entry,field,missing)=>({snapshot:{entry,field,...missing===undefined?{}:{default:missing}}});
 const route={xmlDir:'Enums',yamlDir:'Перечисление',yamlFile:'Свойства.yaml',
  owners:{cf:combined.id,cfe:combined.id},
  inputs:{
   ownerName:'name',ownerIdentity:snapshot('migration.enumeration-own-identity','uuid'),
   owner:{concat:[{literal:'Enum.'},'name']},
   forms:snapshot('migration.enumeration-child-names','Формы',[]),
   templates:snapshot('migration.enumeration-child-names','Шаблоны',[]),
   commandNames:{snapshot:{entry:'migration.enumeration-commands-identity-source',
    field:'commands',each:'name',default:[]}},
   defaultLanguage:'defaultLanguage',registeredLanguages:'registeredLanguages',
   component:'component',compatibilityMode:'compatibilityMode',
   owners:{literal:[]},componentKind:{byComponent:{cf:{literal:'configuration'},cfe:{literal:'extension'}}},
   profiles:{literal:Object.entries(standardNames).map(([name,yamlName])=>({name,yamlName,
    pathName:yamlName,emptyForm:'mapping',policy:'notSpecified',expectedKind:'',
    maxTextLength:'',maxNumberDigits:'',allowedTextLength:'',owners:[]}))},
   canonicalNames:{literal:Object.keys(standardNames)},
   elidableNames:{byComponent:{cf:{literal:Object.keys(standardNames)},cfe:{literal:[]}}},
  },
  sources:[
   {entry:'migration.enumeration-own-identity',inputs:{component:'component',parent:'parent',ownerName:'name'}},
   {entry:'migration.enumeration-base-identity',only:['cfe'],newOwner:{template:{base:[{base:{
    externalSnapshot:{component:'cf',entry:'migration.enumeration-own-identity',field:'uuid'}}}]}},
    inputs:{component:'component',parent:'parent',ownerName:'name'}},
   ...['values','commands'].map(field=>({entry:`migration.enumeration-${field}-identity-source`,
    factDirections:['yaml-to-xml'],
    newOwner:{template:{[field]:[]}},
    inputs:{component:'component',ownerIdentity:snapshot('migration.enumeration-own-identity','uuid')}})),
   ...['values','commands'].map(field=>({entry:`migration.enumeration-${field}-base-source`,
    factDirections:['xml-to-yaml'],
    newOwner:{template:{[field]:[]}},
    inputs:{component:'component',ownerIdentity:snapshot('migration.enumeration-own-identity','uuid')}})),
   {entry:'migration.enumeration-internal-types',inputs:{component:'component',parent:'parent',ownerName:'name'}},
   {entry:'migration.enumeration-child-names',inputs:{forms:{literal:[]},templates:{literal:[]}}},
  ]};
 const routePath='rust/operations/enumeration.routes.generated.yaml';
 const routeContent='# Generated from rules.ts by tools/rules-migration/src/enumeration-properties-operation.mjs\n'+
  yaml.dump({format:'nkdk-operation-routes/1',routes:[route]},{noRefs:true});
 if(process.argv.includes('--check')) {
  if(readFileSync(path,'utf8')!==content)throw new Error(`Stale enumeration properties: ${path}`);
  if(readFileSync(objectPath,'utf8')!==objectContent)throw new Error(`Stale enumeration owner: ${objectPath}`);
  for(const {path:casePath,content:caseContent} of cases)
   if(readFileSync(casePath,'utf8')!==caseContent)throw new Error(`Stale enumeration fixture: ${casePath}`);
  if(readFileSync(routePath,'utf8')!==routeContent)throw new Error(`Stale enumeration route: ${routePath}`);
 }else {
  if(!existsSync(path) || readFileSync(path,'utf8')!==content)writeFileSync(path,content);
  if(!existsSync(objectPath) || readFileSync(objectPath,'utf8')!==objectContent)
   writeFileSync(objectPath,objectContent);
  for(const {path:casePath,content:caseContent} of cases)
   if(!existsSync(casePath) || readFileSync(casePath,'utf8')!==caseContent)writeFileSync(casePath,caseContent);
  if(!existsSync(routePath) || readFileSync(routePath,'utf8')!==routeContent)
   writeFileSync(routePath,routeContent);
 }
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
