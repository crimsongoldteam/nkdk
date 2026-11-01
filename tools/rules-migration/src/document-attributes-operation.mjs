import {attachCompatibilityContext} from './configuration-context.mjs';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {candidateCatalog,yaml} from './candidate-catalog.mjs';
import {documentAttributeCases} from './document-attribute-cases.mjs';
import {attachOwnerMembership} from './owner-membership.mjs';
import {asOwnerFragment} from './owner-fragment.mjs';
import {composeOwnerFragments,mergeOwnerFragments} from './owner-composition.mjs';
import {emitCandidates} from './emit.mjs';
import {allowedMetadataPaths} from './allowed-metadata-paths.mjs';
import {emitBaseCollections} from './base-collection.mjs';
import {internalInfoAttachment} from './internal-info-attachment.mjs';
import {assembleTabularSection} from './tabular-section-assembly.mjs';
import {composedCollection} from './composed-collection.mjs';
import {rootSourceFromRule} from './owner-root-source.mjs';
import {standardAttributesProbe} from './standard-attributes-operation.mjs';
import {inputByStringOperation,numericPart} from './input-by-string-operation.mjs';
import {selectContracts} from './focused-catalog.mjs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export function documentAttributeOperation(catalog) {
const result=documentAttributeCases(catalog);
const modules=structuredClone(result.modules);
const emission={modules,results:[{ownerRequirements:structuredClone(result.requirements.owner)}]};
attachOwnerMembership(emission);
const previous=modules[2].id;
modules[2].id='metadata.document-attributes';
modules.push(asOwnerFragment(modules[2],'fragment.document-attributes',['md:MetaDataObject','md:Document']));
const attributeFragment=modules.at(-1),formFragment=catalog.get('fragment.document-form-links');
const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
const collectionGraph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
collectionGraph.edges=collectionGraph.edges.filter(edge=>edge.owner.symbol==='MetadataDocumentTabularSectionRules'&&edge.property==='attributes');
if(collectionGraph.edges.length!==1)throw new Error('Ambiguous document tabular-section attributes');
const nested=emitBaseCollections(collectionGraph,extraction.entries,catalog,{md:'http://v8.1c.ru/8.3/MDClasses'});
if(nested.results[0].status!=='candidate')throw new Error(`Nested document attributes blocked: ${JSON.stringify(nested.results[0].blockers)}`);
modules.push(...nested.modules);
const tabularRule=extraction.entries.find(entry=>entry.symbol==='MetadataDocumentTabularSectionRules');
const internal=internalInfoAttachment(tabularRule);
if(internal.status!=='candidate')throw new Error(`Tabular-section generated types blocked: ${internal.reason}`);
const internalSource=structuredClone(catalog.get('migration.journal-internal-types'));
internalSource.id=internal.module.id+'.source';
internalSource.representations=structuredClone(internal.module.representations);
internalSource.namespaces=internal.module.namespaces;
const internalOperation={format:'nkdk-declarations/1',kind:'object',id:internal.module.id+'.operation',
  imports:{part:internal.module.id},
  inputs:{owner:internal.module.inputs.owner,name:internal.module.inputs.name,
    typeIds:{index:'metadata.internal-type-ids'},valueIds:{index:'metadata.internal-value-ids'}},
  compose:[{use:'part',bind:Object.fromEntries(Object.keys(internal.module.inputs).map(name=>[name,{input:name}]))}],
  value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
modules.push(internal.module,internalSource,internalOperation);
const tabular=assembleTabularSection(catalog,tabularRule,
  nested.modules.find(module=>module.id===nested.results[0].declaration),internal.module);
modules.push(...tabular.modules);
const documentRules=extraction.entries.find(entry=>entry.symbol==='MetadataDocumentRules');
const dataLockRule=documentRules?.properties.find(property=>property.name==='dataLockFields');
if(!dataLockRule)throw new Error('Missing source DataLockFields rule');
const dataLockEmission=emitCandidates([{...documentRules,properties:[dataLockRule],comparison:{status:'keys-match'},propertyStates:[],xmlOrder:{status:'absent'}}],catalog);
if(dataLockEmission.entries[0].properties[0].status!=='candidate')throw new Error('DataLockFields rule is not declarative');
const dataLockSource=dataLockEmission.modules.find(module=>module.kind==='fragment');
if(!dataLockSource)throw new Error('Missing source-derived DataLockFields fragment');
const dataLockFragment=asOwnerFragment({...dataLockSource,namespaces:{...dataLockSource.namespaces,md:formFragment.namespaces.md}},'fragment.document-data-lock-fields',['md:MetaDataObject','md:Document'],'md');
const propertyFragment=mergeOwnerFragments('fragment.document-owner-properties',[formFragment,dataLockFragment]);
modules.push(propertyFragment);
const sourceOwnerProperty=(name,id)=>{
  const property=documentRules.properties.find(item=>item.name===name);
  if(!property)throw new Error(`Missing source document property: ${name}`);
  const emitted=emitCandidates([{...documentRules,properties:[property],comparison:{status:'keys-match'},
    propertyStates:[],xmlOrder:{status:'absent'}}],catalog);
  if(emitted.entries[0].properties[0].status!=='candidate')
    throw new Error(`Document ${name} is not declarative`);
  const source=emitted.modules.find(module=>module.kind==='fragment');
  if(!source)throw new Error(`Missing source-derived document fragment: ${name}`);
  const fragment=asOwnerFragment({...source,namespaces:{...source.namespaces,md:formFragment.namespaces.md}},
    id,['md:MetaDataObject','md:Document'],'md');
  modules.push(fragment);
  return fragment;
};
const characteristics=sourceOwnerProperty('characteristics','fragment.document-characteristics');
const objectBelonging=sourceOwnerProperty('objectBelonging','fragment.document-object-belonging');
const ownerStandards=catalog.get('fragment.document-standard-attributes');
if(!ownerStandards)throw new Error('Missing document standard attributes from generic declaration');
const originalBase=catalog.get('fragment.document-base-properties');
if(!originalBase)throw new Error('Missing declarative document base properties');
const checkedInputFamily=inputByStringOperation(catalog);
const checkedCatalog=new Map([...catalog,...checkedInputFamily.modules.map(module=>[module.id,module])]);
const checkedInputCase=checkedInputFamily.cases.find(item=>item.id==='e2e-input-by-string-document-cf');
const checkedSelection=selectContracts(checkedInputFamily,checkedCatalog,[checkedInputCase.id]);
const checkedIds=new Set(checkedInputFamily.modules.map(module=>module.id));
modules.push(...checkedSelection.modules.filter(module=>checkedIds.has(module.id)&&!catalog.has(module.id)));
const checkedInputOwner=checkedCatalog.get(checkedInputCase.entry);
const checkedInputFragment=checkedCatalog.get(checkedInputOwner.imports.part);
const baseProperties=structuredClone(originalBase);
baseProperties.id='fragment.document-checked-base-properties';
baseProperties.imports={...baseProperties.imports,...checkedInputFragment.imports};
baseProperties.inputs={...baseProperties.inputs,...structuredClone(checkedInputFragment.inputs)};
const replacementFields=new Map(checkedInputFragment.value.fields.map(field=>[field.name,field]));
baseProperties.value.fields=baseProperties.value.fields.map(field=>
  structuredClone(replacementFields.get(field.name)??field));
baseProperties.value.fields.unshift(structuredClone(replacementFields.get('history')));
baseProperties.representations.xml.fields.unshift(structuredClone(
  checkedInputFragment.representations.xml.fields.find(field=>field.field==='history')));
baseProperties.representations.yaml.fields.push(structuredClone(
  checkedInputFragment.representations.yaml.fields.find(field=>field.field==='history')));
baseProperties.presence=baseProperties.presence.filter(rule=>!replacementFields.has(rule.target?.field));
baseProperties.presence.push(...structuredClone(checkedInputFragment.presence));
const numericalFields=new Set(checkedInputFragment.value.fields.filter(field=>field.type.use==='number').map(field=>field.name));
const rewriteNumbers=value=>{
  if(!value||typeof value!=='object')return value;
  if(Object.keys(value).length===1&&numericalFields.has(value.field))return numericPart(value.field);
  if(Array.isArray(value))return value.map(rewriteNumbers);
  return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,rewriteNumbers(child)]));
};
baseProperties.constraints=(baseProperties.constraints??[]).map(constraint=>({...constraint,
  assert:rewriteNumbers(constraint.assert),...(constraint.when?{when:rewriteNumbers(constraint.when)}:{})}));
baseProperties.constraints.push(...structuredClone(checkedInputFragment.constraints));
modules.push(baseProperties);
const attributeBindings=Object.fromEntries(Object.keys(attributeFragment.inputs).map(name=>[name,name==='forms'?'attributeForms':name]));
const formBindings={ownerName:'containingOwnerName',roots:'formRoots',formTargets:'attributeForms',ownerPath:'ownerPath',forms:'ownerForms'};
const joined=composeOwnerFragments('migration.document-attribute-form-links',[
  {alias:'ownerProperties',fragment:propertyFragment,bindings:{...formBindings,ownerRoot:'ownerRoot',containingOwnerName:'containingOwnerName'}},
  {alias:'attributes',fragment:attributeFragment,bindings:attributeBindings},
]);
modules.push(joined);
const cases=structuredClone(result.cases);
const factSources=structuredClone(result.factSources);
factSources.push(...checkedSelection.manifest.factSources);
for(const item of [...cases,...factSources])if(item.entry===previous)item.entry=modules[2].id;
for(const item of cases)item.factSourceEntries=[modules[2].id];
const examples=[
  {component:'cf',xml:'e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства.xml',
    yaml:'e2e/fixtures/nkdk/cf/Документ/ДокументВсеСвойства/Свойства.yaml'},
  {component:'cfe/all-extension',xml:'e2e/fixtures/xml/cfe/all-extension/Documents/ДокументВсеСвойстваExt.xml',
    yaml:'e2e/fixtures/nkdk/cfe/Расширение_All/Документ/ДокументВсеСвойстваExt/Свойства.yaml'},
];
for(const source of examples) {
const example=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:source.xml,yaml:source.yaml,linkContext:true,
    ownerFields:{properties:[
      {xml:'DefaultObjectForm',yaml:'ОсновнаяФормаОбъекта'},
      {xml:'DefaultListForm',yaml:'ОсновнаяФормаСписка'},
      {xml:'DefaultChoiceForm',yaml:'ОсновнаяФормаДляВыбора'},
      {xml:'AuxiliaryObjectForm'},{xml:'AuxiliaryListForm'},{xml:'AuxiliaryChoiceForm'},
      {xml:'DataLockFields',yaml:'ПоляБлокировкиДанных'},
    ],collection:{item:'Attribute',yaml:'Реквизиты'}}}]),encoding:'utf8'}))[0];
const inputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],component:source.component,owner:example.ownerIdentity,
  ...example.linkContext,ownerPath:example.ownerPath,ownerForms:example.ownerForms};
if(source.component!=='cf')factSources.push({entry:joined.id,xml:example.xml,inputs});
const normalizedYAML=source.component==='cf'?example.yaml:example.yaml.replace(/^    ФормаВыбора: null(?:\n|$)/gm,'');
cases.push({id:`e2e-document-attributes-with-choice-form-${source.component==='cf'?'cf':'cfe'}`,entry:joined.id,xml:example.xml,yaml:normalizedYAML,inputs,
  xmlQNamePaths:example.xmlQNamePaths,factBindings:{identities:'metadata.own-identities'},
  factSourceEntries:[source.component==='cf'?modules[2].id:joined.id],
  source:example.source,
  adaptation:'The document projection joins all six form properties and all Attribute elements; the cfe fixture explicitly writes null ChoiceForm entries, which the declared canonical YAML omits while restoring their empty XML elements'});
}
const pathId='migration.document-attribute-targets';
const pathDeclarations=allowedMetadataPaths({kind:'member',owner:'explicit',allowedObjectPaths:[],
  allowedMemberPaths:[['Document','Attribute'],['Document','Command']]},catalog,{id:pathId,verifyTargets:true});
const pathProbe={format:'nkdk-declarations/1',kind:'object',id:'migration.document-attribute-target-check',
  imports:{links:pathId},namespaces:{xr:'http://v8.1c.ru/8.3/xcf/readable'},
  inputs:{roots:{index:'metadata.roots'},pathChildren:{index:'metadata.path-children'}},
  value:{kind:'record',fields:[{name:'links',type:{use:'links',bind:{roots:{input:'roots'},pathChildren:{input:'pathChildren'}}}}]},
  representations:{xml:{kind:'record',fields:[{field:'links',path:['Root','Content']}]},
    yaml:{kind:'mapping',fields:[{field:'links',key:'Ссылки'}]}}};
modules.push(...pathDeclarations,pathProbe);
const documentXML=readFileSync(examples[0].xml,'utf8');
factSources.push({entry:'migration.document-root-source',xml:documentXML});
const nestedExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:examples[0].xml,yaml:examples[0].yaml,linkContext:true,
    xmlItems:[{type:'TabularSection',name:'ТабличнаяЧасть'}],
    yamlPath:['ТабличныеЧасти','ТабличнаяЧасть'],
    collection:{item:'Attribute',yaml:'Реквизиты',preserveNamespace:true}}]),encoding:'utf8'}))[0];
const nestedInputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],component:'cf',
  owner:nestedExample.ownerIdentity};
factSources.push({entry:nested.results[0].declaration,xml:nestedExample.xml,inputs:nestedInputs});
const choiceFormXML=readFileSync('e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства/Forms/ФормаВыбора.xml','utf8');
factSources.push({entry:'migration.form-metadata-header',xml:choiceFormXML,
  inputs:{parent:'ДокументВсеСвойства',name:'ФормаВыбора',identity:'3e3cd30c-7bdc-4923-b1be-31e716828cca',
    defaultLanguage:'ru',registeredLanguages:['ru','en']}});
cases.push({id:'e2e-document-tabular-section-attributes-cf',entry:nested.results[0].declaration,
  xml:nestedExample.xml,yaml:nestedExample.yaml,inputs:nestedInputs,
  xmlQNamePaths:nestedExample.xmlQNamePaths,
  factBindings:{identities:'metadata.own-identities',roots:'metadata.roots',forms:'metadata.forms'},
  factSourceEntries:[nested.results[0].declaration,'migration.document-root-source','migration.form-metadata-header'],
  source:nestedExample.source});
const internalExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:examples[0].xml,xmlItems:[{type:'TabularSection',name:'ТабличнаяЧасть'}],internalTypes:true}]),encoding:'utf8'}))[0];
factSources.push({entry:internalSource.id,xml:internalExample.xml,inputs:{owner:internalExample.owner}});
cases.push({id:'e2e-document-tabular-section-internal-info-cf',entry:internalOperation.id,
  xml:internalExample.xml,yaml:'',inputs:{owner:internalExample.owner,
    name:`${internalExample.parentName}.${internalExample.name}`},
  factBindings:{typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids'},
  factSourceEntries:[internalSource.id],source:internalExample.source});
const wholeExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:examples[0].xml,yaml:examples[0].yaml,
    xmlItems:[{type:'TabularSection',name:'ТабличнаяЧасть'}],
    yamlPath:['ТабличныеЧасти','ТабличнаяЧасть'],wholeItem:true}]),encoding:'utf8'}))[0];
const wholeInputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],component:'cf',
  itemName:wholeExample.name,parentOwner:wholeExample.parentIdentity,itemOwner:wholeExample.ownerIdentity,
  qualifiedName:`${wholeExample.parentName}.${wholeExample.name}`,kind:'TabularSection',
  profiles:[],owners:[],componentKind:'cf',canonicalNames:[],elidableNames:[]};
factSources.push({entry:tabular.entry.id,xml:wholeExample.xml,inputs:wholeInputs});
cases.push({id:'e2e-document-tabular-section-whole-cf',entry:tabular.entry.id,
  xml:wholeExample.xml,yaml:wholeExample.yaml,inputs:wholeInputs,
  xmlQNamePaths:wholeExample.xmlQNamePaths,
  factBindings:{identities:'metadata.own-identities',roots:'metadata.roots',forms:'metadata.forms',
    typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids'},
  factSourceEntries:[tabular.entry.id,'migration.document-root-source','migration.form-metadata-header',internalSource.id],
  source:wholeExample.source});
const standardProbe=standardAttributesProbe(catalog.get('fragment.document-tabular-section-standard-attributes'),
  'migration.tabular-section-standard-attributes');
modules.push(standardProbe);
const standardExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:'e2e/fixtures/xml/cf/Catalogs/СправочникВладелец.xml',
    yaml:'e2e/fixtures/nkdk/cf/Справочник/СправочникВладелец/Свойства.yaml',
    xmlItems:[{type:'TabularSection',name:'ТабличнаяЧастьПолный'}],
    yamlPath:['ТабличныеЧасти','ТабличнаяЧастьПолный'],
    ownerFields:{properties:[{xml:'StandardAttributes',yaml:'СтандартныеРеквизиты'}]}}]),encoding:'utf8'}))[0];
const standardNames=tabularRule.properties.find(property=>property.name==='standardAttributes')?.parameters.standartAttributeNames;
if(!standardNames || !Object.keys(standardNames).length)throw new Error('Missing tabular-section standard names');
const standardInputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],ownerName:'ТабличнаяЧастьПолный',
  profiles:Object.entries(standardNames).map(([name,yamlName])=>({name,yamlName,pathName:yamlName,
    emptyForm:'mapping',policy:'notSpecified',expectedKind:'',maxTextLength:'',maxNumberDigits:'',allowedTextLength:'',owners:[]})),
  owners:[],componentKind:'configuration',canonicalNames:Object.keys(standardNames),elidableNames:Object.keys(standardNames)};
cases.push({id:'e2e-tabular-section-standard-attributes-catalog-cf',entry:standardProbe.id,
  xml:standardExample.xml,yaml:standardExample.yaml,inputs:standardInputs,
  xmlQNamePaths:standardExample.xmlQNamePaths,
  factBindings:{roots:'metadata.roots',forms:'metadata.forms'},
  factSourceEntries:['migration.document-root-source','migration.form-metadata-header'],
  source:standardExample.source});
const tabularEdge=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8')).edges.filter(edge=>
  edge.owner.symbol==='MetadataDocumentRules'&&edge.property==='tabularSections');
if(tabularEdge.length!==1)throw new Error('Ambiguous document tabular-section collection');
const rowField=name=>({get:{of:{var:'row'},field:name}});
const tabularCollection=composedCollection(tabularEdge[0],tabular.entry,catalog,modules,{
  bindings:{itemOwner:{field:'uuid'},itemName:{field:'name'},
    qualifiedName:{concat:[{input:'parentName'},{literal:'.'},{field:'name'}]},
    kind:{literal:tabularEdge[0].mapping.xml}},
  extraInputs:{parentName:{type:{kind:'scalar',scalar:'text'}}},
  namespaces:{md:'http://v8.1c.ru/8.3/MDClasses',xr:'http://v8.1c.ru/8.3/xcf/readable'},
  defaultXmlNamespace:'md',
  identity:{index:'metadata.own-identities',
    key:{record:{component:{input:'component'},owner:{input:'parentOwner'},
      kind:{literal:tabularEdge[0].mapping.xml},name:rowField(tabularEdge[0].mapping.keyField)}},
    value:rowField('uuid')}});
modules.push(...tabularCollection.modules);
const collectionExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:examples[0].xml,yaml:examples[0].yaml,
    collection:{item:'TabularSection',yaml:'ТабличныеЧасти',preserveNamespace:true}}]),encoding:'utf8'}))[0];
const collectionInputs={...wholeInputs,parentName:wholeExample.parentName};
delete collectionInputs.itemName;
delete collectionInputs.itemOwner;
delete collectionInputs.qualifiedName;
delete collectionInputs.kind;
factSources.push({entry:tabularCollection.entry.id,xml:collectionExample.xml,inputs:collectionInputs});
cases.push({id:'e2e-document-tabular-sections-collection-cf',entry:tabularCollection.entry.id,
  xml:collectionExample.xml,yaml:collectionExample.yaml,inputs:collectionInputs,
  xmlQNamePaths:collectionExample.xmlQNamePaths,
  factBindings:{identities:'metadata.own-identities',roots:'metadata.roots',forms:'metadata.forms',
    typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids'},
  factSourceEntries:[tabularCollection.entry.id,
    'migration.document-root-source','migration.form-metadata-header',internalSource.id],
  source:collectionExample.source});
const tabularOwnerFragment=asOwnerFragment(tabularCollection.entry,'fragment.document-tabular-sections',
  ['md:MetaDataObject','md:Document'],'md');
modules.push(tabularOwnerFragment);
const combinedOwner=composeOwnerFragments('migration.document-attributes-and-tabular-sections',[
  {alias:'baseProperties',fragment:baseProperties,
    bindings:{name:'containingOwnerName',defaultLanguage:'defaultLanguage',
      registeredLanguages:'registeredLanguages',adopted:'adopted',component:'component',owner:'owner',
      members:'inputByStringMembers',states:'propertyStates',baseNumbers:'baseNumbers',compatibilityMode:'compatibilityMode'}},
  {alias:'ownerProperties',fragment:propertyFragment,
    bindings:{...formBindings,ownerRoot:'ownerRoot',containingOwnerName:'containingOwnerName'}},
  {alias:'standardAttributes',fragment:ownerStandards,
    bindings:{profiles:'ownerProfiles',defaultLanguage:'defaultLanguage',
      registeredLanguages:'registeredLanguages',ownerName:'containingOwnerName',roots:'roots',
      forms:'attributeForms',owners:'owners',componentKind:'componentKind',
      canonicalNames:'ownerCanonicalNames',elidableNames:'ownerElidableNames'}},
  {alias:'characteristics',fragment:characteristics,bindings:{}},
  {alias:'objectBelonging',fragment:objectBelonging,bindings:{}},
  {alias:'attributes',fragment:attributeFragment,bindings:attributeBindings},
  {alias:'tabularSections',fragment:tabularOwnerFragment,
    bindings:Object.fromEntries(Object.keys(tabularOwnerFragment.inputs).map(name=>
      [name,name==='parentOwner'?'owner':name==='parentName'?'containingOwnerName':name]))},
]);
combinedOwner.inputs.inputByStringMembers.index=checkedInputOwner.inputs.members.index;
combinedOwner.inputs.propertyStates.index=checkedInputOwner.inputs.states.index;
combinedOwner.inputs.baseNumbers.index=checkedInputOwner.inputs.baseNumbers.index;
const combinedFragments=[baseProperties,propertyFragment,ownerStandards,characteristics,objectBelonging,
  attributeFragment,tabularOwnerFragment];
const combinedFields=combinedFragments.flatMap(fragment=>fragment.value.fields.map(field=>field.name));
const sourceNameByXML=new Map(documentRules.properties.map(property=>[
  property.parameters?.xml??property.name[0].toUpperCase()+property.name.slice(1),property.name]));
const fieldBySourceName=new Map(combinedFragments.flatMap(fragment=>fragment.value.fields.map(field=>{
  const xmlName=fragment.representations.xml.fields.find(xml=>xml.field===field.name)?.path?.at(-1)
    ?.split(':').at(-1);
  const sourceName=sourceNameByXML.get(xmlName)??field.name[0].toLowerCase()+field.name.slice(1);
  return [sourceName,field.name];
})));
combinedOwner.xmlOrder=documentRules.xmlOrder.keys.flatMap(name=>
  fieldBySourceName.has(name)?[fieldBySourceName.get(name)]:[]);
if(!combinedOwner.xmlOrder.includes('history'))combinedOwner.xmlOrder.unshift('history');
if(combinedOwner.xmlOrder.length!==combinedFields.length)
  throw new Error(`Document source order misses: ${combinedFields.filter(name=>!combinedOwner.xmlOrder.includes(name)).join(', ')}`);
modules.push(combinedOwner);
const combinedExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:examples[0].xml,yaml:examples[0].yaml,linkContext:true,
    ownerFields:{propertyStates:[...numericalFields],properties:[
      ...baseProperties.representations.xml.fields.filter(field=>field.field!=='history').map(field=>({
        xml:field.path.at(-1).split(':').at(-1),
        yaml:baseProperties.representations.yaml.fields.find(item=>item.field===field.field)?.key,
        optional:true})),
      {xml:'DefaultObjectForm',yaml:'ОсновнаяФормаОбъекта'},
      {xml:'DefaultListForm',yaml:'ОсновнаяФормаСписка'},
      {xml:'DefaultChoiceForm',yaml:'ОсновнаяФормаДляВыбора'},
      {xml:'AuxiliaryObjectForm'},{xml:'AuxiliaryListForm'},{xml:'AuxiliaryChoiceForm'},
      {xml:'DataLockFields',yaml:'ПоляБлокировкиДанных'},
      {xml:'StandardAttributes',yaml:'СтандартныеРеквизиты'},
      {xml:'Characteristics',yaml:'Характеристики'}],
      collections:[{item:'Attribute',yaml:'Реквизиты'},{item:'TabularSection',yaml:'ТабличныеЧасти'}]}}]),encoding:'utf8'}))[0];
const ownerStandardCase=JSON.parse(readFileSync('tests/migration/rules-contract-cases.json','utf8'))
  .cases.find(row=>row.id==='standard-attribute-family-document');
const declaredStandardNames=Object.keys(documentRules.properties.find(property=>
  property.name==='standardAttributes').parameters.standartAttributeNames);
if(!ownerStandardCase ||
  declaredStandardNames.sort().join()!==[...ownerStandardCase.inputs.canonicalNames].sort().join())
  throw new Error('Document standard attribute profile differs from rules.ts');
const combinedInputValues={...collectionInputs,...combinedExample.linkContext,adopted:false,
  owner:combinedExample.ownerIdentity,ownerPath:combinedExample.ownerPath,
  ownerForms:combinedExample.ownerForms,
  ownerProfiles:ownerStandardCase.inputs.profiles,
  ownerCanonicalNames:ownerStandardCase.inputs.canonicalNames,
  ownerElidableNames:ownerStandardCase.inputs.elidableNames};
const combinedInputs=Object.fromEntries(Object.entries(combinedInputValues).filter(([name])=>
  Object.hasOwn(combinedOwner.inputs,name)));
factSources.push({entry:combinedOwner.id,xml:combinedExample.xml,inputs:combinedInputs});
cases.push({id:'e2e-document-attributes-and-tabular-sections-cf',entry:combinedOwner.id,
  xml:combinedExample.xml,yaml:combinedExample.yaml,inputs:combinedInputs,
  xmlQNamePaths:combinedExample.xmlQNamePaths,
  factBindings:{identities:'metadata.own-identities',roots:'metadata.roots',forms:'metadata.forms',
    typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids',
    inputByStringMembers:'metadata.input-by-string-members',propertyStates:'metadata.property-state-membership',baseNumbers:'metadata.base-owner-numbers'},
  factSourceEntries:[...checkedInputCase.factSourceEntries,combinedOwner.id,
    'migration.document-root-source','migration.form-metadata-header',internalSource.id],
  source:combinedExample.source,
  rejectedYAML:[combinedExample.yaml.replace('Реквизит.ИндексированноеПоле','Реквизит.ПолныйРеквизит')]});
if(cases.at(-1).rejectedYAML[0]===combinedExample.yaml)
  throw new Error('Combined document input field fixture was not changed');
const inputByStringExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:examples[0].xml,yaml:examples[0].yaml,
    ownerFields:{propertyStates:[...numericalFields],properties:[{xml:'NumberLength',yaml:'ДлинаНомера'},
      {xml:'InputByString',yaml:'ВводПоСтроке'}]}}]),encoding:'utf8'}))[0];
const inputByStringFragment=structuredClone(checkedInputFragment);
inputByStringFragment.id='fragment.document-input-by-string-probe';
const inputByStringOwner=structuredClone(checkedInputOwner);
inputByStringOwner.id='migration.document-input-by-string-probe';
inputByStringOwner.imports.part=inputByStringFragment.id;
modules.push(inputByStringFragment,inputByStringOwner);
const checkedInputContext={inputs:checkedInputCase.inputs,factBindings:checkedInputCase.factBindings,
  factSourceEntries:checkedInputCase.factSourceEntries};
cases.push({...checkedInputCase,id:'e2e-document-input-by-string-cf',entry:inputByStringOwner.id});
const defaultInputXML=inputByStringExample.xml.replace(
  /\s*<xr:Field>[^<]*\.Attribute\.[^<]*<\/xr:Field>/,'');
if(defaultInputXML===inputByStringExample.xml)throw new Error('Document fixture has no ordinary input field');
cases.push({id:'e2e-document-input-by-string-default-cf',entry:inputByStringOwner.id,
  xml:defaultInputXML,yaml:'ДлинаНомера: 11\n',
  rejectedYAML:['ДлинаНомера: 11\nВводПоСтроке:\n  - СтандартныйРеквизит.Номер\n'],
  rejectedCode:'yaml.implicit-value',
  ...checkedInputContext,xmlQNamePaths:inputByStringExample.xmlQNamePaths,
  source:inputByStringExample.source,noRaw:true});
const zeroInputXML=inputByStringExample.xml.replace('<ns0:NumberLength>11</ns0:NumberLength>',
  '<ns0:NumberLength>0</ns0:NumberLength>').replace(
  /<ns0:InputByString>[\s\S]*?<\/ns0:InputByString>/,'<ns0:InputByString/>');
if(!zeroInputXML.includes('<ns0:InputByString/>'))throw new Error('Document input fixture has no collection');
cases.push({id:'e2e-document-input-by-string-zero-cf',entry:inputByStringOwner.id,
  xml:zeroInputXML,yaml:'ДлинаНомера: 0\n',
  rejectedYAML:['ДлинаНомера: 0\nВводПоСтроке: []\n'],
  rejectedCode:'yaml.implicit-value',
  ...checkedInputContext,xmlQNamePaths:inputByStringExample.xmlQNamePaths,
  source:inputByStringExample.source,noRaw:true});
const catalogTabularRule=extraction.entries.find(entry=>entry.symbol==='MetadataCatalogTabularSectionRules');
const catalogNestedGraph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
catalogNestedGraph.edges=catalogNestedGraph.edges.filter(edge=>
  edge.owner.symbol==='MetadataCatalogTabularSectionRules'&&edge.property==='attributes');
if(catalogNestedGraph.edges.length!==1)throw new Error('Ambiguous catalog tabular-section attributes');
const catalogNested=emitBaseCollections(catalogNestedGraph,extraction.entries,catalog,
  {md:'http://v8.1c.ru/8.3/MDClasses'});
if(catalogNested.results[0].status!=='candidate')throw new Error('Catalog tabular-section attributes are blocked');
modules.push(...catalogNested.modules);
const catalogInternal=internalInfoAttachment(catalogTabularRule);
if(catalogInternal.status!=='candidate')throw new Error('Catalog tabular-section internal types are blocked');
const catalogInternalSource=structuredClone(internalSource);
catalogInternalSource.id=catalogInternal.module.id+'.source';
catalogInternalSource.representations=structuredClone(catalogInternal.module.representations);
catalogInternalSource.namespaces=catalogInternal.module.namespaces;
modules.push(catalogInternal.module,catalogInternalSource);
const catalogTabular=assembleTabularSection(catalog,catalogTabularRule,
  catalogNested.modules.find(module=>module.id===catalogNested.results[0].declaration),
  catalogInternal.module,'migration.catalog-tabular-section');
modules.push(...catalogTabular.modules);
const catalogPaths={xml:'e2e/fixtures/xml/cf/Catalogs/СправочникВладелец.xml',
  yaml:'e2e/fixtures/nkdk/cf/Справочник/СправочникВладелец/Свойства.yaml'};
const catalogItem={type:'TabularSection',name:'ТабличнаяЧастьПолный'};
const catalogYamlPath=['ТабличныеЧасти','ТабличнаяЧастьПолный'];
const catalogWholeExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{...catalogPaths,xmlItems:[catalogItem],yamlPath:catalogYamlPath,wholeItem:true}]),
  encoding:'utf8'}))[0];
const catalogNestedExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{...catalogPaths,xmlItems:[catalogItem],yamlPath:catalogYamlPath,
    collection:{item:'Attribute',yaml:'Реквизиты',preserveNamespace:true}}]),encoding:'utf8'}))[0];
const catalogInternalExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:catalogPaths.xml,xmlItems:[catalogItem],internalTypes:true}]),encoding:'utf8'}))[0];
const catalogWholeInputs={...wholeInputs,itemName:catalogWholeExample.name,
  parentOwner:catalogWholeExample.parentIdentity,itemOwner:catalogWholeExample.ownerIdentity,
  qualifiedName:`${catalogWholeExample.parentName}.${catalogWholeExample.name}`,
  profiles:structuredClone(standardInputs.profiles),componentKind:'configuration',
  canonicalNames:Object.keys(standardNames),elidableNames:Object.keys(standardNames)};
factSources.push({entry:catalogTabular.entry.id,xml:catalogWholeExample.xml,inputs:catalogWholeInputs});
factSources.push({entry:catalogNested.results[0].declaration,xml:catalogNestedExample.xml,
  inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en'],component:'cf',
    owner:catalogNestedExample.ownerIdentity}});
factSources.push({entry:catalogInternalSource.id,xml:catalogInternalExample.xml,
  inputs:{owner:catalogInternalExample.owner}});
const catalogWholeCase={id:'e2e-catalog-tabular-section-whole-cf',entry:catalogTabular.entry.id,
  xml:catalogWholeExample.xml,yaml:catalogWholeExample.yaml,inputs:catalogWholeInputs,
  xmlQNamePaths:catalogWholeExample.xmlQNamePaths,
  factBindings:{identities:'metadata.own-identities',
    typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids'},
  factSourceEntries:[catalogTabular.entry.id,catalogInternalSource.id],
  source:catalogWholeExample.source};
cases.push(catalogWholeCase);
const emptySynonymXml=catalogWholeExample.xml.replace(
  /<ns0:Synonym>[\s\S]*?<\/ns0:Synonym>/u,'<ns0:Synonym/>');
const emptySynonymYaml=catalogWholeExample.yaml.replace(/^Синоним: Синоним$/mu,'Синоним: ""');
if(emptySynonymXml===catalogWholeExample.xml||emptySynonymYaml===catalogWholeExample.yaml)
  throw new Error('Catalog tabular-section synonym fixture changed');
cases.push({...catalogWholeCase,id:'e2e-catalog-tabular-section-empty-synonym-cf',
  xml:emptySynonymXml,yaml:emptySynonymYaml});
const invalidLengthXml=catalogWholeExample.xml.replace(
  '<ns0:LineNumberLength>7</ns0:LineNumberLength>',
  '<ns0:LineNumberLength>bad</ns0:LineNumberLength>');
const invalidLengthYaml=catalogWholeExample.yaml.replace(
  'ДлинаНомераСтроки: 7',
  'LineNumberLength: !xml/raw\n  $xml:\n    "#replace": "true"\n    "#text": bad');
if(invalidLengthXml===catalogWholeExample.xml||invalidLengthYaml===catalogWholeExample.yaml)
  throw new Error('Catalog tabular-section line length fixture changed');
cases.push({...catalogWholeCase,id:'e2e-catalog-tabular-section-invalid-line-length-cf',
  xml:invalidLengthXml,yaml:invalidLengthYaml,
  retainedYAML:['Комментарий: Комментарий']});
const catalogCollectionEdge=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8')).edges.filter(edge=>
  edge.owner.symbol==='MetadataCatalogRules'&&edge.property==='tabularSections');
if(catalogCollectionEdge.length!==1)throw new Error('Ambiguous catalog tabular-section collection');
const catalogCollection=composedCollection(catalogCollectionEdge[0],catalogTabular.entry,catalog,modules,{
  bindings:{itemOwner:{field:'uuid'},itemName:{field:'name'},
    qualifiedName:{concat:[{input:'parentName'},{literal:'.'},{field:'name'}]},
    kind:{literal:catalogCollectionEdge[0].mapping.xml}},
  extraInputs:{parentName:{type:{kind:'scalar',scalar:'text'}}},
  namespaces:{md:'http://v8.1c.ru/8.3/MDClasses',xr:'http://v8.1c.ru/8.3/xcf/readable'},
  defaultXmlNamespace:'md',
  identity:{index:'metadata.own-identities',
    key:{record:{component:{input:'component'},owner:{input:'parentOwner'},
      kind:{literal:catalogCollectionEdge[0].mapping.xml},name:rowField(catalogCollectionEdge[0].mapping.keyField)}},
    value:rowField('uuid')}});
modules.push(...catalogCollection.modules);
const catalogCollectionExample=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{...catalogPaths,
    collection:{item:'TabularSection',yaml:'ТабличныеЧасти',preserveNamespace:true}}]),encoding:'utf8'}))[0];
const catalogCollectionInputs={...catalogWholeInputs,parentName:catalogWholeExample.parentName};
for(const name of ['itemName','itemOwner','qualifiedName','kind'])delete catalogCollectionInputs[name];
const catalogRoot=rootSourceFromRule(catalog,'migration.catalog-root-source',
  extraction.entries.find(entry=>entry.symbol==='MetadataCatalogRules'));
modules.push(catalogRoot);
factSources.push({id:catalogRoot.id,entry:catalogRoot.id,xml:readFileSync(catalogPaths.xml,'utf8')});
const catalogFormPath='e2e/fixtures/xml/cf/Catalogs/СправочникВладелец/Forms/ФормаВыбора.xml';
const catalogForm=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:catalogFormPath,formHeader:true}]),encoding:'utf8'}))[0];
const catalogFormSource={id:'migration.catalog-form-source',entry:'migration.form-metadata-header',
  xml:catalogForm.xml,inputs:{parent:catalogWholeExample.parentIdentity,
    name:catalogForm.name,identity:catalogForm.identity,
    defaultLanguage:'ru',registeredLanguages:['ru','en']}};
factSources.push(catalogFormSource);
const catalogMinimalInternal=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:catalogPaths.xml,
    xmlItems:[{type:'TabularSection',name:'ТабличнаяЧастьМинимальный'}],internalTypes:true}]),
  encoding:'utf8'}))[0];
const catalogMinimalInternalSource={id:'migration.catalog-minimal-internal-types',
  entry:catalogInternalSource.id,xml:catalogMinimalInternal.xml,
  inputs:{owner:catalogMinimalInternal.owner}};
factSources.push(catalogMinimalInternalSource);
factSources.push({entry:catalogCollection.entry.id,xml:catalogCollectionExample.xml,
  inputs:catalogCollectionInputs});
cases.push({id:'e2e-catalog-tabular-sections-collection-cf',entry:catalogCollection.entry.id,
  xml:catalogCollectionExample.xml,yaml:catalogCollectionExample.yaml,inputs:catalogCollectionInputs,
  xmlQNamePaths:catalogCollectionExample.xmlQNamePaths,
  factBindings:{identities:'metadata.own-identities',roots:'metadata.roots',forms:'metadata.forms',
    typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids'},
  factSourceEntries:[catalogCollection.entry.id,catalogInternalSource.id,
    catalogMinimalInternalSource.id,catalogRoot.id,catalogFormSource.id],
  source:catalogCollectionExample.source});
factSources.push({entry:'migration.document-commands',xml:documentXML,
  inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en'],component:'cf',
    owner:factSources.find(item=>item.entry==='metadata.document-attributes').inputs.owner}});
cases.push({id:'e2e-document-attribute-metadata-path',entry:pathProbe.id,
  xml:'<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"><Content><xr:Object>Document.ДокументВсеСвойства.Attribute.СтроковыйРеквизит</xr:Object></Content></Root>',
  yaml:'Ссылки:\n  - Документ.ДокументВсеСвойства.Реквизит.СтроковыйРеквизит\n',
  noRaw:true,factBindings:{roots:'metadata.roots',pathChildren:'metadata.path-children'},
  factSourceEntries:['migration.document-root-source','metadata.document-attributes'],
  rejectedYAML:['Ссылки:\n  - Документ.ДокументВсеСвойства.Реквизит.НеСуществует\n'],
  source:result.cases[0].source});
cases.push({id:'e2e-document-command-metadata-path',entry:pathProbe.id,
  xml:'<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"><Content><xr:Object>Document.ДокументВсеСвойства.Command.Команда1</xr:Object></Content></Root>',
  yaml:'Ссылки:\n  - Документ.ДокументВсеСвойства.Команда.Команда1\n',
  noRaw:true,factBindings:{roots:'metadata.roots',pathChildren:'metadata.path-children'},
  factSourceEntries:['migration.document-root-source','migration.document-commands'],
  rejectedYAML:['Ссылки:\n  - Документ.ДокументВсеСвойства.Команда.НеСуществует\n'],
  source:result.cases[0].source});
attachCompatibilityContext(modules,cases);
return {modules,cases,factSources,requirements:{inputs:result.requirements.inputs,owner:emission.results[0].ownerRequirements}};
}

if(process.argv[1]===fileURLToPath(import.meta.url)) {
const {catalog}=candidateCatalog({excludePaths:['rust/declarations/candidates/document-attributes.generated.yaml']});
const {modules,cases,factSources,requirements}=documentAttributeOperation(catalog);
const declarations=modules.filter(module=>{
  const existing=catalog.get(module.id);
  if(!existing)return true;
  if(!isDeepStrictEqual({format:'nkdk-declarations/1',...module},existing))
    throw new Error('Conflicting shared declaration: '+module.id);
  return false;
});
const outputs={
  'rust/declarations/candidates/document-attributes.generated.yaml':
    '# Generated by tools/rules-migration/src/document-attributes-operation.mjs\n'+
    yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations},{noRefs:true}),
  'tests/migration/document-attributes-operation.json':
    JSON.stringify({requirements,factSources,cases},null,2)+'\n',
};
for(const [path,content] of Object.entries(outputs)) {
  if(process.argv.includes('--check')) {
    if(readFileSync(path,'utf8')!==content)throw new Error('Stale document attribute operation: '+path);
  } else if(!existsSync(path)||readFileSync(path,'utf8')!==content) {
    mkdirSync(dirname(path),{recursive:true});writeFileSync(path,content);
  }
}
}
