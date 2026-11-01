import {sourceProjection} from '../src/source-projection.mjs';
import {deriveOwnerDefaultProfiles} from '../src/owner-default-profiles.mjs';
import { sourceContract } from '../src/source-contract.mjs';
import { propertyContractSignature } from '../src/property-contract.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emitCandidates } from '../src/emit.mjs';
import { safeUpdate } from '../src/candidate-output.mjs';
import { mapProperty, METADATA_ATTRIBUTE_TYPE_DESCRIPTION_TYPES } from '../src/mappings.mjs';
import { allowedMetadataPaths } from '../src/allowed-metadata-paths.mjs';
import { settingsParameterProfile, settingsParameterCollectionProfile, declaredSettingsParameterTable } from '../src/dcs-value-profile.mjs';
import { checkSnapshot } from '../src/source-snapshot.mjs';
import { candidateDiff } from '../src/candidate-diff.mjs';
import { candidateCatalog } from '../src/candidate-catalog.mjs';
import { readFileSync } from 'node:fs';
import { prepareCollectionProperty } from '../src/collection-property.mjs';
import { sourceProgram } from '../src/source-program.mjs';
import { evaluator, serialize } from '../src/static-value.mjs';
import { ts } from '../src/syntax.mjs';
import {choiceFormCases} from '../src/choice-form-cases.mjs';

test('legacy order expression builder maps to its full collection, not one row',()=>{
  const {catalog}=candidateCatalog();
  const owner=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries.find(entry=>entry.symbol==='CalculatedFieldRules');
  const mapped=mapProperty(owner.properties.find(property=>property.name==='orderExpressions'),catalog,
    {dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'});
  assert.equal(mapped.status,'candidate');
  assert.equal(mapped.id,'common.calculated-field-order-expressions');
  assert.deepEqual(mapped.path,[]);
  const foreign=mapProperty(owner.properties.find(property=>property.name==='orderExpressions'),catalog,
    {dcssch:'urn:another-schema'});
  assert.deepEqual(foreign.path,['dcssch:orderExpression'],'equal prefixes with different namespaces are different paths');
  const available=mapProperty({name:'fields',parameters:{type:'AvailableFields',configurationIndexAddressing:'yamlPath',xml:'dcsset:availableFields',yaml:'ДоступныеПоля'}},catalog,{dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings'});
  assert.equal(available.status,'candidate',available.reason);
  assert.equal(available.id,'common.dcs-available-fields');
  for(const [type,id] of [['OrderItemFields','common.dcs-order-item-fields'],['StructureItemGroupCollection','common.group-item-collection']]) {
    const collection=mapProperty({name:'items',parameters:{type,configurationIndexAddressing:'yamlPath',xml:'dcsset:item',yaml:'Элементы'}},catalog,
      {dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings'});
    assert.equal(collection.status,'candidate',collection.reason);
    assert.equal(collection.id,id);
    assert.deepEqual(collection.path,[],'registered list already owns its item path');
  }
  for(const [type,id] of [['CalculatedField','common.calculated-field'],['DataCompositionSchemaDataSetField','common.data-composition-schema-data-set-field'],['ConditionalAppearance','common.conditional-appearance'],['DCSParameter','common.dcs-parameter']]) {
    const record=mapProperty({name:'value',parameters:{type,xml:'Value',yaml:'Значение'}},catalog);
    assert.equal(record.status,'candidate',record.reason);
    assert.equal(record.id,id);
    assert.equal(record.indexProviders.styleTypes,'metadata.style-item-types');
    assert.equal(record.indexProviders.labels,'dcs.enumeration-labels');
  }

});

test('focused choice form cases keep short, full and absent-type contracts',()=>{
  const generated=choiceFormCases(candidateCatalog().catalog);
  assert.deepEqual(generated.cases.map(row=>row.id),[
    'choice-form-sole-type','choice-form-composite-type','choice-form-no-type',
  ]);
  assert(generated.factSources.every(source=>source.xml.includes('MetaDataObject')));
  assert(generated.cases.every(row=>row.xml.includes('Catalog.СправочникРеквизит.Form.ФормаВыбора')));
  assert.equal(generated.cases[0].yaml,'ФормаВыбора: ФормаВыбора');
  assert(generated.cases.slice(1).every(row=>row.yaml.includes('Справочник.СправочникРеквизит.Форма.ФормаВыбора')));
});

test('all source ChoiceForm properties select shared declarations',()=>{
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const {catalog}=candidateCatalog();
  const uses=entries.flatMap(owner=>owner.properties.filter(property=>property.name==='choiceForm')
    .map(property=>({owner,property})));
  assert.equal(uses.length,47,'review newly extracted ChoiceForm profiles');
  const counts=new Map();
  for(const {owner,property} of uses) {
    const mapped=mapProperty(property,catalog,{xr:'http://v8.1c.ru/8.3/xcf/readable'});
    assert.equal(mapped.status,'candidate',`${owner.symbol}: ${mapped.reason}`);
    counts.set(mapped.id,(counts.get(mapped.id)??0)+1);
  }
  assert.deepEqual(Object.fromEntries(counts),{
    'common.type-form-link-with-empty':44,
    'common.metadata-form-link':1,
    'common.string':2,
  });
});

test('declared sequence defaults attach to every CharacteristicsDescriptions owner',()=>{
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries;
  const {catalog}=candidateCatalog();
  const uses=entries.flatMap(owner=>owner.properties.filter(property=>
    property.type==='CharacteristicsDescriptions').map(property=>({owner,property})));
  assert.equal(uses.length,13);
  for(const {owner,property} of uses) {
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${owner.symbol}: ${mapped.reason}`);
    assert.equal(mapped.id,'common.characteristics-descriptions');
    assert.deepEqual(mapped.path,['Properties','Characteristics']);
    assert.equal(mapped.key,'Характеристики');
    assert.deepEqual(mapped.presence.xml.empty,[{form:'empty-element',denotes:{absent:true}}]);
  }
  const altered=structuredClone(uses[0].property);
  altered.parameters.defaultValueXMLRaw='unexpected';
  assert.equal(mapProperty(altered,catalog).status,'blocked');
  altered.parameters.defaultValueXMLRaw='';
  altered.parameters.preserveExplicitDefaultXML=false;
  assert.equal(mapProperty(altered,catalog).status,'blocked');
  altered.parameters.preserveExplicitDefaultXML=true;
  altered.parameters.defaultValue=[];
  assert.equal(mapProperty(altered,catalog).status,'blocked');
  const enumeration=entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
  const emitted=emitCandidates([enumeration],catalog);
  assert(emitted.entries[0].projections.some(row=>row.fields.includes('characteristics')));
});

test('metadata links derive owner root restrictions from rules.ts parameters', () => {
  const {catalog}=candidateCatalog();
  const base={name:'link',status:'static-parameters',parameters:{yaml:'Ссылка',xml:'Link',xmlParents:['Properties']}};
  for(const type of ['MetadataItemLink','MetadataItemLinks']) {
    const property={...base,parameters:{...base.parameters,type,metadataTarget:{kind:'object',roots:['Catalog']}}};
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
    assert.equal(mapped.id,type==='MetadataItemLink'?'common.metadata-item-link-roots':'common.metadata-item-links-roots');
    assert.deepEqual(mapped.type.bind.allowedRoot,{literal:'Catalog'});
    assert.equal(mapped.inputs.allowedRoot,undefined);
  }
  const unsupported={...base,parameters:{...base.parameters,type:'MetadataItemLink',metadataTarget:{kind:'object',roots:['Document'],filters:[{kind:'hasType',type:'boolean'}]}}};
  assert.equal(mapProperty(unsupported,catalog).status,'blocked');
  const multiple={...base,parameters:{...base.parameters,type:'MetadataItemLink',metadataTarget:{kind:'object',roots:['Document','Catalog']}}};
  assert.equal(mapProperty(multiple,catalog).status,'blocked');
});

test('document register links retain four roots and both empty XML defaults', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const owner=extraction.entries.find(entry=>entry.symbol==='MetadataDocumentRules');
  const property=owner.properties.find(item=>item.name==='registerRecords');
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.metadata-item-links-allowed-roots');
  assert.equal(mapped.ownerFactRole,'registerRecords');
  assert.equal(mapped.indexProviders.roots,'metadata.roots');
  assert.equal(catalog.get(mapped.id).presence[0].xml.canonical[0].form,'empty-element');
  assert.deepEqual(mapped.parameterEquivalences,[
    {parameter:'defaultValueAdoptedXML',equivalentTo:'empty-sequence',via:'common.metadata-item-links-allowed-roots'},
    {parameter:'defaultValueXMLRaw',equivalentTo:'empty-element',via:'common.metadata-item-links-allowed-roots'},
  ]);
  assert.deepEqual(mapped.type.bind.allowedRoots,{sequence:property.parameters.metadataTarget.roots.map(root=>({literal:root}))});
  const other={...property,parameters:{...property.parameters,metadataTarget:{kind:'object',roots:['Document','Catalog']}}};
  assert.equal(mapProperty(other,catalog).status,'candidate');
  assert.deepEqual(mapProperty(other,catalog).type.bind.allowedRoots,{sequence:[{literal:'Document'},{literal:'Catalog'}]});
});

test('object references without a roots restriction use one checked declaration', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const unrestricted=extraction.entries.flatMap(entry=>(entry.properties??[]).filter(property=>
    ['MetadataItemLink','MetadataItemLinks'].includes(property.parameters?.type)
    && JSON.stringify(property.parameters.metadataTarget)==='{"kind":"object"}')
    .map(property=>({entry,property})));
  assert.equal(unrestricted.length,34);
  for(const {entry,property} of unrestricted) {
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${entry.symbol}.${property.name}: ${JSON.stringify(mapped)}`);
  }
  const owner=extraction.entries.find(entry=>entry.symbol==='MetadataConfigurationRules');
  for(const [name,id] of [['defaultStyle','common.metadata-object-link'],['defaultRoles','common.metadata-object-link-list']]) {
    const property=owner.properties.find(item=>item.name===name);
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${name}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,id);
    assert.equal(mapped.indexProviders.roots,'metadata.roots');
  }
  const extension=extraction.entries.find(entry=>entry.symbol==='MetadataConfigurationExtensionRules');
  const adopted=mapProperty(extension.properties.find(item=>item.name==='defaultRoles'),catalog);
  assert.equal(adopted.status,'candidate',JSON.stringify(adopted));
  assert.equal(adopted.id,'common.metadata-object-link-list');
  assert(adopted.parameterEquivalences.some(row=>row.parameter==='defaultValueAdoptedXML'));
  const sequence=extraction.entries.find(entry=>entry.symbol==='MetadataSequenceRules');
  for(const name of ['documents','registerRecords']) {
    const mapped=mapProperty(sequence.properties.find(item=>item.name===name),catalog);
    assert.equal(mapped.status,'candidate',`${name}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,'common.metadata-object-link-list');
    assert(mapped.parameterEquivalences.some(row=>row.parameter==='defaultValueXMLEmpty'));
  }
  const calculation=extraction.entries.find(entry=>entry.symbol==='MetadataChartOfCalculationTypesRules');
  const base=mapProperty(calculation.properties.find(item=>item.name==='baseCalculationTypes'),catalog);
  assert.equal(base.status,'candidate',JSON.stringify(base));
  assert.equal(base.id,'common.metadata-object-link-list');
  assert.equal(base.ownerFactRole,'baseCalculationTypes');
  const exchange=extraction.entries.find(entry=>entry.symbol==='ExchangePlanExtensionPropertyItemRules');
  const metadata=mapProperty(exchange.properties.find(item=>item.name==='metadata'),catalog);
  assert.equal(metadata.status,'candidate',JSON.stringify(metadata));
  assert(metadata.constraints.some(row=>row.diagnostic.code==='value.required'));
});

test('cube dimension object links use declarative presence conditions for scalar and list', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const owner=extraction.entries.find(entry=>entry.symbol==='MetadataExternalDataSourceCubeDimensionRules');
  for(const [name,id] of [
    ['registerDimension','common.metadata-object-link'],
    ['leadingRegisterData','common.metadata-object-link-list'],
  ]) {
    const property=owner.properties.find(item=>item.name===name);
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${name}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,id);
    assert.equal(mapped.indexProviders.roots,'metadata.roots');
    assert.deepEqual(mapped.presence.xml.canonical[0],
      {when:{not:{present:{field:name}}},form:'missing'});
  }
  const scalar=mapProperty(owner.properties.find(item=>item.name==='registerDimension'),catalog);
  assert.deepEqual(scalar.type.with,{typedXML:true});
  const list=mapProperty(owner.properties.find(item=>item.name==='leadingRegisterData'),catalog);
  assert.deepEqual(list.parameterEquivalences,[
    {parameter:'defaultValueXMLRaw',equivalentTo:'empty-element',via:'common.metadata-object-link-list'},
  ]);
  const changed=structuredClone(owner.properties.find(item=>item.name==='leadingRegisterData'));
  changed.parameters.toXML.$unresolved.sourceHash='unreviewed';
  assert.equal(mapProperty(changed,catalog).reason,'requires-expression-mapping');
});

test('explicit member collections accept empty XML defaults and retain nested member paths', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const collections=extraction.entries.flatMap(entry=>(entry.properties??[]).filter(property=>
    property.parameters?.type==='MetadataItemLinks'
    && JSON.stringify(property.parameters.metadataTarget)==='{"kind":"member","owner":"explicit"}')
    .map(property=>({entry,property})));
  assert.equal(collections.length,6);
  for(const {entry,property} of collections) {
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${entry.symbol}.${property.name}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,'common.metadata-member-links');
  }
  assert.equal(catalog.get('common.metadata-member-links').imports.path,
    'common.metadata-member-path-choice');
});

test('member lists with local shorthand and foreign full path are recognized by structure', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const owner=extraction.entries.find(entry=>entry.symbol==='MetadataCalculationRegisterRecalculationDimensionRules');
  const property=owner.properties.find(item=>item.name==='leadingRegisterData');
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.contextual-member-links');
  assert.deepEqual(mapped.type.bind.ownerName,{input:'containingOwnerName'});
  assert.equal(mapped.inputs.ownerName,undefined);
  assert(mapped.parameterEquivalences.some(row=>row.parameter==='defaultValueXMLRaw'));
  const changed=structuredClone(property);
  changed.parameters.metadataTarget.allowedMemberPaths.push(['Catalog','Attribute']);
  assert.notEqual(mapProperty(changed,catalog).status,'candidate');
});

test('explicit member list that also permits an owner reuses the general reference list', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const owner=extraction.entries.find(entry=>entry.symbol==='MetadataFunctionalOptionsParameterRules');
  const property=owner.properties.find(item=>item.name==='use');
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.metadata-item-links');
  assert(mapped.parameterEquivalences.some(row=>row.parameter==='defaultValueXMLRaw'));
});

test('report form links reuse the owner or common form declaration with empty defaults', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const owner=extraction.entries.find(entry=>entry.symbol==='MetadataReportRules');
  for(const name of ['defaultForm','auxiliaryForm','defaultSettingsForm','auxiliarySettingsForm','defaultVariantForm']) {
    const mapped=mapProperty(owner.properties.find(property=>property.name===name),catalog);
    assert.equal(mapped.status,'candidate',`${name}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,'common.owner-or-common-form-link');
    assert.deepEqual(mapped.presence.xml.empty,[{form:'empty-element',denotes:{absent:true}}]);
  }
  assert.equal(catalog.get('common.owner-or-common-form-link').imports.empty,'common.metadata-link-empty');
});

test('document choice form derives its own, common and journal branches from one declaration', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const property=extraction.entries.find(entry=>entry.symbol==='MetadataDocumentRules')
    .properties.find(item=>item.name==='defaultChoiceForm');
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.document-choice-form');
  assert.deepEqual(mapped.type.bind.owner,{input:'containingOwnerName'});
  assert.ok(mapped.inputs.containingOwnerName);
  assert.equal(mapped.inputs.owner,undefined);
  assert.equal(catalog.get(mapped.id).imports.empty,'common.metadata-link-empty');
});

test('explicit member link binds its permitted root and member kind declaratively', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const property=extraction.entries.find(entry=>entry.symbol==='MetadataTaskAddressingAttributeRules')
    .properties.find(item=>item.name==='addressingDimension');
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.metadata-member-path');
  assert.deepEqual(mapped.constraints.filter(row=>row.id.startsWith('addressingDimension-')).map(row=>row.diagnostic.code),
    ['metadata.root-kind','metadata.member-kind']);
  const altered=structuredClone(property);
  altered.parameters.metadataTarget.objectRoots=['InformationRegister','Document'];
  assert.equal(mapProperty(altered,catalog).status,'blocked');
});

test('functional option location derives direct target paths without a private converter', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const property=extraction.entries.find(entry=>entry.symbol==='MetadataFunctionalOptionRules')
    .properties.find(item=>item.name==='location');
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.metadata-allowed-direct-link');
  assert.deepEqual(mapped.type.bind.allowedObjectRoots,{sequence:[{literal:'Constant'}]});
  const unsupported=structuredClone(property);
  unsupported.parameters.metadataTarget.allowedMemberPaths.push(['Catalog','TabularSection','Attribute']);
  assert.equal(mapProperty(unsupported,catalog).status,'blocked');
});

test('allowed metadata paths compile exact shapes and reject unrepresented policies', () => {
  const {catalog}=candidateCatalog();
  const target={kind:'member',owner:'explicit',allowedObjectPaths:[['Catalog']],allowedMemberPaths:[['Catalog','Attribute']]};
  const declarations=allowedMetadataPaths(target,catalog,{id:'probe.allowed-paths'});
  assert.equal(declarations.length,4);
  assert.deepEqual(declarations[0].representations.xml.parts,[
    {literal:'Catalog'},{field:'name0'},
  ]);
  assert.deepEqual(declarations[1].representations.yaml.parts,[
    {literal:'Справочник'},{field:'name0'},{literal:'Реквизит'},{field:'name1'},
  ]);
  const nested=allowedMetadataPaths({...target,nestedObjectRoots:['Subsystem']},catalog,{id:'probe.allowed-paths'});
  assert.equal(nested.find(module=>module.id==='probe.allowed-paths.nested0')?.value.fields.at(-1).name,'tail');
  assert.equal(nested.find(module=>module.id==='probe.allowed-paths.nested0.tail')?.representations.xml.kind,'text-sequence');
  const shared=allowedMetadataPaths({...target,allowedObjectPaths:[['Subsystem']],nestedObjectRoots:['Subsystem']},catalog,{id:'probe.shared-root'});
  assert.equal(shared.filter(module=>module.id.startsWith('probe.shared-root.path')).length,1);
  assert.equal(allowedMetadataPaths({kind:'member',owner:'explicit',nestedObjectRoots:['Subsystem']},catalog,{id:'probe.nested-only'}).at(-1).id,'probe.nested-only');
  assert.throws(()=>allowedMetadataPaths({...target,nestedObjectRoots:['Subsystem','Subsystem']},catalog,{id:'probe.allowed-paths'}),/Duplicate nested metadata root/);
  assert.throws(()=>allowedMetadataPaths({...target,allowedMemberPaths:[['Catalog','Unknown']]},catalog,{id:'probe.allowed-paths'}),/Unknown metadata path kind/);
  const verified=allowedMetadataPaths(target,catalog,{id:'probe.indexed-paths',verifyTargets:true});
  const rootOnly=allowedMetadataPaths({...target,allowedMemberPaths:[]},catalog,{id:'probe.root-only',verifyTargets:true});
  assert.deepEqual(Object.keys(rootOnly[0].inputs),['roots']);
  assert.deepEqual(Object.keys(rootOnly.at(-1).inputs),['roots']);
  assert.deepEqual(rootOnly.at(-1).value.item.bind,{roots:{input:'roots'}});
  assert.deepEqual(rootOnly.at(-2).value.variants[0].type.bind,{roots:{input:'roots'}});
  const direct=verified.find(module=>module.id==='probe.indexed-paths.path1');
  assert.deepEqual(Object.keys(direct.inputs),['roots','pathChildren']);
  assert.equal(direct.constraints[0].id,'target-exists');
  assert.deepEqual(Object.keys(verified.at(-1).inputs),['roots','pathChildren']);
  const indexedNested=allowedMetadataPaths({...target,nestedObjectRoots:['Subsystem']},catalog,
    {id:'probe.indexed-nested',verifyTargets:true});
  assert.equal(indexedNested.find(module=>module.id==='probe.indexed-nested.nested0')?.constraints[0].id,'target-exists');
});

test('functional option content is emitted from its declared path policy', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const property=extraction.entries.find(entry=>entry.symbol==='MetadataFunctionalOptionRules')
    .properties.find(item=>item.name==='content');
  const mapped=mapProperty(property,catalog,{xr:'http://v8.1c.ru/8.3/xcf/readable'});
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.indexProviders.roots,'metadata.roots');
  assert.equal(mapped.indexProviders.pathChildren,'metadata.path-children');
  assert.equal(catalog.get(mapped.id).value.kind,'sequence');
  assert.equal(catalog.get(mapped.id).representations.xml.path[0],'xr:Object');
  assert(catalog.get(`${mapped.id}.nested0`).constraints.some(rule=>rule.id==='target-exists'));
  const rootOnly=structuredClone(property);
  rootOnly.parameters.metadataTarget.allowedObjectPaths=[['Catalog']];
  rootOnly.parameters.metadataTarget.allowedMemberPaths=[];
  rootOnly.parameters.metadataTarget.nestedObjectRoots=[];
  const rootMapped=mapProperty(rootOnly,catalog,{xr:'http://v8.1c.ru/8.3/xcf/readable'});
  assert.equal(rootMapped.status,'candidate');
  assert.deepEqual(rootMapped.indexProviders,{roots:'metadata.roots'});
});

test('form settings storage derives contextual report forms and object links from its source target', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  for(const symbol of ['ClientApplicationFormRules','ClientApplicationFormWithExtendedPresentationRules']) {
    const property=extraction.entries.find(entry=>entry.symbol===symbol).properties.find(item=>item.name==='settingsStorage');
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
    assert.equal(mapped.id,'common.form-settings-storage-link');
    assert.deepEqual(mapped.indexProviders,{roots:'metadata.roots',formTargets:'metadata.forms'});
  }
});

test('current-owner member link uses one reusable shorthand contract', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const property=extraction.entries.find(entry=>entry.symbol==='MetadataReportRules')
    .properties.find(item=>item.name==='mainDataCompositionSchema');
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.owner-member-link');
  assert.deepEqual(mapped.type.bind.ownerRoot,{input:'ownerRoot'});
  assert.deepEqual(mapped.type.bind.memberKind,{literal:'Template'});
  assert.deepEqual(mapped.presence.xml.canonical[0].form,'empty-element');
  const unsupported=structuredClone(property);
  unsupported.parameters.metadataTarget.memberKinds=['StandardAttribute'];
  assert.equal(mapProperty(unsupported,catalog).status,'blocked');
});

test('calculation register dimension derives owner root and presence from source rules', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const owner=extraction.entries.find(entry=>entry.symbol==='MetadataCalculationRegisterRecalculationDimensionRules');
  const property=owner.properties.find(item=>item.name==='registerDimension');
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.owner-member-link');
  assert.deepEqual(mapped.type.bind.ownerRoot,{literal:'CalculationRegister'});
  assert.deepEqual(mapped.type.bind.memberKind,{literal:'Dimension'});
  assert.equal(mapped.constraints.some(row=>row.id==='registerDimension-required'),true);
  assert.equal(mapped.presence.xml.canonical[0].form,'missing');
  const mixed=owner.properties.find(item=>item.name==='leadingRegisterData');
  assert.equal(mapProperty(mixed,catalog).id,'common.contextual-member-links');
});

test('required and empty-default metadata references retain their owner contracts', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const owner=extraction.entries.find(entry=>entry.symbol==='MetadataConfigurationRules');
  const language=mapProperty(owner.properties.find(property=>property.name==='defaultLanguage'),catalog);
  assert.equal(language.status,'candidate',JSON.stringify(language));
  assert.equal(language.constraints.some(constraint=>constraint.id==='defaultLanguage-required'),true);
  const interfaceLink=mapProperty(owner.properties.find(property=>property.name==='defaultInterface'),catalog);
  assert.equal(interfaceLink.status,'candidate',JSON.stringify(interfaceLink));
  assert.deepEqual(interfaceLink.parameterEquivalences,[{parameter:'defaultValueXML',equivalentTo:'defaultValueXMLRaw'}]);
  assert.equal(interfaceLink.presence.xml.canonical[0].form,'empty-element');
});

test('owner name without a YAML property is derived from the owner input', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  for(const symbol of ['MetadataExternalDataSourceTableRules','MetadataExternalDataSourceDimensionTableRules']) {
    const property=extraction.entries.find(entry=>entry.symbol===symbol).properties.find(item=>item.name==='name');
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${symbol}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,'common.string');
    assert.equal(mapped.key,undefined);
    assert.deepEqual(mapped.path,['Properties','Name']);
    assert.deepEqual(mapped.inputs.ownerName,{type:{kind:'scalar',scalar:'text'}});
    assert.deepEqual(mapped.presence.yaml,{missing:{denotes:{input:'ownerName'}}});
  }
  const invalid={name:'name',status:'static-parameters',parameters:{type:'string',xmlParents:['Properties'],required:true,defaultValueXML:'wrong'}};
  assert.equal(mapProperty(invalid,catalog).status,'blocked');
});

test('reviewed adopted-only field collection is expressed by a shared XML condition', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const property=extraction.entries.find(entry=>entry.symbol==='MetadataExternalDataSourceTableRules').properties.find(item=>item.name==='keyFields');
  const {catalog}=candidateCatalog();
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.fields-list-readable');
  assert.deepEqual(mapped.inputs.xmlDefaultVariant,{type:{kind:'scalar',scalar:'text'}});
  assert.deepEqual(mapped.presence.xml.canonical,[
    {when:{and:[{eq:[{input:'xmlDefaultVariant'},{literal:'adopted'}]},{not:{present:{field:'keyFields'}}}]},form:'missing'},
    {when:{not:{present:{field:'keyFields'}}},form:'empty-element'},
    {form:'ordinary'},
  ]);
  const changed=structuredClone(property);
  changed.parameters.toXML.$unresolved.sourceHash='unreviewed';
  assert.equal(mapProperty(changed,catalog).status,'blocked');
});

test('Color properties use one declared common and retain the StyleItem index provider', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const properties=extraction.entries.flatMap(entry=>(entry.properties??[]).filter(property=>property.parameters?.type==='Color').map(property=>({entry,property})));
  assert.equal(properties.length,192);
  for(const {entry,property} of properties) {
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${entry.symbol}.${property.name}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,'common.color');
    assert.equal(mapped.indexProviders?.styleTypes,'metadata.style-item-types');
  }
  const invalid={...properties[0].property,parameters:{...properties[0].property.parameters,metadataTarget:{kind:'object',roots:['StyleItem'],filters:[{kind:'styleItemType',values:['Font']}]}}};
  assert.equal(mapProperty(invalid,catalog).status,'blocked');
});

test('Border properties use the declared record, including ineffective legacy scalar defaults', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const properties=extraction.entries.flatMap(entry=>(entry.properties??[]).filter(property=>property.parameters?.type==='Border').map(property=>({entry,property})));
  assert.equal(properties.length,11);
  for(const {entry,property} of properties) {
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${entry.symbol}.${property.name}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,'common.border');
    assert.equal(mapped.indexProviders?.styleTypes,'metadata.style-item-types');
    if(Object.hasOwn(property.parameters,'implicitValueYAML')) {
      assert.ok(mapped.parameterEquivalences?.some(item=>item.parameter==='implicitValueYAML' && item.equivalentTo==='ineffective-scalar-default-for-record'));
    }
  }
});

test('Picture properties use the shared declaration and preserve empty XML forms', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const properties=extraction.entries.flatMap(entry=>(entry.properties??[]).filter(property=>property.parameters?.type==='Picture').map(property=>({entry,property})));
  assert.equal(properties.length,82);
  for(const {entry,property} of properties) {
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${entry.symbol}.${property.name}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,'common.picture');
    assert.deepEqual(mapped.type.with,property.parameters.defaultValueXMLRaw===''?{allowEmpty:true}:undefined);
    assert.deepEqual(mapped.presence.xml.empty,[{form:'empty-element',denotes:{absent:true}}]);
    if(property.parameters.defaultValueXMLRaw==='') {
      const fragment={inputs:{},imports:{value:mapped.id},value:{fields:[{name:property.name,type:structuredClone(mapped.type)}]},presence:[structuredClone(mapped.presence)]};
      deriveOwnerDefaultProfiles(fragment,{properties:[property]},{adopted:{input:'adopted'},catalog});
      assert.equal(fragment.presence[0].xml.empty,undefined);
      assert.equal(fragment.presence[0].yaml.missing.denotes.else.variant.name,'Пустая');
    }
  }
  const invalid={...properties[0].property,parameters:{...properties[0].property.parameters,metadataTarget:{kind:'object',roots:['Catalog']}}};
  assert.equal(mapProperty(invalid,catalog).status,'blocked');
});

test('metadata field collections map to one reusable declaration for every owner', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const fields=extraction.entries.flatMap(entry=>(entry.properties??[]).filter(property=>property.parameters?.type==='MetadataFields').map(property=>({entry,property})));
  assert.equal(fields.length,8);
  for(const {entry,property} of fields) {
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${entry.symbol}.${property.name}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,property.parameters.metadataTarget?'common.owner-metadata-fields':'common.metadata-fields');
    assert.deepEqual(mapped.path,['Properties','DataLockFields']);
  }
  const foreignTarget={...fields[0].property,parameters:{...fields[0].property.parameters,metadataTarget:{kind:'object',roots:['Catalog']}}};
  assert.equal(mapProperty(foreignTarget,catalog).reason,'metadata-fields-target-profile');
});

test('functional option collections map from all form owners without a custom handler', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const {catalog}=candidateCatalog();
  const fields=extraction.entries.flatMap(entry=>(entry.properties??[]).filter(property=>property.parameters?.type==='FunctionalOptionsProperty').map(property=>({entry,property})));
  assert.equal(fields.length,3);
  for(const {entry,property} of fields) {
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${entry.symbol}.${property.name}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,'common.functional-options-property');
    assert.deepEqual(mapped.path,['FunctionalOptions']);
  }
});

test('child subsystem names keep the repeated XML item inside one shared declaration', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const owner=extraction.entries.find(entry=>entry.symbol==='MetadataSubsystemRules');
  const property=owner.properties.find(field=>field.name==='subsystems');
  const mapped=mapProperty(property,candidateCatalog().catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.child-subsystem-names');
  assert.deepEqual(mapped.path,['ChildObjects']);
});

test('root XML attributes are emitted as relative owner projections', () => {
  const uuid={name:'uuid',source:{path:'owner.ts',line:1,column:1},status:'static-parameters',
    type:'uuid',parameters:{type:'uuid',xml:'_uuid',xmlOnly:true,toYAML:false,fromYAML:false,evaluateWhenYAMLMissing:true}};
  const owner={symbol:'OwnerRules',path:'owner.ts',comparison:{status:'keys-match'},properties:[uuid],xmlOrder:{status:'static',keys:['uuid']}};
  const {catalog}=candidateCatalog();
  const result=emitCandidates([owner],catalog);
  assert.equal(result.entries[0].properties[0].status,'candidate');
  assert.equal(result.entries[0].projections[0].root,null);
  const fragment=result.modules.find(module=>module.kind==='fragment');
  assert.deepEqual(fragment.representations.xml.fields,[{field:'uuid',path:[],attribute:'uuid'}]);
  assert.deepEqual(fragment.representations.yaml.fields,[]);
});

test('user visibility properties share the role mapping declaration across form owners', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const fields=extraction.entries.flatMap(entry=>(entry.properties??[]).filter(property=>property.parameters?.type==='UserVisible').map(property=>({entry,property})));
  assert.equal(fields.length,46);
  const {catalog}=candidateCatalog();
  for(const {entry,property} of fields) {
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${entry.symbol}.${property.name}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,'common.user-visible');
    assert.deepEqual(mapped.path,[property.name[0].toUpperCase()+property.name.slice(1)]);
    assert.ok(mapped.inputs.roles);
  }
  const foreign={...fields[0].property,parameters:{...fields[0].property.parameters,metadataTarget:{kind:'object',roots:['Catalog']}}};
  assert.equal(mapProperty(foreign,catalog).reason,'user-visible-role-target-profile');
});

test('the standard attribute choice form uses the general explicit-owner form link', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const item=extraction.entries.find(entry=>entry.symbol==='StandardAttributeDescriptionRules');
  const choiceForm=item.properties.find(property=>property.name==='choiceForm');
  const {catalog}=candidateCatalog();
  const mapped=mapProperty(choiceForm,catalog,{xr:'http://v8.1c.ru/8.3/xcf/readable'});
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.metadata-form-link');
  assert.deepEqual(Object.keys(mapped.inputs).sort(),['forms','roots']);
});

test('the standard attribute name is a translated XML attribute and YAML collection key', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const item=extraction.entries.find(entry=>entry.symbol==='StandardAttributeDescriptionRules');
  const name=prepareCollectionProperty(item.properties.find(property=>property.name==='name'),{yamlAsArray:false,keyField:'name'});
  const mapped=mapProperty(name,candidateCatalog().catalog,{xr:'http://v8.1c.ru/8.3/xcf/readable'});
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.standard-attribute-name');
  assert.deepEqual([mapped.path,mapped.attribute,mapped.key],[[],'name','name']);
});

test('a hidden scalar supplied by a named collection key needs no literal default', () => {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const item=extraction.entries.find(entry=>entry.symbol==='DCSParameterRules');
  const original=item.properties.find(property=>property.name==='name');
  const mapping={yamlAsArray:false,keyField:'name'};
  const lifted=prepareCollectionProperty(original,mapping);
  const mapped=mapProperty(lifted,candidateCatalog().catalog,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'});
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.string');
  assert.deepEqual([mapped.path,mapped.key],[['dcssch:name'],'Имя']);
  const unrelated=prepareCollectionProperty({...original,name:'other'},mapping);
  assert.equal(mapProperty(unrelated,candidateCatalog().catalog,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'}).reason,'hidden-scalar-default-required');
  const disabled=prepareCollectionProperty({...original,parameters:{...original.parameters,fromYAML:false}},mapping);
  assert.equal(mapProperty(disabled,candidateCatalog().catalog,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'}).reason,'hidden-scalar-default-required');
});

test('the declared standard attribute names cover the source names', () => {
  const path='packages/rules/metadata/commonObjects/standardAttributeDescription/standartAttributeNames.ts';
  const program=sourceProgram({[path]:readFileSync(path,'utf8')});
  const file=[...program.parsed.values()][0];
  const declaration=file.statements.filter(ts.isVariableStatement)
    .flatMap(statement=>[...statement.declarationList.declarations])
    .find(item=>item.name.getText()==='StandartAttributeNameToYAML');
  const issues=[];
  const source=serialize(evaluator(program)(declaration.initializer),issues);
  assert.deepEqual(issues,[]);
  const declared=candidateCatalog().catalog.get('common.path-standard-attribute').enum;
  for(const [internal,yaml] of Object.entries(source))assert.equal(declared[internal],yaml,internal);
});

test('candidate generation shares fragments, rejects unknown parameters and protects edits', () => {
  const property = {name:'enabled', source:{path:'shared.ts',line:1,column:1}, status:'static-parameters',
    type:'boolean', parameters:{type:'boolean',yaml:'Включено',xmlParents:['Properties'],implicitValueYAML:false,defaultValueXML:false}};
  const entry = symbol => ({symbol, path:`${symbol}.ts`, comparison:{status:'keys-match'}, properties:[property]});
  const catalog = new Map([['common.boolean', {}]]);
  const result = emitCandidates([entry('FirstRules'),entry('SecondRules')], catalog, () => 'shared#flags');
  const fragments = result.modules.filter(m => m.kind === 'fragment');
  assert.equal(fragments.length, 1);
  assert.deepEqual(fragments[0].presence[0].yaml, {default:{literal:false}});
  assert.deepEqual(fragments[0].representations.xml.fields[0].path, ['Properties','Enabled']);
  assert.equal(result.modules.filter(m => m.kind === 'object').length, 1);
  assert.equal(result.entries[0].projections[0].id, result.entries[1].projections[0].id);
  assert.deepEqual(emitCandidates([entry('FirstRules'),entry('SecondRules')], catalog, () => 'shared#flags'), result);
  const rejected = emitCandidates([{...entry('BadRules'), properties:[{...property, parameters:{...property.parameters, magic:true}}]}], catalog);
  assert.equal(rejected.modules.length, 0);
  assert.equal(rejected.entries[0].properties[0].status, 'blocked');
  assert.throws(() => safeUpdate({'a.yaml':'manual'}, {'a.yaml':'old'}, {'a.yaml':'new'}), /modified/);
  assert.throws(() => safeUpdate({'extra.yaml':'manual'}, {}, {'a.yaml':'new'}), /unowned/);
  assert.doesNotThrow(() => safeUpdate({'a.yaml':'old'}, {'a.yaml':'old'}, {'a.yaml':'new'}));
  assert.throws(() => checkSnapshot({'new.ts':'x'},[]), /file set changed/);
  assert.throws(() => checkSnapshot({'old.ts':'x'},[{path:'old.ts',sha256:'old'}]), /Stale snapshot/);
  for (const [type, id] of [['string','common.string'], ['number','common.exact-decimal'], ['boolean','common.boolean'], ['SystemEnumeration','system.Example']]) {
    const parameters={type,yaml:'Обязательное',required:true,...(type==='SystemEnumeration'?{typeSE:'Example'}:{})};
    const source={...property,parameters};
    const declarations=new Map([[id,{enum:{A:'А'}}]]);
    const required=mapProperty(source,declarations);
    assert.equal(required.status,'candidate');
    assert.deepEqual(required.presence,{target:{field:property.name},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}});
    assert.deepEqual(required.constraints,[{
      id:`${property.name}-required`,appliesTo:['xml-import','yaml-validation'],assert:{present:{field:property.name}},
      diagnostic:{code:'value.required',severity:'warning',at:{field:property.name},message:'Обязательное значение отсутствует'},
    }]);
    assert.deepEqual(mapProperty(source,new Map([[id,{presence:[{target:'self',yaml:{missing:{denotes:{absent:true}}}}]}]])).presence,required.presence);
    for(const extra of [{required:'true'},{defaultValueXMLRaw:''},{implicitValueYAML:false},{defaultValueXML:false},{implicitValueXML:false}]) {
      assert.equal(mapProperty({...source,parameters:{...parameters,...extra}},declarations).status,'blocked');
    }
    assert.equal(mapProperty({...source,parameters:{...parameters,yaml:undefined}},declarations).status,'blocked');
    assert.equal(mapProperty(source,new Map([[id,{presence:[{target:'self',yaml:{default:{literal:false}}}]}]])).reason,'required-common-presence-profile');
  }
  const cases = [
    ['string','common.string',{defaultValueXMLRaw:''}],
    ['number','common.exact-decimal',{implicitValueYAML:30}],
    ['SystemEnumeration','system.Example',{typeSE:'Example',implicitValueYAML:'A'}],
    ['I8nText','common.i8n-text',{excludeIfEqualNameYAML:true}],
  ];
  for (const [type,id,params] of cases) {
    const mapped = mapProperty({...property,type,parameters:{type,yaml:'Значение',...params}},new Map([[id,{enum:{A:'А'}}]]));
    assert.equal(mapped.status,'candidate');
    assert.equal(mapped.id,id);
    if (type === 'I8nText') {
      assert.deepEqual(mapped.type.bind.ownerName,{input:'ownerName'});
      assert.equal(Object.hasOwn(mapped.presence,'yaml'),false);
      const explicit = mapProperty({...property,parameters:{type,yaml:'Текст',excludeIfEqualNameYAML:true,noImplicitValueYAML:true}},new Map([[id,{}]]));
      assert.deepEqual(explicit.presence.yaml,{missing:{denotes:{absent:true}}});
    }
  }
  assert.equal(mapProperty({...property,parameters:{...property.parameters,defaultValueXML:true}},catalog).status,'blocked');
  assert.equal(mapProperty({...property,type:'number',parameters:{type:'number',yaml:'Число',implicitValueYAML:0.1}},new Map([['common.exact-decimal',{}]])).reason,'exact-number-source-required');
  for (const type of ['Module','MetadataAttribute']) assert.equal(mapProperty({...property,type,parameters:{type,yaml:'Объект'}},catalog).status,'blocked');
  const dateCatalog=new Map([['common.typed-date-time',{}],['common.date-time',{}]]);
  const dateParams={type:'dateTime',yaml:'Дата',typedXML:true,defaultValueXML:'0001-01-01T00:00:00'};
  const date=mapProperty({...property,parameters:dateParams},dateCatalog);
  assert.equal(date.id,'common.typed-date-time');
  assert.deepEqual(date.presence.yaml,{missing:{denotes:{literal:dateParams.defaultValueXML}},omitWhen:{eq:[{field:'enabled'},{literal:dateParams.defaultValueXML}]}});
  assert.equal(mapProperty({...property,parameters:{type:'dateTime',yaml:'Дата'}},dateCatalog).id,'common.date-time');
  for(const params of [{typedXML:'xs:dateTime'},{implicitValueYAML:'01.01.0001'},{defaultValueXML:'not-a-date'},{defaultValueXML:'2026-09-10T12:00:00+03:00'}])assert.equal(mapProperty({...property,parameters:{...dateParams,...params}},dateCatalog).status,'blocked');
  const rawText=mapProperty({...property,parameters:{type:'I8nText',yaml:'Текст',defaultValueXMLRaw:''}},new Map([['common.i8n-text',{}]]));
  assert.deepEqual(rawText.presence.xml.canonical,[{when:{not:{present:{field:'enabled'}}},form:'empty-element'}]);
  const objectText=mapProperty({...property,parameters:{type:'I8nText',yaml:'Текст',defaultValueXMLRaw:{}}},new Map([['common.i8n-text',{}]]));
  assert.equal(objectText.status,'candidate');
  assert.deepEqual(objectText.presence.xml.canonical,rawText.presence.xml.canonical);
  assert.ok(objectText.parameterEquivalences.some(row=>row.parameter==='defaultValueXMLRaw'));
  assert.equal(mapProperty({...property,parameters:{type:'I8nText',yaml:'Текст',defaultValueXMLRaw:{extra:true}}},new Map([['common.i8n-text',{}]])).status,'blocked');
  const emptyTextParameters={type:'I8nText',yaml:'Текст',defaultValueXMLRaw:'',implicitValueYAML:''};
  const emptyText=mapProperty({...property,parameters:emptyTextParameters},new Map([['common.i8n-text',{}]]));
  assert.equal(emptyText.status,'candidate');
  assert.deepEqual(emptyText.presence.yaml.missing,{denotes:{absent:true}});
  assert.ok(emptyText.presence.yaml.omitWhen);
  for(const extra of [{implicitValueYAML:'other'},{defaultValueXMLRaw:undefined},{excludeIfEqualNameYAML:true},{preserveEmptyXML:true}]) {
    assert.equal(mapProperty({...property,parameters:{...emptyTextParameters,...extra}},new Map([['common.i8n-text',{}]])).status,'blocked');
  }
  const attributeSynonym=mapProperty({...property,name:'synonym',status:'requires-expression-mapping',parameters:{
    type:'I8nText',yaml:'Синоним',xml:'Synonym',xmlParents:['Properties'],excludeIfEqualNameYAML:true,
    defaultValue:{$unresolved:{kind:'expression',source:{path:'packages/rules/metadata/commonObjects/metadataAttribute/fragments.ts',line:23,column:17},sourceHash:'574e33c1d66458f04ae34d1f3fc5d0411b61a94592f07cbe534c6a13e932019d'}},
    defaultValueXMLEmpty:{items:{}},defaultValueXMLRaw:'',preserveEmptyXML:true,
  }},new Map([['common.i8n-text',{}]]));
  assert.equal(attributeSynonym.status,'candidate');
  assert.equal(attributeSynonym.id,'common.i8n-text');
  assert.equal(attributeSynonym.type.with.excludeIfEqualNameYAML,true);
  assert.equal(attributeSynonym.type.with.preserveEmptyXML,true);
  assert.ok(attributeSynonym.parameterEquivalences.some(item=>item.parameter==='defaultValue'));
  const titlePath='packages/rules/metadata/forms/commonObjects/formAttribute/rules.ts';
  const titleProgram=sourceProgram({[titlePath]:readFileSync(titlePath,'utf8')});
  const titleFile=titleProgram.parsed.get('/'+titlePath);
  let titleCallback;
  function findTitleDefault(node) {
    if(ts.isPropertyAssignment(node) && node.name.getText(titleFile)==='defaultValue' &&
      ts.isArrowFunction(node.initializer))titleCallback=node.initializer;
    ts.forEachChild(node,findTitleDefault);
  }
  findTitleDefault(titleFile);
  const titleIssues=[];
  const titleDefault=serialize(evaluator(titleProgram)(titleCallback),titleIssues);
  const titleProperty={...property,name:'title',status:'requires-expression-mapping',issues:titleIssues,
    parameters:{type:'I8nText',xml:'Title',yaml:'Заголовок',skipEmptyToXML:true,
      excludeIfEqualNameYAML:true,defaultValue:titleDefault}};
  const title=mapProperty(titleProperty,new Map([['common.i8n-text',{}]]));
  assert.equal(title.status,'candidate');
  assert.deepEqual(title.presence.xml.missing,{denotes:{sequence:[{record:{
    language:{input:'defaultLanguage'},content:{literal:''}}}]}});
  assert.equal(title.type.with.skipEmptyToXML,true);
  assert.equal(Object.hasOwn(title.inputs,'operation'),false);
  const titleEmission=emitCandidates(['FormAttributeRules','FormAttributeColumnRules'].map((symbol,index)=>({
    path:titlePath,symbol,comparison:{status:'keys-match'},properties:[{...titleProperty,
      source:{path:titlePath,line:100+index,column:5}}],
  })),new Map([['common.i8n-text',{}]]),property=>`${property.source.path}:${property.source.line}`);
  assert.equal(titleEmission.modules.filter(module=>module.kind==='fragment').length,1,
    'one checked title definition shared by both owners');
  const changedTitle=structuredClone(titleProperty);
  changedTitle.parameters.defaultValue.$unresolved.expression='() => null';
  assert.equal(mapProperty(changedTitle,new Map([['common.i8n-text',{}]])).status,'blocked');
  const attributeUuid=mapProperty({...property,name:'uuid',parameters:{
    type:'uuid',xml:'_uuid',evaluateWhenYAMLMissing:true,xmlOnly:true,toYAML:false,fromYAML:false,
  }},new Map([['common.uuid',{inputs:{}}]]));
  assert.equal(attributeUuid.status,'candidate');
  assert.equal(attributeUuid.identityProjection,true);
  const metadataLinkCatalog=new Map([
    ['common.metadata-form-link',{id:'common.metadata-form-link',inputs:{roots:{type:{kind:'index'}},forms:{type:{kind:'index'}}}}],
    ['common.type-form-link-with-empty',{id:'common.type-form-link-with-empty',inputs:{roots:{type:{kind:'index'}},forms:{type:{kind:'index'}},typeItems:{type:{kind:'sequence'}}}}],
    ['common.owner-attribute-link',{id:'common.owner-attribute-link',inputs:{ownerRoot:{type:{kind:'scalar',scalar:'text'}},ownerName:{type:{kind:'scalar',scalar:'text'}},attributes:{type:{kind:'sequence'}}}}],
  ]);
  const choiceForm=mapProperty({...property,name:'choiceForm',parameters:{type:'MetadataItemLink',yaml:'ФормаВыбора',xml:'ChoiceForm',xmlParents:['Properties'],defaultValueXMLRaw:'',metadataTarget:{kind:'member',owner:'type',typeProperty:'type',memberKinds:['Form']}}},metadataLinkCatalog);
  assert.equal(choiceForm.id,'common.type-form-link-with-empty');
  assert.deepEqual(Object.keys(choiceForm.inputs),['roots','forms']);
  assert.deepEqual(choiceForm.type.bind.typeItems,{get:{of:{field:'type'},field:'items'}});
  const storageField=mapProperty({...property,name:'binaryDataStorageLocationUseField',parameters:{type:'MetadataItemLink',yaml:'Поле',xml:'BinaryDataStorageLocationUseField',xmlParents:['Properties'],metadataTarget:{kind:'member',owner:'this',memberKinds:['Attribute'],filters:[{kind:'directMember'},{kind:'hasType',type:'boolean'}]}}},metadataLinkCatalog);
  assert.equal(storageField.id,'common.owner-attribute-link');
  assert.deepEqual(Object.keys(storageField.inputs),['ownerRoot','attributes','containingOwnerName']);
  assert.deepEqual(storageField.type.bind.ownerName,{input:'containingOwnerName'});
  const mixedPresence=new Map([[storageField.id,{
    id:storageField.id,value:{kind:'record'},presence:[
      {target:{field:'owner'},yaml:{default:{input:'ownerName'}}},
      {target:'self',xml:{missing:{denotes:{absent:true}}}},
    ],
  }]]);
  assert.equal(mapProperty({...property,name:'binaryDataStorageLocationUseField',parameters:{type:'MetadataItemLink',yaml:'Поле',xml:'BinaryDataStorageLocationUseField',xmlParents:['Properties'],metadataTarget:{kind:'member',owner:'this',memberKinds:['Attribute'],filters:[{kind:'directMember'},{kind:'hasType',type:'boolean'}]}}},mixedPresence).status,'candidate');
  for(const [type,id] of [['ChoiceParameterLinks','common.choice-parameter-links'],['ChoiceParameters','common.choice-parameters']]) {
    const mapped=mapProperty({...property,name:'choices',parameters:{type,yaml:'Выбор',xml:'Choice',xmlParents:['Properties'],defaultValueXMLRaw:''}},new Map([[id,{id}]]));
    assert.equal(mapped.id,id);
    assert.deepEqual(mapped.presence.xml.canonical,[{when:{not:{present:{field:'choices'}}},form:'empty-element'}]);
    assert.deepEqual(mapped.presence.yaml.missing,{denotes:{absent:true}});
    const actualShape=new Map([[id,{id,imports:{item:'common.choice-item'},value:{kind:'sequence',item:{use:'item'}},representations:{yaml:{kind:type==='ChoiceParameters'?'record-mapping':'sequence'}}}],['common.choice-item',{value:{kind:'record'}}]]);
    assert.equal(mapProperty({...property,name:'choices',parameters:{type,yaml:'Выбор',xml:'Choice',xmlParents:['Properties'],defaultValueXMLRaw:''}},actualShape).status,'candidate');
  }
  const fillProfile=candidateCatalog().catalog.get('common.fill-value-profile');
  const standaloneValueProfile=candidateCatalog().catalog.get('common.standalone-metadata-value-profile');
  const metadataValueCatalog=new Map([
    ['common.metadata-value',{id:'common.metadata-value',inputs:{onlyStringType:{type:{kind:'scalar',scalar:'boolean'}}}}],
    ['common.fill-value-profile',fillProfile],
    ['common.standalone-metadata-value-profile',standaloneValueProfile],
  ]);
  const fillValue=mapProperty({...property,name:'fillValue',parameters:{type:'MetadataValue',yaml:'ЗначениеЗаполнения',xml:'FillValue',xmlParents:['Properties'],defaultValueXMLRaw:{'_xsi:nil':true},exportNilValue:true}},metadataValueCatalog);
  assert.equal(fillValue.id,'common.metadata-value');
  assert.deepEqual(fillValue.type.with,{exportNilValue:true});
  assert.equal(fillValue.siblingExpressions.onlyStringType.source,'type');
  assert.equal(fillValue.inputs.definedTypes.type.kind,'index');
  assert.deepEqual(fillValue.indexProviders,{definedTypes:'metadata.defined-type-alternatives'});
  assert.deepEqual(fillValue.ownerConstraints.bindings.definedTypes,{input:'definedTypes'});
  assert.equal(fillValue.presence.target.field,'fillValue');
  assert.equal(fillValue.presence.yaml.missing.denotes.then.variant.name,'text');
  const emptyStringValue=mapProperty({...property,name:'fillValue',parameters:{type:'MetadataValue',yaml:'ЗначениеЗаполнения',xml:'FillValue',xmlParents:['Properties'],defaultValueXMLRaw:{'_xsi:type':'xs:string'}}},metadataValueCatalog);
  assert.equal(emptyStringValue.status,'candidate');
  assert.equal(emptyStringValue.presence.target.field,'fillValue');
  for(const exportNilValue of [false,'true']) {
    const incompatible=mapProperty({...property,name:'fillValue',parameters:{type:'MetadataValue',yaml:'ЗначениеЗаполнения',defaultValueXMLRaw:{'_xsi:nil':true},exportNilValue}},new Map([['common.metadata-value',{id:'common.metadata-value'}]]));
    assert.equal(incompatible.status,'blocked');
    assert.equal(incompatible.reason,'metadata-value-profile');
  }
  const implicitNilValue=mapProperty({...property,name:'fillValue',parameters:{type:'MetadataValue',yaml:'ЗначениеЗаполнения',xml:'FillValue',xmlParents:['Properties'],defaultValueXMLRaw:{'_xsi:nil':true}}},metadataValueCatalog);
  assert.equal(implicitNilValue.id,'common.metadata-value');
  assert.equal(implicitNilValue.presence.target.field,'fillValue');
  const realProfile=mapProperty({...property,name:'fillValue',parameters:{type:'MetadataValue',yaml:'ЗначениеЗаполнения',xml:'FillValue',xmlParents:['Properties'],defaultValueXMLRaw:{'_xsi:type':'xs:string'},exportNilValue:true}},metadataValueCatalog);
  assert.equal(realProfile.status,'candidate');
  const fillCompatibility=candidateCatalog().catalog.get('common.fill-value-compatibility');
  const fillOwner=emitCandidates([{
    symbol:'AttributeRules',path:'attribute.ts',comparison:{status:'keys-match'},properties:[
      {...property,name:'type',parameters:{type:'TypeDescription',yaml:'Тип',xmlParents:['Properties']}},
      {...property,name:'fillValue',parameters:{type:'MetadataValue',yaml:'ЗначениеЗаполнения',xml:'FillValue',xmlParents:['Properties'],defaultValueXMLRaw:{'_xsi:type':'xs:string'},exportNilValue:true}},
    ],
  }],new Map([
    ['common.type-description',{id:'common.type-description'}],
    ['common.metadata-value',{id:'common.metadata-value',inputs:{onlyStringType:{type:{kind:'scalar',scalar:'boolean'}}}}],
    ['common.fill-value-profile',fillProfile],
    ['common.fill-value-compatibility',fillCompatibility],
  ]),()=> 'attribute.ts');
  const fillFragment=fillOwner.modules.find(module=>module.kind==='fragment');
  assert.equal(fillOwner.entries[0].properties[1].status,'candidate');
  assert.equal(fillFragment.value.fields[1].type.with.exportNilValue,true);
  assert.deepEqual(fillFragment.value.fields[1].type.bind.onlyStringType,realProfile.siblingExpressions.onlyStringType.value);
  assert.equal(fillFragment.inputs?.onlyStringType,undefined);
  assert.equal(fillFragment.presence.some(rule=>rule.target.field==='fillValue'),true);
  assert.equal(fillFragment.inputs.definedTypes.type.kind,'index');
  assert.equal(fillOwner.modules.find(module=>module.kind==='object').inputs.definedTypes.index,'metadata.defined-type-alternatives');
  const splitOwner=emitCandidates([{
    symbol:'AttributeRules',path:'attribute.ts',comparison:{status:'keys-match'},properties:[
      {...property,name:'type',parameters:{type:'TypeDescription',yaml:'Тип',xmlParents:['Properties']}},
      {...property,name:'fillValue',parameters:{type:'MetadataValue',yaml:'ЗначениеЗаполнения',xml:'FillValue',xmlParents:['Properties'],defaultValueXMLRaw:{'_xsi:type':'xs:string'},exportNilValue:true}},
    ],
  }],new Map([
    ['common.type-description',{id:'common.type-description'}],
    ['common.metadata-value',{id:'common.metadata-value',inputs:{onlyStringType:{type:{kind:'scalar',scalar:'boolean'}}}}],
    ['common.fill-value-profile',fillProfile],
    ['common.fill-value-compatibility',fillCompatibility],
  ]),property=>property.name);
  const splitProjection=splitOwner.modules.find(module=>module.kind==='object');
  assert.equal(splitProjection.compose.length,1);
  assert.deepEqual(splitProjection.compose[0].bind?.onlyStringType,undefined);
  assert.equal(splitProjection.inputs?.onlyStringType,undefined);
  const orphanValue=emitCandidates([{
    symbol:'OrphanRules',path:'orphan.ts',comparison:{status:'keys-match'},properties:[
      {...property,name:'fillValue',parameters:{type:'MetadataValue',yaml:'Значение',xml:'FillValue',xmlParents:['Properties'],defaultValueXMLRaw:{'_xsi:nil':true}}},
    ],
  }],metadataValueCatalog);
  assert.equal(orphanValue.entries[0].properties[0].status,'candidate');
  assert.equal(orphanValue.entries[0].projections.length,1);
  const standaloneFragment=orphanValue.modules.find(module=>module.kind==='fragment');
  assert.deepEqual(standaloneFragment.value.fields[0].type.bind.onlyStringType,{literal:false});
  assert.deepEqual(standaloneFragment.presence[0].yaml.missing.denotes,{absent:true});
  assert.equal(orphanValue.modules.find(module=>module.kind==='object').constraints?.length??0,0);
  const unresolvedType=emitCandidates([{
    symbol:'UnresolvedRules',path:'unresolved.ts',comparison:{status:'keys-match'},properties:[
      {...property,name:'type',parameters:{type:'UnsupportedType',yaml:'Тип',xml:'Type',xmlParents:['Properties']}},
      {...property,name:'fillValue',parameters:{type:'MetadataValue',yaml:'Значение',xml:'FillValue',xmlParents:['Properties'],defaultValueXMLRaw:{'_xsi:nil':true}}},
    ],
  }],metadataValueCatalog);
  assert.equal(unresolvedType.entries[0].properties[1].reason,'sibling-expression-required');
  const hiddenParameters={type:'SystemEnumeration',typeSE:'Example',yaml:'Скрытое',implicitValueYAML:'A',toYAML:false,fromYAML:false};
  const hiddenCatalog=new Map([['system.Example',{enum:{A:'А',B:'Б'}}]]);
  const hidden=mapProperty({...property,parameters:hiddenParameters},hiddenCatalog);
  assert.equal(hidden.status,'candidate');
  assert.equal(hidden.key,undefined);
  assert.deepEqual(hidden.presence.yaml,{default:{literal:'A'}});
  for(const extra of [{toYAML:true},{fromYAML:true},{implicitValueYAML:undefined}])assert.equal(mapProperty({...property,parameters:{...hiddenParameters,...extra}},hiddenCatalog).status,'blocked');
  const minMax=mapProperty({...property,parameters:{type:'MinMaxValue',yaml:'Минимум',typedXML:'xs:string',defaultValueXMLRaw:{'_xsi:nil':true}}},new Map([['common.min-max-value-text',{}]]));
  assert.equal(minMax.id,'common.min-max-value-text');
  assert.equal(minMax.presence.xml.canonical[0].form,'nil');
  assert.equal(mapProperty({...property,parameters:{type:'MinMaxValue',yaml:'Минимум',typedXML:'xs:unknown'}},new Map([['common.min-max-value',{}]])).status,'blocked');
  for(const [item,id] of [['Field','common.fields-list'],['xr:Field','common.fields-list-readable']]) {
    const mapped=mapProperty({...property,parameters:{type:'FieldsList',yaml:'Поля',fieldsListXMLItem:item,defaultValueXMLRaw:''}},new Map([[id,{}]]));
    assert.equal(mapped.id,id);
    assert.equal(mapped.presence.xml.canonical[0].form,'empty-element');
    assert.equal(Object.hasOwn(mapped.presence,'yaml'),false);
  }
  assert.equal(mapProperty({...property,parameters:{type:'FieldsList',yaml:'Поля',fieldsListXMLItem:'unknown'}},new Map([['common.fields-list',{}]])).status,'blocked');
  assert.equal(mapProperty({...property,parameters:{type:'MinMaxValue',yaml:'Минимум',defaultValueXMLRaw:''}},new Map([['common.min-max-value',{}]])).status,'blocked');
  for(const [type,id,defaults] of [
    ['WebSocketClientHeaders','common.web-socket-client-headers',{defaultValueXML:[],implicitValueYAML:[]}],
    ['XDTOPackages','common.xdto-packages',{defaultValueXMLRaw:{}}],
  ]) {
    const target=new Map([[id,{}]]);
    const mapped=mapProperty({...property,parameters:{type,yaml:'Список',...defaults}},target);
    assert.equal(mapped.id,id);
    assert.deepEqual(mapped.presence.xml.missing,{denotes:{sequence:[]}});
    assert.deepEqual(mapped.presence.yaml.missing,{denotes:{sequence:[]}});
    assert.equal(mapProperty({...property,parameters:{type,yaml:'Список',...defaults,implicitValueYAML:['unexpected']}},target).status,'blocked');
  }
  const orderProperty={...property,name:'order',parameters:{type:'Order',yaml:'Порядок',xml:'dcsset:order',xmlParents:['ListSettings'],configurationIndexAddressing:'yamlPath'}};
  const orderCatalog=candidateCatalog().catalog;
  const order=mapProperty(orderProperty,orderCatalog,{dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings'});
  assert.equal(order.id,'common.dcs-order');
  assert.deepEqual(order.path,['ListSettings','dcsset:order']);
  assert.deepEqual(order.type.bind,{defaultLanguage:{input:'defaultLanguage'},registeredLanguages:{input:'registeredLanguages'}});
  assert.equal(mapProperty(orderProperty,new Map()).status,'blocked');
  const formatted=mapProperty({...property,parameters:{type:'FormattedI8nText',yaml:'Заголовок'}},new Map([['common.formatted-i8n-text',{}]]));
  assert.equal(formatted.id,'common.formatted-i8n-text');
  assert.deepEqual(formatted.type.bind,{defaultLanguage:{input:'defaultLanguage'},languages:{input:'registeredLanguages'},name:{input:'ownerName'}});
  assert.equal(formatted.presence,undefined);
  const excluded=emitCandidates([{...entry('WithoutEnterpriseRules'),properties:[{...property,parameters:{...property.parameters,toEnterprise:false}}]}],catalog);
  assert.equal(excluded.entries[0].properties[0].status,'candidate');
  assert.deepEqual(excluded.entries[0].properties[0].excludedParameters,['toEnterprise']);
  assert.equal(mapProperty({...property,parameters:{...property.parameters,toEnterprise:true}},catalog).status,'blocked');
  const scalarChoice=mapProperty({...property,parameters:{type:'StringOrNumber',yaml:'Result',tag:'Form'}},new Map([['common.string-or-number',{}]]));
  assert.equal(scalarChoice.id,'common.string-or-number');assert.equal(scalarChoice.presence,undefined);
  const qname=mapProperty({...property,parameters:{type:'XDTOTypeName',yaml:'Тип',xmlParents:['Properties']}},new Map([['common.xdto-type-name',{}]]));
  assert.equal(qname.id,'common.xdto-type-name');assert.equal(qname.presence,undefined);
  for(const defaults of [{},{defaultValueXMLRaw:{}}]) {
    const index=mapProperty({...property,parameters:{type:'IndexField',yaml:'Поля',preserveExplicitDefaultXML:true,...defaults}},new Map([['common.index-field',{}]]));
    assert.equal(index.id,'common.index-field');
    if(defaults.defaultValueXMLRaw)assert.equal(index.presence.xml.canonical[0].form,'empty-element');
    else assert.equal(index.presence,undefined);
  }
  const missingDefault=mapProperty({...property,parameters:{type:'boolean',yaml:'Flag',implicitValueYAML:true}},catalog);
  const bounded={...property,parameters:{type:'number',yaml:'Length',minimum:1,maximum:250}};
  const boundedCatalog=new Map([['common.exact-decimal',{}]]);
  const bounds=emitCandidates([{...entry('BoundedRules'),properties:[bounded]}],boundedCatalog);
  assert.equal(bounds.entries[0].properties[0].status,'candidate');
  assert.deepEqual(bounds.modules.find(m=>m.kind==='fragment').constraints.map(c=>c.assert),[{lte:[{literal:1},{field:'enabled'}]},{lte:[{field:'enabled'},{literal:250}]}]);
  for(const invalid of [{minimum:251,maximum:250},{minimum:1.25},{minimum:9007199254740992}])assert.equal(mapProperty({...bounded,parameters:{...bounded.parameters,...invalid}},boundedCatalog).status,'blocked');
  assert.deepEqual(missingDefault.presence.xml,{missing:{denotes:{literal:true}},canonical:[{when:{eq:[{field:'enabled'},{literal:true}]},form:'missing'}]});
  const explicit=mapProperty({...property,parameters:{...property.parameters,preserveExplicitDefaultXML:true}},catalog);
  assert.deepEqual(explicit.presence?.yaml,{missing:{denotes:{literal:false}}});
  assert.equal(mapProperty({...property,parameters:{...property.parameters,preserveExplicitDefaultXML:false}},catalog).status,'blocked');
  const explicitXML=mapProperty({...property,parameters:{type:'SystemEnumeration',typeSE:'HTTPMethod',yaml:'Method',defaultValueXML:'GET',noImplicitValueYAML:true,preserveExplicitDefaultXML:true}},new Map([['system.HTTPMethod',{enum:{GET:'GET'}}]]));
  assert.equal(explicitXML.status,'candidate');
  assert.deepEqual(explicitXML.presence.yaml,{missing:{denotes:{literal:'GET'}}});
  const encodedBoolean={...property,parameters:{...property.parameters,implicitValueYAML:'FalseLiteral'}};
  const booleanCatalog=new Map([['common.boolean',{representations:{yaml:{kind:'scalar',values:[{literal:'FalseLiteral',value:false}]}}}]]);
  assert.deepEqual(mapProperty(encodedBoolean,booleanCatalog).presence.yaml,{default:{literal:false}});
  assert.equal(mapProperty(encodedBoolean,catalog).status,'blocked');
  const emptyString={...property,parameters:{type:'string',yaml:'Text',defaultValueXMLRaw:''}};
  const stringCatalog=new Map([['common.string',{}]]);
  const duplicateString=mapProperty({...emptyString,parameters:{...emptyString.parameters,defaultValueXML:''}},stringCatalog);
  assert.deepEqual(duplicateString.presence,mapProperty(emptyString,stringCatalog).presence);
  assert.deepEqual(duplicateString.parameterEquivalences,[{parameter:'defaultValueXML',equivalentTo:'defaultValueXMLRaw',via:'common.string'}]);
  const purposes={...property,constantDefaults:['defaultValue'],parameters:{type:'UsePurposes',yaml:'Purposes',defaultValue:{$constantFunction:{value:['PlatformApplication']}},defaultValueXML:['PlatformApplication']}};
  const purposeCatalog=new Map([['common.use-purposes',{}]]);
  const purpose=mapProperty(purposes,purposeCatalog);
  assert.equal(purpose.id,'common.use-purposes');
  assert.deepEqual(purpose.presence.yaml.missing,{denotes:{sequence:[{literal:'PlatformApplication'}]}});
  assert.equal(mapProperty({...purposes,constantDefaults:[]},purposeCatalog).status,'blocked');
  assert.equal(mapProperty({...purposes,parameters:{...purposes.parameters,defaultValueXML:['MobilePlatformApplication']}},purposeCatalog).status,'blocked');
  assert.equal(mapProperty({...purposes,parameters:{...purposes.parameters,defaultValueAdoptedXML:['PlatformApplication']}},purposeCatalog).status,'candidate');
  const plainPurpose=mapProperty({...property,parameters:{type:'UsePurposes',yaml:'Purposes'}},purposeCatalog);
  assert.equal(plainPurpose.id,'common.use-purposes');assert.equal(plainPurpose.presence,undefined);
  const implicitParams={type:'boolean',yaml:'Flag',implicitValueYAML:true,implicitValueXML:false};
  const implicit=mapProperty({...property,parameters:implicitParams},catalog);
  assert.deepEqual(implicit.presence?.xml,{missing:{denotes:{literal:false}},canonical:[{when:{eq:[{field:'enabled'},{literal:false}]},form:'missing'}]});
  assert.equal(mapProperty({...property,parameters:{...implicitParams,defaultValueXML:false}},catalog).status,'blocked');
  const routed=emitCandidates([{...entry('RoutedRules'),properties:[{...property,name:'metadata',parameters:{...property.parameters,tag:'Metadata'}},{...property,name:'form',parameters:{...property.parameters,tag:'Form'}},property]}],catalog);
  assert.equal(routed.entries[0].projections.length,3);
  assert.deepEqual(routed.entries[0].projections.map(row=>row.sourceTag),['Metadata','Form',undefined]);
  assert.equal(routed.entries[0].properties[0].sourceTag,'Metadata');
  const formSource=sourceContract(routed.entries[0],'Form',new Map(routed.modules.map(module=>[module.id,module])),'Envelope');
  assert.deepEqual(formSource.fields.map(field=>field.name),['form']);
  assert.deepEqual(formSource.modules[0].representations.xml.fields[0].path,['Envelope','Properties','Form']);
  assert.equal(formSource.source.sourceTag,'Form');

  assert.equal(mapProperty({...property,parameters:{...property.parameters,tag:''}},catalog).status,'blocked');
  const adopted=emitCandidates([{...entry('SameAdoptedRules'),properties:[{...property,parameters:{...property.parameters,defaultValueAdoptedXML:false}}]}],catalog);
  assert.equal(adopted.entries[0].properties[0].status,'candidate');
  assert.deepEqual(adopted.entries[0].properties[0].parameterEquivalences,[{parameter:'defaultValueAdoptedXML',equivalentTo:'defaultValueXML'}]);
  assert.equal(mapProperty({...property,parameters:{...property.parameters,defaultValueAdoptedXML:true}},catalog).status,'blocked');
  const grouped=emitCandidates([{...entry('GroupRules'),properties:[{...property,name:'group',parameters:{type:'MetadataCommandGroup',yaml:'Группа',xmlParents:['Properties']}}]}],new Map([['common.metadata-command-group',{imports:{kind:'common.path-root'},inputs:{roots:{type:{kind:'index',key:{kind:'record',fields:[{name:'kind',type:{use:'kind'}},{name:'name',type:{kind:'scalar',scalar:'text'}}]},value:{kind:'scalar',scalar:'text'}}}}}]]));
  assert.equal(grouped.entries[0].properties[0].status,'candidate');
  assert(grouped.entries[0].projections[0].fragments.every(id=>grouped.modules.find(module=>module.id===id)?.kind==='fragment'));
  for(const module of grouped.modules) {
    const alias=module.inputs.roots.type.key.fields[0].type.use;
    assert.equal(module.imports[alias],'common.path-root');
  }
  const formTarget={kind:'member',owner:'this',memberKinds:['Form'],objectRoots:['CommonForm']};
  const formCatalog=new Map([['common.owner-or-common-form-link',{inputs:{owner:{type:{kind:'scalar',scalar:'text'}},forms:{type:{kind:'sequence',item:{kind:'scalar',scalar:'text'}}}}}]]);
  const typeLinkCatalog=new Map([['common.type-link',{}]]);
  for(const empty of [false,true]) {
    const source={...property,name:'linkByType',parameters:{type:'TypeLink',yaml:'СвязьПоТипу',xml:'xr:LinkByType',...(empty?{defaultValueXMLRaw:''}:{})}};
    const result=mapProperty(source,typeLinkCatalog,{xr:'urn:readable'});
    assert.equal(result.status,'candidate');
    assert.equal(result.id,'common.type-link');
    assert.deepEqual(result.path,['xr:LinkByType']);
    assert.deepEqual(result.presence.xml.empty,[{form:'empty-element',denotes:{absent:true}}]);
    assert.equal(result.presence.xml.canonical?.[0].form,empty?'empty-element':undefined);
    for(const extra of [{metadataTarget:{kind:'object'}},{defaultValueXMLRaw:{}},{typedXML:true},{implicitValueYAML:''}]) {
      assert.equal(mapProperty({...source,parameters:{...source.parameters,...extra}},typeLinkCatalog,{xr:'urn:readable'}).status,'blocked');
    }
  }
  const rootLink=emitCandidates([{...entry('RootLinkRules'),properties:[{
    ...property,name:'linkByType',parameters:{type:'TypeLink',yaml:'СвязьПоТипу',xml:'xr:LinkByType'},
  }]}],typeLinkCatalog,undefined,{xr:'urn:readable'});
  assert.deepEqual(rootLink.modules.find(module=>module.kind==='fragment').representations.xml.fields[0].path,['xr:LinkByType']);
  assert.match(rootLink.entries[0].projections[0].context,/relative-path/);
  const typeDescriptionCatalog=new Map([['common.type-description',{}]]);
  const typeDescription=mapProperty({...property,name:'description',parameters:{
    type:'TypeDescription',yaml:'Тип',xmlParents:['Properties'],defaultValueXMLRaw:'',
    addTypeDescriptionAttributeToXML:true,declareTypeNamespaceXML:['dcsset'],
    allowedTypes:METADATA_ATTRIBUTE_TYPE_DESCRIPTION_TYPES,
  }},typeDescriptionCatalog);
  assert.equal(typeDescription.status,'candidate');
  assert.equal(typeDescription.id,'common.type-description');
  assert.deepEqual(typeDescription.type.with,{addTypeDescriptionAttributeToXML:true,metadataAttributeTypesOnly:true});
  assert.deepEqual(typeDescription.presence.xml.empty,
    [{form:'empty-element',denotes:{absent:true}}],
    'A declared empty XML default retains its canonical absence reduction');
  assert.equal(typeDescription.presence.xml.canonical[0].form,'empty-element');
  assert.deepEqual(typeDescription.parameterEquivalences,[{
    parameter:'declareTypeNamespaceXML',equivalentTo:'canonical-owner-namespace-declarations',via:'common.type-description',
  }]);
  assert.equal(typeDescription.constraints,undefined);
  const requiredTypeDescription=mapProperty({...property,name:'description',parameters:{
    type:'TypeDescription',yaml:'Тип',xmlParents:['Properties'],required:true,
  }},typeDescriptionCatalog);
  assert.equal(requiredTypeDescription.status,'candidate');
  assert.deepEqual(requiredTypeDescription.presence.xml.missing,{denotes:{absent:true}});
  assert.equal(requiredTypeDescription.presence.xml.empty,undefined,
    'An explicit empty type collection is a value; only a missing property denotes absence');
  assert.equal(requiredTypeDescription.constraints[0].diagnostic.code,'value.required');
  const ownerFact=emitCandidates([{...entry('OwnerFactRules'),properties:[{...property,name:'description',parameters:{
    type:'TypeDescription',yaml:'Тип',ownerFactRole:'type',
  }}]}],typeDescriptionCatalog);
  assert.equal(ownerFact.entries[0].properties[0].status,'candidate');
  assert.equal(ownerFact.entries[0].properties[0].ownerFactRole,'type');
  assert.deepEqual(ownerFact.entries[0].ownerBlockers,[{reason:'owner-fact-contribution-required',property:'description',role:'type'}]);
  for(const extra of [
    {addTypeDescriptionAttributeToXML:false}, {preserveEmptyXML:false},
    {declareTypeNamespaceXML:['unknown']}, {allowedTypes:['unknown']},
  ]) assert.equal(mapProperty({...property,parameters:{type:'TypeDescription',yaml:'Тип',...extra}},typeDescriptionCatalog).status,'blocked');
  const unresolved=(path,sourceHash)=>({$unresolved:{kind:'expression',source:{path,line:path.includes('valueListSettings')?19:24,column:1},sourceHash,expression:'reviewed callback'}});
  const conditionalTypeDescription=mapProperty({...property,status:'requires-expression-mapping',name:'valueType',parameters:{
    type:'TypeDescription',yaml:'ТипЗначения',xml:'dcssch:valueType',
    toXML:unresolved('packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts','a2319c0402f326a1a0e255e2042d7bb13e785acd1f14a4041823fe498882dfb2'),
  }},typeDescriptionCatalog,{dcssch:'urn:dcs'});
  assert.equal(conditionalTypeDescription.status,'candidate');
  assert.deepEqual(conditionalTypeDescription.presence.xml.canonical,[
    {when:{not:{eq:[{input:'ownerKind'},{literal:'ПолеНабораДанныхСхемыКомпоновкиДанных'}]}},form:'missing'},
  ]);
  assert.deepEqual(conditionalTypeDescription.inputs,{ownerKind:{type:{kind:'scalar',scalar:'text'}}});
  const ownMinMax=mapProperty({...property,status:'requires-expression-mapping',name:'minimum',parameters:{
    type:'MinMaxValue',yaml:'Минимум',typedXML:'xs:string',defaultValueXMLRaw:{'_xsi:nil':true},
    toXML:{$unresolved:{kind:'expression',source:{path:'packages/rules/metadata/commonObjects/metadataExternalDataSourceCubeResource/rules.ts',line:14,column:3},sourceHash:'c7cdaa9f54260d7085e3d7f493acaa2bb932a0f326b3b254ae971637bd7c610d',expression:'reviewed callback'}},
  }},new Map([['common.min-max-value-text',{}]]));
  assert.deepEqual(ownMinMax.presence.xml.canonical,[
    {when:{not:{present:{field:'minimum'}}},form:'missing'},
  ]);
  const formValueType=mapProperty({...property,status:'requires-expression-mapping',name:'valueType',parameters:{
    type:'TypeDescription',yaml:'ТипЗначения',xml:'Settings',addTypeDescriptionAttributeToXML:true,
    defaultValueXMLEmpty:{type:[]},preserveEmptyXML:true,
    defaultValue:unresolved('packages/rules/metadata/forms/commonObjects/formAttribute/valueListSettings.ts','21f68d1f13518895e2565205ec92797eee022f06b2a6c0b5a147f53435a2b81f'),
  }},typeDescriptionCatalog);
  assert.equal(formValueType.status,'candidate');
  assert.equal(formValueType.presence.xml.empty,undefined);
  assert.deepEqual(formValueType.presence.yaml.missing,{denotes:{
    if:{eq:[{input:'ownerType'},{literal:'СписокЗначений'}]},then:formValueType.presence.yaml.missing.denotes.then,else:{absent:true},
  }});
  assert.deepEqual(formValueType.presence.yaml.missing.denotes.then.record.items,{sequence:[]});
  assert.deepEqual(formValueType.inputs,{ownerType:{type:{kind:'scalar',scalar:'text'}}});
  const emptyTypeDescription=mapProperty({...property,name:'description',parameters:{
    type:'TypeDescription',yaml:'Тип',xml:'Type',defaultValueXMLRaw:{},
  }},typeDescriptionCatalog);
  assert.equal(emptyTypeDescription.status,'candidate');
  assert.deepEqual(emptyTypeDescription.presence.xml.canonical,[{when:{not:{present:{field:'description'}}},form:'empty-element'},{form:'ordinary'}]);
  const runtimeTypeDescription=mapProperty({...property,name:'typeRestriction',parameters:{
    type:'TypeDescription',yaml:'ОграничениеТипа',toEnterprise:false,runtimeOnly:true,
  }},typeDescriptionCatalog);
  assert.equal(runtimeTypeDescription.status,'candidate');
  assert.equal(runtimeTypeDescription.yamlOnly,true);
  assert.deepEqual(runtimeTypeDescription.path,[]);
  const adoptedTypeDescription=mapProperty({...property,name:'type',parameters:{
    type:'TypeDescription',yaml:'Тип',xml:'Type',xmlParents:['Properties'],required:true,
    defaultValueAdoptedXML:{type:[]},
  }},typeDescriptionCatalog);
  assert.equal(adoptedTypeDescription.status,'candidate');
  assert.deepEqual(adoptedTypeDescription.presence.yaml.missing.denotes,{
    if:{eq:[{input:'xmlDefaultVariant'},{literal:'adopted'}]},
    then:adoptedTypeDescription.presence.yaml.missing.denotes.then,
    else:{absent:true},
  });
  assert.deepEqual(adoptedTypeDescription.presence.yaml.missing.denotes.then.record.items,{sequence:[]});
  assert.deepEqual(adoptedTypeDescription.inputs,{xmlDefaultVariant:{type:{kind:'scalar',scalar:'text'}}});
  assert.equal(mapProperty({...property,status:'requires-expression-mapping',parameters:{
    type:'TypeDescription',yaml:'Тип',toXML:unresolved('packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts','changed'),
  }},typeDescriptionCatalog).reason,'requires-expression-mapping');
  const formParams={type:'MetadataItemLink',yaml:'Форма',xmlParents:['Properties'],metadataTarget:formTarget,defaultValueXMLRaw:''};
  const form=mapProperty({...property,parameters:formParams},formCatalog);
  assert.equal(form.id,'common.owner-or-common-form-link');
  assert.equal(form.presence.xml.canonical[0].form,'empty-element');
  assert.equal(mapProperty({...property,parameters:{...formParams,metadataTarget:{...formTarget,owner:'type'}}},formCatalog).status,'blocked');
  assert.equal(mapProperty({...property,parameters:{...formParams,metadataTarget:{...formTarget,allowedMemberPaths:[['DocumentJournal','Form']]}}},formCatalog).status,'blocked');
  const basedOnPaths=[['ChartOfAccounts'],['ExternalDataSource','Table'],['ExchangePlan'],['Catalog'],['Document'],['ChartOfCharacteristicTypes'],['BusinessProcess'],['ChartOfCalculationTypes'],['Task']];
  const basedOnParams={type:'MetadataItemLinks',yaml:'BasedOn',metadataTarget:{kind:'object',allowedObjectPaths:basedOnPaths},defaultValueXMLRaw:{}};
  const basedOnCatalog=new Map([['common.based-on-links',{}]]);
  assert.equal(mapProperty({...property,parameters:basedOnParams},basedOnCatalog).id,'common.based-on-links');
  assert.equal(mapProperty({...property,parameters:{...basedOnParams,metadataTarget:{kind:'object',allowedObjectPaths:[['Document']]}}},basedOnCatalog).status,'blocked');
  const documentListParams={type:'MetadataItemLinks',yaml:'Documents',metadataTarget:{kind:'object',roots:['Document']}};
  const documentListCatalog=new Map([['common.journal-document-links',{}]]);
  assert.equal(mapProperty({...property,parameters:documentListParams},documentListCatalog).id,'common.journal-document-links');
  assert.equal(mapProperty({...property,parameters:{...documentListParams,metadataTarget:{kind:'object',roots:['Document'],owner:'this'}}},documentListCatalog).status,'blocked');
  const numeratorParams={...formParams,metadataTarget:{kind:'object',roots:['DocumentNumerator']}};
  const numeratorCatalog=new Map([['common.document-numerator-link',{}]]);
  assert.equal(mapProperty({...property,parameters:numeratorParams},numeratorCatalog).id,'common.document-numerator-link');
  assert.equal(mapProperty({...property,parameters:{...numeratorParams,metadataTarget:{kind:'object',roots:['DocumentNumerator','Document']}}},numeratorCatalog).status,'blocked');
  assert.equal(mapProperty({...property,parameters:null},catalog).status,'blocked');
  assert.equal(mapProperty({...property,parameters:{...property.parameters,xml:'${name}'}},catalog).reason,'xml-path-profile');
  const qualified={...property,parameters:{...property.parameters,xml:'test:Enabled'}};
  assert.equal(mapProperty(qualified,catalog).reason,'unknown-xml-prefix:test');
  const namespaced=emitCandidates([{...entry('NamespacedRules'),properties:[qualified]}],catalog,undefined,{test:'urn:test'});
  assert.equal(namespaced.entries[0].properties[0].status,'candidate');
  assert.deepEqual(namespaced.modules.find(m=>m.kind==='fragment').namespaces,{test:'urn:test'});
  assert.deepEqual(namespaced.modules.find(m=>m.kind==='fragment').representations.xml.fields[0].path,['Properties','test:Enabled']);
  const invalidOrder = emitCandidates([{...entry('RepeatedRules'),xmlOrder:{status:'static',keys:['enabled','enabled']}}],catalog);
  assert.equal(invalidOrder.entries[0].properties[0].reason,'owner-order-unresolved');
  const existing = structuredClone(fragments[0]);
  existing.id = 'existing.fragment';
  existing.representations.xml.fields[0].path.unshift('md:Owner');
  const diff = candidateDiff(result.modules,new Map([[existing.id,existing]]));
  assert.equal(diff.matchedFields,1);
  assert.deepEqual(diff.entries[0].reviewTargets[0].differences,['path']);
  const signature=propertyContractSignature(fragments[0]);
  const renamed=structuredClone(fragments[0]);
  renamed.id='other';renamed.imports.alternate=renamed.imports.value0;delete renamed.imports.value0;renamed.value.fields[0].type.use='alternate';
  assert.equal(propertyContractSignature(renamed),signature);
  renamed.constraints=[];
  assert.equal(propertyContractSignature(renamed),signature);
  renamed.constraints=[{assert:{literal:false}}];
  assert.notEqual(propertyContractSignature(renamed),signature);
  delete renamed.constraints;
  renamed.presence[0].xml={missing:{denotes:{literal:false}}};
  assert.notEqual(propertyContractSignature(renamed),signature);
  renamed.inputs={context:{type:{kind:'scalar',scalar:'text'}}};renamed.value.fields[0].type.bind={value:{input:'context'}};
  const withInput=propertyContractSignature(renamed);
  renamed.inputs.context.type.scalar='boolean';
  assert.notEqual(propertyContractSignature(renamed),withInput);
  existing.presence[0].xml={missing:{denotes:{literal:false}}};
  assert.deepEqual(candidateDiff(result.modules,new Map([[existing.id,existing]])).entries[0].reviewTargets[0].differences,['path','xmlPresence']);
  existing.constraints=[{assert:{present:{field:'enabled'}}}];
  assert.deepEqual(candidateDiff(result.modules,new Map([[existing.id,existing]])).entries[0].reviewTargets[0].differences,['path','xmlPresence','constraints']);
});


test('DCS value modes reuse declared commons and fixed enumeration projections', () => {
  const {catalog}=candidateCatalog();
  const modes={Color:'common.dcs-metadata-color', Field:'common.dcs-parameter-field-value',
    DesignTimeValue:'common.dcs-design-time-choice-nullable',
    Primitive:'common.dcs-primitive-value', TypeLink:'common.type-link-dcs',
    ChoiceParameterLinks:'common.dcs-choice-parameter-links', Parameter:'common.dcs-choice-parameters', Font:'common.dcs-metadata-font',
    SystemEnumeration:'common.dcs-horizontal-align-nullable'};
  const property=valueType=>({name:'value',status:'static-parameters',parameters:{
    type:'MetadataDcsMetadataValue',valueType,xml:'dcssch:value',yaml:'Значение',
    ...(valueType==='SystemEnumeration'?{typeSE:'HorizontalAlign'}:{})}});
  for(const [mode,id] of Object.entries(modes)) {
    const mapped=mapProperty(property(mode),catalog,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'});
    assert.equal(mapped.status,'candidate',`${mode}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.id,id);
    assert.deepEqual(mapped.path,['dcssch:value']);
    assert.equal(mapped.key,'Значение');
    const owner={path:'dcs-contract.ts',symbol:mode,comparison:{status:'keys-match'},properties:[{...property(mode),source:{path:'dcs-contract.ts',line:1,column:1}}]};
    const emitted=emitCandidates([owner],catalog,()=>mode,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'});
    assert.equal(emitted.entries[0].properties[0].status,'candidate');
    const projection=emitted.modules.find(module=>module.kind==='object');
    for(const [name,index] of Object.entries(mapped.indexProviders??{}))assert.equal(projection.inputs[name].index,index);
    if(['Field','Primitive'].includes(mode))assert.deepEqual(mapped.indexProviders,
      {labels:'dcs.enumeration-labels',codes:'dcs.enumeration-codes'});
    if(['Color','Font'].includes(mode))assert.equal(mapped.indexProviders.styleTypes,'metadata.style-item-types');
    if(['Field','DesignTimeValue','TypeLink','ChoiceParameterLinks','Parameter','SystemEnumeration'].includes(mode)) {
      assert.deepEqual(mapped.presence.xml.empty,[{form:'nil',denotes:{absent:true}}]);
      assert.deepEqual(mapped.presence.yaml.empty,[{form:'null',denotes:{absent:true}}]);
      assert.equal(mapped.presence.xml.canonical,undefined,'an absent value must stay absent by default');
    }
  }
  const folderMode=mapProperty({...property('SystemEnumeration'),parameters:{
    ...property('SystemEnumeration').parameters,typeSE:'FoldersAndItemsUse',
  }},catalog,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'});
  assert.equal(folderMode.status,'candidate');
  assert.equal(folderMode.id,'common.dcs-folders-and-items-use-nullable');
  for(const mode of ['Primitive','Color','Font']) for(const exportNilValue of [false,true]) {
    const mapped=mapProperty({...property(mode),parameters:{...property(mode).parameters,exportNilValue}},catalog,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'});
    assert.equal(mapped.status,'candidate');
    assert.equal(mapped.presence.xml.canonical?.[0].form,exportNilValue?'nil':undefined);
    assert.equal(mapped.presence.yaml.empty,undefined,'null must remain an inner value, not missing');
  }
  for(const mode of ['Field','DesignTimeValue','TypeLink','ChoiceParameterLinks','Parameter','SystemEnumeration']) for(const exportNilValue of [false,true]) {
    const mapped=mapProperty({...property(mode),parameters:{...property(mode).parameters,exportNilValue}},catalog,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'});
    assert.equal(mapped.status,'candidate',`${mode}: ${JSON.stringify(mapped)}`);
    assert.equal(mapped.presence.xml.canonical?.[0].form,exportNilValue?'nil':undefined);
    assert.deepEqual(mapped.presence.xml.empty,[{form:'nil',denotes:{absent:true}}]);
    assert.deepEqual(mapped.presence.yaml.empty,[{form:'null',denotes:{absent:true}}]);
  }
  for(const parameters of [
    {...property('Primitive').parameters,valueType:'Unknown'},
    {...property('SystemEnumeration').parameters,typeSE:'MissingEnumeration'},
    {...property('Primitive').parameters,exportNilValue:'yes'},
    {...property('Field').parameters,exportNilValue:'yes'},
    {...property('Primitive').parameters,typeSE:'HorizontalAlign'},
  ])assert.equal(mapProperty({...property('Primitive'),parameters},catalog).status,'blocked');
});

test('SettingsParameterValue selects its declared value profile from owner parameters', () => {
  const {catalog}=candidateCatalog();
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const fields=extraction.entries.flatMap(owner=>(owner.properties??[])
    .filter(property=>property.parameters?.type==='SettingsParameterValue')
    .map(property=>({owner:owner.symbol,property})));
  assert.equal(fields.length,12);
  for(const {owner,property} of fields) {
    const selected=settingsParameterProfile(property.parameters,catalog);
    assert.ok(selected,`${owner}.${property.name}`);
    assert.equal(selected.parameterName,property.parameters.yaml);
    assert.equal(selected.settingsXsi,true);
    assert.ok(catalog.has(selected.value.id),`${selected.value.id}`);
    assert.equal(mapProperty(property,catalog).reason,'dcs-parameter-collection-required');
  }
  const horizontal=settingsParameterProfile({valueType:'SystemEnumeration',typeSE:'HorizontalAlign',yaml:'ГоризонтальноеПоложение',exportSettingsXsiType:false},catalog);
  assert.equal(horizontal.value.id,'common.dcs-horizontal-align-nullable');
  assert.equal(horizontal.settingsXsi,false);
  for(const parameters of [
    {valueType:'Unknown',yaml:'Поле'},
    {valueType:'SystemEnumeration',yaml:'Поле'},
    {valueType:'Color',typeSE:'HorizontalAlign',yaml:'Поле'},
    {valueType:'Color',yaml:'Поле',exportSettingsXsiType:'false'},
  ])assert.equal(settingsParameterProfile(parameters,catalog),undefined);
});

test('SettingsParameterValueCollection extracts per-row profiles from real rules.ts', () => {
  const {catalog}=candidateCatalog();
  const namespaces={dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema',dcscor:'http://v8.1c.ru/8.1/data-composition-system/core',dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings'};
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const owners=extraction.entries.flatMap(owner=>(owner.properties??[])
    .filter(property=>property.parameters?.type==='SettingsParameterValueCollection')
    .map(property=>({owner:owner.symbol,property})));
  assert.equal(owners.length,2);
  for(const {owner,property} of owners) {
    const selected=settingsParameterCollectionProfile(property.parameters,catalog);
    assert.ok(selected,`${owner}.${property.name}`);
    const mapped=mapProperty(property,catalog,namespaces);
    assert.equal(mapped.status,'candidate',`${owner}.${property.name}: ${mapped.reason}`);
    const declared=catalog.get(mapped.id);
    assert.ok(declared,`${owner}.${property.name}`);
    assert.equal(declared.representations.yaml.itemInputs.valueProfile.table.default,
      owner==='DynamicListRules'?'Field':'Primitive');
    assert.equal(Object.hasOwn(mapped.inputs,'profiles'),false);
    assert.equal(Object.hasOwn(mapped.inputs,'defaultProfile'),false);
    assert.deepEqual(mapped.path,property.parameters.xmlParents);
    assert.deepEqual(mapped.presence.xml.missing.denotes,{absent:true});
    assert.deepEqual(mapped.presence.yaml.missing.denotes,{absent:true});
    const sourceOwner=extraction.entries.find(entry=>entry.symbol===owner);
    const reported=emitCandidates([sourceOwner],catalog,()=> 'source',namespaces).entries[0]
      .properties.find(row=>row.name===property.name);
    assert.equal(reported.status,'candidate');
    assert.equal(selected.defaultProfile.value.id,owner==='DynamicListRules'?'common.dcs-parameter-field-value':'common.dcs-primitive-value');
    assert.equal(selected.defaultProfile.settingsXsi,owner==='DynamicListRules');
    if(owner==='DCSParameterRules') {
      assert.equal(selected.byName['СвязьПоТипу'].value.id,'common.type-link-dcs');
      assert.equal(selected.byName['ВыборГруппИЭлементов'].value.id,'common.dcs-folders-and-items-use-nullable');
      assert.deepEqual(Object.keys(selected.byName),['ВыборГруппИЭлементов','СвязиПараметровВыбора','ПараметрыВыбора','СвязьПоТипу']);
      assert.equal(declared.representations.yaml.itemInputs.valueProfile.table.values['СвязьПоТипу'],'TypeLink');
    } else assert.deepEqual(selected.byName,{});
  }
  assert.equal(settingsParameterCollectionProfile({defaultItemRule:{valueType:'Unknown'}},catalog),undefined);
  assert.equal(settingsParameterCollectionProfile({defaultItemRule:{type:'SettingsParameterValue',valueType:'Field'},parameterRules:{bad:{valueType:'Primitive'}}},catalog),undefined);
});

test('plain declared common values attach to an owner without a named migration case', () => {
  const {catalog}=candidateCatalog();
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const owner=extraction.entries.find(entry=>entry.symbol==='DCSParameterRules');
  const title=owner.properties.find(property=>property.name==='title');
  const mapped=mapProperty(title,catalog,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'});
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.dcs-local-string-type');
  assert.deepEqual(mapped.path,['dcssch:title']);
  assert.equal(mapped.key,'Заголовок');
});

test('declared sequence uses the ordinary YAML path for item addressing', () => {
  const {catalog}=candidateCatalog();
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const owner=extraction.entries.find(entry=>entry.symbol==='CalculatedFieldRules');
  const values=owner.properties.find(property=>property.name==='availableValues');
  const namespaces={dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'};
  const mapped=mapProperty(values,catalog,namespaces);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.dcs-available-values');
  assert.equal(mapped.presence,undefined,'an unconfigured sequence must inherit the common presence contract');
  assert.deepEqual(mapped.path,[],'the common sequence owns availableValue; the owner must not add another wrapper');
  assert.deepEqual(mapped.inputs.defaultLanguage.type,{kind:'scalar',scalar:'text'});
  assert.ok(mapped.parameterEquivalences?.some(item=>item.parameter==='configurationIndexAddressing' && item.equivalentTo==='yamlPath'));
  const unsupported={...values,parameters:{...values.parameters,configurationIndexAddressing:'xmlPath'}};
  assert.equal(mapProperty(unsupported,catalog,namespaces).status,'blocked');
});

test('an empty XML string has the same value as the declared string representation', () => {
  const {catalog}=candidateCatalog();
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const owner=extraction.entries.find(entry=>entry.symbol==='CalculatedFieldRules');
  const expression=owner.properties.find(property=>property.name==='expression');
  const namespaces={dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'};
  const mapped=mapProperty(expression,catalog,namespaces);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.id,'common.string');
  assert.ok(mapped.parameterEquivalences?.some(item=>item.parameter==='defaultValueXMLEmpty' && item.equivalentTo==='empty-text'));
  const changed={...expression,parameters:{...expression.parameters,defaultValueXMLEmpty:'other'}};
  assert.equal(mapProperty(changed,catalog,namespaces).status,'blocked');
  const operation=extraction.entries.find(entry=>entry.symbol==='MetadataWebServiceOperationRules');
  const comment=operation.properties.find(property=>property.name==='comment');
  const mappedComment=mapProperty(comment,catalog,namespaces);
  assert.equal(mappedComment.status,'blocked');
});


test('dependent adopted defaults are derived from the checked shared source helper',async()=>{
  const {reviewedPropertyExpression}=await import('../src/reviewed-property-expressions.mjs');
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const uses=entries.flatMap(owner=>owner.properties.filter(property=>
    property.parameters?.toXML?.$unresolved?.expression.includes('exportDependentAdoptedDefault')));
  assert.equal(uses.length,4);
  for(const property of uses) {
    const profile=reviewedPropertyExpression('toXML',property.parameters.toXML);
    assert.equal(profile?.kind,'xml-dependent-adopted-default',property.name);
    assert.equal(profile.property,property.name);
    assert.ok(profile.dependencies.length);
    const changed=structuredClone(property.parameters.toXML);
    changed.$unresolved.sourceHash='stale';
    assert.equal(reviewedPropertyExpression('toXML',changed),undefined);
    const forged=structuredClone(property.parameters.toXML);
    forged.$unresolved.expression=forged.$unresolved.expression.replace('exportDependentAdoptedDefault','unknownHelper');
    assert.equal(reviewedPropertyExpression('toXML',forged),undefined);
  }
  const property=uses.find(row=>row.name==='codeAllowedLength');
  const mapped=mapProperty(property,candidateCatalog().catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.deepEqual(mapped.presence.yaml.missing.denotes.if,{input:'adopted'});
  assert.deepEqual(mapped.inputs.adopted,{type:{kind:'scalar',scalar:'boolean'}});
  const owner=entries.find(row=>row.symbol==='MetadataCatalogRules');
  const incomplete=emitCandidates([{...owner,propertyStates:[],properties:owner.properties
    .filter(row=>['codeType','codeAllowedLength'].includes(row.name))}],candidateCatalog().catalog);
  assert.equal(incomplete.entries[0].properties.find(row=>row.name==='codeAllowedLength').status,'blocked',
    'A condition must not reference an unconverted sibling');
});


test('conditional numeric bounds preserve source parameters across all owners',()=>{
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const {catalog}=candidateCatalog();
  const uses=entries.flatMap(owner=>owner.properties.filter(p=>p.parameters?.maximumWhen));
  assert.equal(uses.length,6);
  for(const property of uses) {
    const mapped=mapProperty(property,catalog),bound=property.parameters.maximumWhen;
    assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
    const constraint=mapped.constraints.find(row=>row.id===property.name+'-conditional-maximum');
    assert.deepEqual(constraint.assert,{lte:[{field:property.name},{literal:bound.maximum}]});
    assert.deepEqual(constraint.when.and[1],{eq:[{field:bound.propertyKey},{literal:bound.equals}]});
    const changed=structuredClone(property);changed.parameters.maximumWhen.extra=true;
    assert.equal(mapProperty(changed,catalog).status,'blocked');
  }
});


test('adopted defaults compare sibling values through their declared YAML representation',()=>{
  const owner=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries
    .find(row=>row.symbol==='MetadataCatalogRules');
  const {catalog}=candidateCatalog();
  for(const name of ['hierarchical','hierarchyType']) {
    const property=owner.properties.find(row=>row.name===name);
    const mapped=mapProperty(property,catalog,{}, {properties:owner.properties});
    assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
    assert.deepEqual(mapped.presence.yaml.missing.denotes.then.if,{or:[{and:[
      {present:{field:'codeType'}},{eq:[{field:'codeType'},{literal:'String'}]}]}]});
    const changed=structuredClone(property);changed.parameters.toXML.$unresolved.sourceHash='stale';
    assert.equal(mapProperty(changed,catalog,{}, {properties:owner.properties}).status,'blocked');
    const forged=structuredClone(property);
    forged.parameters.toXML.$unresolved.expression=forged.parameters.toXML.$unresolved.expression.replace('exportCatalogHierarchyDefault','differentHelper');
    assert.equal(mapProperty(forged,catalog,{}, {properties:owner.properties}).status,'blocked');
    const missing=owner.properties.filter(row=>row.name!=='codeType');
    assert.equal(mapProperty(property,catalog,{}, {properties:missing}).status,'blocked');
  }
  const source={...owner,propertyStates:[],properties:owner.properties.filter(row=>
    ['hierarchical','hierarchyType','codeType'].includes(row.name))};
  const emitted=emitCandidates([source],catalog);
  assert.ok(emitted.entries[0].properties.every(row=>row.status==='candidate'));
  assert.equal(emitted.entries[0].projections[0].fragments.length,1,
    'The sibling condition belongs in the same field scope');
});


test('legacy object-reference collections reuse checked link collection declarations',()=>{
  const owner=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries
    .find(row=>row.symbol==='MetadataCatalogRules');
  const {catalog}=candidateCatalog();
  for(const [name,id] of [['owners','common.metadata-item-links-allowed-roots'],
    ['basedOn','common.based-on-links']]) {
    const property=owner.properties.find(row=>row.name===name),mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
    assert.equal(mapped.id,id);
    assert.deepEqual(mapped.path,['Properties',name[0].toUpperCase()+name.slice(1)]);
    const changed=structuredClone(property);changed.parameters.defaultValueXMLRaw={unexpected:true};
    assert.equal(mapProperty(changed,catalog).status,'blocked');
  }
  const selected={...owner,propertyStates:[],properties:owner.properties.filter(row=>['owners','basedOn'].includes(row.name))};
  const result=emitCandidates([selected],catalog);
  assert.ok(result.entries[0].properties.every(row=>row.status==='candidate'));
  assert.ok(result.entries[0].ownerBlockers.some(row=>row.reason==='owner-fact-contribution-required'&&row.property==='owners'),
    'Conversion alone cannot hide the owner-membership integration obligation');
});


test('declared named collections mount from tagged source rules and reject unreviewed options',()=>{
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const {catalog}=candidateCatalog();
  for(const symbol of ['ClientApplicationFormRules','ClientApplicationFormWithExtendedPresentationRules']) {
    const property=entries.find(row=>row.symbol===symbol).properties.find(row=>row.name==='parameters');
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
    assert.equal(mapped.id,'common.form-parameters');
    assert.equal(mapped.qname,true);
    assert.equal(mapped.sourceTag,'Form');
    assert.deepEqual(mapped.path,['f:Parameters']);
    assert.equal(mapped.namespaces.f,'http://v8.1c.ru/8.3/xcf/logform');
    assert.equal(mapProperty({...property,parameters:{...property.parameters,unreviewed:true}},catalog).status,'blocked');
    const renamed=mapProperty({...property,name:'another',parameters:{...property.parameters,xml:'Other',yaml:'Другие'}},catalog);
    assert.deepEqual(renamed.path,['f:Other']);
    assert.equal(renamed.key,'Другие');
  }
});

test('literal scalar defaults matching the implicit meaning are declarative equivalences',()=>{
 const {catalog}=candidateCatalog();
 const original=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries
  .find(row=>row.symbol==='AutoCommandBarRules').properties.find(row=>row.name==='autofill');
 for(const property of [original,
  {name:'renamed',status:'static-parameters',parameters:{type:'boolean',yaml:'Другое',defaultValue:false,implicitValueYAML:'Ложь'}},
  {name:'caption',status:'static-parameters',parameters:{type:'string',yaml:'Текст',defaultValue:'начало',implicitValueYAML:'начало'}},
  {name:'count',status:'static-parameters',parameters:{type:'number',yaml:'Количество',defaultValue:7,implicitValueYAML:7}},
 ]) {
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.deepEqual(mapped.presence.xml.missing.denotes,{literal:property.parameters.defaultValue});
  assert(mapped.parameterEquivalences.some(row=>row.parameter==='defaultValue'));
  const explicit={...property,parameters:{...property.parameters,defaultValueXML:property.parameters.defaultValue}};
  const withXML=mapProperty(explicit,catalog);
  assert.equal(withXML.status,'candidate',JSON.stringify(withXML));
  const {defaultValue,...withoutFallback}=explicit.parameters;
  assert.deepEqual(withXML.presence,mapProperty({...property,parameters:withoutFallback},catalog).presence);
  assert.equal(mapProperty({...explicit,parameters:{...explicit.parameters,defaultValueXML:'different'}},catalog).status,'blocked');
  assert.equal(mapProperty({...property,parameters:{...property.parameters,defaultValue:null}},catalog).status,'blocked');
  assert.equal(mapProperty({...property,parameters:{...property.parameters,defaultValue:{$unresolved:'call'}}},catalog).status,'blocked');
 }
 const changed={...original,parameters:{...original.parameters,defaultValue:false}};
 assert.equal(mapProperty(changed,catalog).status,'blocked','Different XML and YAML defaults need their own checked contract');
});


test('all source singleton tooltip properties attach to the assembled declaration',()=>{
  const {catalog}=candidateCatalog();
  const entries=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries;
  const uses=entries.flatMap(owner=>owner.properties.filter(property=>property.type==='ExtendedTooltip').map(property=>({owner,property})));
  assert.equal(uses.length,41);
  for(const {owner,property} of uses) {
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',`${owner.symbol}: ${mapped.reason}`);
    assert.equal(mapped.id,'working.element.ExtendedTooltip.frame.body');
    assert.deepEqual(mapped.path,['ExtendedTooltip']);
    assert.equal(mapped.key,'РасширеннаяПодсказка');
    assert.deepEqual(mapped.presence.yaml.missing.denotes,{record:{}});
    assert.deepEqual(Object.keys(mapped.type.bind).sort(),Object.keys(catalog.get(mapped.id).inputs).sort());
    assert.deepEqual(mapped.type.bind.identity_ownerName,{input:'ownerName'});
    assert(!Object.keys(mapped.inputs).some(name=>name.startsWith('ordinary')));
    for(const extra of [{unexpected:true},{defaultValueXMLEmpty:{itemType:'Other'}},{implicitValueYAML:''}]) {
      const changed=structuredClone(property);Object.assign(changed.parameters,extra);
      assert.equal(mapProperty(changed,catalog).status,'blocked');
    }
  }
});


test('a static parameter rule table compiles all names without silently dropping unknown profiles', () => {
  const {catalog}=candidateCatalog();
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const owner=extraction.entries.find(entry=>entry.symbol==='AppearanceFieldsRules');
  const selected=declaredSettingsParameterTable(owner,catalog);
  assert.ok(selected);
  const table=selected.declaration.representations.yaml.itemInputs.valueProfile.table;
  assert.equal(Object.keys(table.values).length,12);
  assert.equal(table.values['ЦветФона'],'Color');
  assert.equal(table.values['ГоризонтальноеПоложение'],'HorizontalAlign');
  assert.equal(table.values['Текст'],'DesignTimeValue');
  assert.equal(table.default,'');
  assert.equal(selected.scope,'parameter-profiles-only');
  const production=catalog.get('common.appearance-fields');
  assert.ok(production, 'AppearanceFields must be available without proposal injection');
  assert.deepEqual(production, JSON.parse(JSON.stringify({...selected.declaration,id:'common.appearance-fields',imports:{item:'common.dcs-appearance-parameter'}})));
  assert.equal(production.imports.item,'common.dcs-appearance-parameter');
  const use=extraction.entries.find(entry=>entry.symbol==='CalculatedFieldRules').properties.find(property=>property.type==='AppearanceFields');
  const mapped=mapProperty(use,catalog,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'});
  assert.equal(mapped.status,'candidate',mapped.reason);
  assert.equal(mapped.id,'common.appearance-fields');
  assert.deepEqual(mapped.path,['dcssch:appearance']);
  assert.deepEqual(mapped.indexProviders,{styleTypes:'metadata.style-item-types',labels:'dcs.enumeration-labels',codes:'dcs.enumeration-codes'});
  const emptyUse=extraction.entries.find(entry=>entry.symbol==='ConditionalAppearanceItemRules').properties.find(property=>property.type==='AppearanceFields');
  const emptyMapped=mapProperty(emptyUse,catalog,{dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings'});
  assert.equal(emptyMapped.status,'candidate',emptyMapped.reason);
  assert.deepEqual(emptyMapped.presence.xml.canonical,[{when:{not:{present:{field:'appearance'}}},form:'empty-element'}]);
  const renamed=structuredClone(emptyUse);renamed.name='anotherField';
  assert.deepEqual(mapProperty(renamed,catalog,{dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings'}).presence.xml.canonical,
    [{when:{not:{present:{field:'anotherField'}}},form:'empty-element'}]);
  for(const extra of [{evaluateWhenYAMLMissing:false},{defaultValueXMLRaw:{unexpected:true}}]) {
    const changed=structuredClone(emptyUse);Object.assign(changed.parameters,extra);
    assert.equal(mapProperty(changed,catalog).status,'blocked');
  }
  const conditional=extraction.entries.find(entry=>entry.symbol==='DataCompositionSchemaDataSetFieldRules').properties.find(property=>property.type==='AppearanceFields');
  const guarded=mapProperty(conditional,catalog,{dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'});
  assert.equal(guarded.status,'candidate',guarded.reason);
  assert.deepEqual(guarded.presence.xml.canonical,[{when:{not:{eq:[{input:'ownerKind'},{literal:'ПолеНабораДанныхСхемыКомпоновкиДанных'}]}},form:'missing'}]);
  const schemaOwner=extraction.entries.find(entry=>entry.symbol==='DataCompositionSchemaDataSetFieldRules');
  const namespaces={xsi:'http://www.w3.org/2001/XMLSchema-instance',dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'};
  const kind=mapProperty(schemaOwner.properties.find(property=>property.name==='kind'),catalog,namespaces);
  assert.equal(kind.status,'candidate',kind.reason);
  assert.equal(kind.attribute,'xsi:type');
  assert.deepEqual(kind.presence.yaml.missing.denotes,{literal:'ПолеНабораДанныхСхемыКомпоновкиДанных'});
  const bound=mapProperty(conditional,catalog,namespaces,{properties:schemaOwner.properties});
  assert.equal(bound.status,'candidate',bound.reason);
  assert(!Object.hasOwn(bound.inputs,'ownerKind'));
  assert(JSON.stringify(bound.presence).includes('"field":"kind"'));
  const emitted=emitCandidates([{...schemaOwner,properties:schemaOwner.properties.filter(p=>['kind','appearance'].includes(p.name))}],catalog,undefined,namespaces);
  assert.equal(emitted.entries[0].properties.filter(row=>row.status==='candidate').length,2);
  assert(!emitted.modules.some(module=>Object.hasOwn(module.inputs??{},'ownerKind')));
  const complete=emitCandidates([schemaOwner],catalog,undefined,namespaces);
  assert.equal(complete.entries[0].properties.filter(row=>row.status==='candidate').length,15,JSON.stringify(complete.entries[0].properties));
  const fullProjection=sourceProjection(schemaOwner,catalog,{properties:schemaOwner.properties.map(p=>p.name),id:'working.data-set-field',root:'Field',namespaces});
  assert.equal(fullProjection.value.yamlOrder.length,15);
  const guardedSequence=mapProperty(schemaOwner.properties.find(p=>p.name==='availableValues'),catalog,namespaces,{properties:schemaOwner.properties});
  assert.equal(guardedSequence.presence.target.field,'availableValues');
  assert(guardedSequence.presence.xml.canonical[0].when.not);
  const profile={properties:['kind','appearance'],id:'working.schema-projection',root:'Field',namespaces};
  const projected=sourceProjection(schemaOwner,catalog,profile);
  assert.equal(projected.value.kind,'object');
  assert.equal(projected.value.inputs.styleTypes.index,'metadata.style-item-types');
  assert(!Object.hasOwn(projected.value.inputs,'ownerKind'));
  assert(projected.modules.some(module=>module.kind==='fragment'));
  assert.deepEqual(projected.value.yamlOrder,['kind','appearance']);
  for(const changes of [{properties:['kind','missing']},{properties:['kind','kind']},{id:'common.wrong-object'},
    {root:'Field/Value'},{properties:['appearance']}]) {
    assert.throws(()=>sourceProjection(schemaOwner,catalog,{...profile,...changes}));
  }
  const changedGuard=structuredClone(conditional);
  changedGuard.parameters.toXML.$unresolved.sourceHash='changed';
  assert.equal(mapProperty(changedGuard,catalog).status,'blocked');
  const incompatible=structuredClone(use);
  incompatible.parameters.configurationIndexAddressing='xmlPath';
  assert.equal(mapProperty(incompatible,catalog).status,'blocked');

  for(const mutate of [
    row=>{row.properties[0].parameters.valueType='Unknown'},
    row=>{row.properties[0].parameters.extra=true},
    row=>{row.properties[1].parameters.yaml=row.properties[0].parameters.yaml},
    row=>{row.properties[0].parameters.exportSettingsXsiType=false},
    row=>{row.shapeComplete=false},
  ]) {
    const changed=structuredClone(owner);mutate(changed);
    assert.equal(declaredSettingsParameterTable(changed,catalog),undefined);
  }
});

test('imported choices infer a unique scalar default from declarations',()=>{
  const {catalog}=candidateCatalog();
  const property={name:'setting',status:'static-parameters',parameters:{type:'UserSettingsID',xml:'Setting',yaml:'Настройка',implicitValueYAML:false}};
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',mapped.reason);
  assert.equal(mapped.id,'common.user-settings-id');
  const expected={variant:{name:'boolean',value:{literal:false}}};
  assert.deepEqual(mapped.presence.yaml.missing.denotes,expected);
  assert.deepEqual(mapped.presence.xml.missing.denotes,expected);
  const renamed=new Map(catalog);
  const original=catalog.get('common.user-settings-id');
  renamed.set('common.renamed-choice',{...original,id:'common.renamed-choice'});
  assert.deepEqual(mapProperty({...property,parameters:{...property.parameters,type:'RenamedChoice'}},renamed).presence,mapped.presence);
  const ambiguous=structuredClone(original);
  ambiguous.value.variants.push({name:'secondBoolean',type:{use:'boolean'}});
  renamed.set('common.renamed-choice',ambiguous);
  assert.equal(mapProperty({...property,parameters:{...property.parameters,type:'RenamedChoice'}},renamed).status,'blocked');
  assert.equal(mapProperty({...property,parameters:{...property.parameters,implicitValueYAML:12}},catalog).status,'blocked');
});

test('complete source projections retain the owning XML type declaration',()=>{
  const {catalog}=candidateCatalog();
  const owner=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries.find(row=>row.symbol==='FilterItemComparisonRules');
  const projection=sourceProjection(owner,catalog,{properties:owner.properties.filter(row=>!row.parameters.runtimeOnly).map(row=>row.name),id:'working.filter-comparison',root:'dcsset:item',namespaces:{dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings',xsi:'http://www.w3.org/2001/XMLSchema-instance'}});
  assert.equal(projection.value.representations.xml.kind,'with-attributes');
  assert.deepEqual(projection.value.representations.xml.attributes,[{name:'xsi:type',value:{qname:'dcsset:FilterItemComparison'}}]);
  const property=owner.properties.find(row=>row.name==='use');
  const nestedOwner={...owner,properties:[{...property,parameters:{...property.parameters,xml:'Flag',xmlParents:['Attributes']}}]};
  const nested=sourceProjection(nestedOwner,catalog,{properties:['use'],id:'working.namespaced-property',root:'form:Form',namespaces:{form:'urn:form',dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings',xsi:'http://www.w3.org/2001/XMLSchema-instance'},defaultXmlNamespace:'form'});
  assert.deepEqual(nested.modules.find(row=>row.kind==='fragment').representations.xml.fields[0].path,['form:Form','form:Attributes','form:Flag']);
  const list=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries.find(row=>row.symbol==='DynamicListRules');
  for(const defaultXmlNamespace of [undefined,'form']) {
    const profile={properties:['autoFillAvailableFields'],id:'working.list-owner',root:'Settings',
      namespaces:{form:'http://v8.1c.ru/8.3/xcf/logform',xsi:'http://www.w3.org/2001/XMLSchema-instance'},defaultXmlNamespace};
    const owner=sourceProjection(list,catalog,profile).value;
    assert.equal(owner.representations.xml.attributes[0].value.qname,defaultXmlNamespace?'form:DynamicList':'DynamicList');
    assert.throws(()=>sourceProjection(list,catalog,{...profile,namespaces:{form:profile.namespaces.form}}),/namespace/);
  }


});

test('relative source records keep attributes while removing only the synthetic placement',async()=>{
  const {relativeSourceProjection}=await import('../src/source-projection.mjs');
  const {catalog}=candidateCatalog();
  const owner=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries.find(row=>row.symbol==='FilterItemComparisonRules');
  const relative=relativeSourceProjection(owner,catalog,{properties:owner.properties.filter(row=>!row.parameters.runtimeOnly).map(row=>row.name),id:'common.comparison-library',namespaces:{dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings',xsi:'http://www.w3.org/2001/XMLSchema-instance'}});
  assert.equal(relative.value.kind,'value');
  assert.equal(relative.value.representations.xml.attributes[0].value.qname,'dcsset:FilterItemComparison');
  assert(relative.modules.filter(row=>row.kind==='fragment').every(row=>row.representations.xml.fields.every(field=>field.path.length===1)));
  const dataSet=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries.find(row=>row.symbol==='DataCompositionSchemaDataSetFieldRules');
  const field=relativeSourceProjection(dataSet,catalog,{properties:dataSet.properties.map(row=>row.name),id:'common.field-library',
    namespaces:{xsi:'http://www.w3.org/2001/XMLSchema-instance',dcssch:'http://v8.1c.ru/8.1/data-composition-system/schema'}});
  assert.equal(field.value.representations.xml.kind,'record','Explicit source attribute owns the XML type instead of a static owner default');
  assert(field.modules.some(row=>row.representations.xml.fields?.some(property=>property.attribute==='xsi:type' && !property.path.length)));
  const list=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries.find(row=>row.symbol==='DynamicListRules');
  const qualified=relativeSourceProjection(list,catalog,{properties:['autoFillAvailableFields'],
    id:'common.qualified-library',defaultXmlNamespace:'form',
    namespaces:{form:'http://v8.1c.ru/8.3/xcf/logform',xsi:'http://www.w3.org/2001/XMLSchema-instance'}});
  assert.equal(qualified.value.representations.xml.attributes[0].value.qname,'form:DynamicList');
  assert(qualified.modules.filter(row=>row.kind==='fragment').every(row=>
    row.representations.xml.fields.every(field=>field.path.length===1 && field.path[0]==='form:AutoFillAvailableFields')));
});

test('empty object defaults belong to the declared container boundary',()=>{
  const {catalog}=candidateCatalog();
  const owner=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries.find(row=>row.symbol==='ConditionalAppearanceItemRules');
  const field=owner.properties.find(row=>row.name==='fields');
  const result=mapProperty(field,catalog,{dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings'});
  assert.equal(result.status,'candidate',JSON.stringify(result));
  assert.deepEqual(result.presence.xml.canonical,[{when:{not:{present:{field:'fields'}}},form:'empty-element'}]);
  const renamed={...catalog.get('common.dcs-available-fields'),id:'common.another-container'};
  const alternate=mapProperty({...field,parameters:{...field.parameters,type:'AnotherContainer'}},new Map([...catalog,[renamed.id,renamed]]),{dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings'});
  assert.equal(alternate.status,'candidate');
  assert.deepEqual(alternate.presence,result.presence);
  assert.equal(mapProperty({...field,parameters:{...field.parameters,defaultValueXMLRaw:{extra:'x'}}},catalog).status,'blocked');
});

test('data table targets migrate by their shape and allowed roots, not by owner or property name',()=>{
  const {catalog}=candidateCatalog();
  const owner=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries.find(row=>row.symbol==='DynamicListRules');
  const field=owner.properties.find(row=>row.name==='mainTable');
  for(const name of ['mainTable','renamedTable']) {
    const result=mapProperty({...field,name},catalog);
    assert.equal(result.status,'candidate',result.reason);
    assert.equal(result.id,'common.metadata-data-table-link');
    assert.deepEqual(result.type.bind.allowedRoots,{sequence:field.parameters.metadataTarget.roots.map(root=>({literal:root}))});
    assert(!result.inputs.allowedRoots);
  }
  assert.equal(mapProperty({...field,parameters:{...field.parameters,metadataTarget:{kind:'dataTable',roots:['Unknown']}}},catalog).status,'blocked');
});

test('disabled XML directions keep scalar fields in YAML without an XML route',()=>{
 const {catalog}=candidateCatalog();
 for(const type of ['string','boolean','number']) {
  const property={name:'renamedValue',type,status:'static-parameters',parameters:{type,yaml:'Значение',fromXML:false,toXML:false}};
  const mapped=mapProperty(property,catalog);
  assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
  assert.equal(mapped.yamlOnly,true);
  assert.deepEqual(mapped.path,[]);
  assert.deepEqual(mapped.presence.xml,{missing:{denotes:{absent:true}}});
  for(const changed of [{toXML:true},{fromXML:true},{defaultValueXML:'unexpected'}])
   assert.equal(mapProperty({...property,parameters:{...property.parameters,...changed}},catalog).status,'blocked');
 }
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 const owner=extraction.entries.find(row=>row.symbol==='DynamicListRules');
 const selected=owner.properties.filter(row=>['currentUserSettingsKey','customQuery'].includes(row.name));
 const projection=sourceProjection({...owner,properties:selected},catalog,{properties:selected.map(row=>row.name),id:'working.yaml-only-owner',root:'Settings',
  namespaces:{form:'http://v8.1c.ru/8.3/xcf/logform',xsi:'http://www.w3.org/2001/XMLSchema-instance'},defaultXmlNamespace:'form'});
 const fields=projection.modules.flatMap(module=>module.representations?.xml?.fields??[]);
 assert.equal(fields.some(field=>field.field==='currentUserSettingsKey'),false);
 assert.equal(projection.modules.some(module=>module.representations?.yaml?.fields?.some(field=>field.field==='currentUserSettingsKey')),true);
});

test('external string storage maps from parameters without a YAML key',()=>{
  const {catalog}=candidateCatalog();
  const source={name:'text',status:'static-parameters',parameters:{type:'string',xml:'Content',externalFile:{dir:'Тексты',extension:'txt',nameFrom:'parent'}}};
  const mapped=mapProperty(source,catalog);
  assert.equal(mapped.status,'candidate',mapped.reason);
  assert.equal(mapped.key,undefined);
  assert.deepEqual(mapped.file,{sequence:[{literal:'Тексты'},{concat:[{input:'parentName'},{literal:'.txt'}]}]});
  assert.deepEqual(mapped.inputs.parentName.type,{kind:'scalar',scalar:'text'});
  for(const externalFile of [{dir:'Тексты',extension:'txt',nameFrom:'self'}, {...source.parameters.externalFile,unknown:true}]) {
    assert.equal(mapProperty({...source,parameters:{...source.parameters,externalFile}},catalog).status,'blocked');
  }
});

test('ordinary owner emission composes prepared collections without dropping input or operation contracts',()=>{
 for(const suffix of ['first','renamed']) {
  const library=(id,scalar)=>({format:'nkdk-declarations/1',kind:'value',id,
   inputs:{context:{type:{kind:'scalar',scalar}}},
   value:{kind:'sequence',item:{kind:'scalar',scalar:'text'}},
   representations:{xml:{kind:'element-sequence',path:['Item']},yaml:{kind:'sequence'}}});
  const collections={Alpha:{module:library('common.alpha-'+suffix,'text')},Beta:{module:library('common.beta-'+suffix,'boolean')}};
  const owner={path:'sample.ts',symbol:'Example',comparison:{status:'keys-match'},properties:[
   {name:'alpha'+suffix,status:'static-parameters',source:{path:'alpha.ts'},parameters:{type:'Alpha',xml:'Item',xmlParents:['Root','First'],yaml:'Первая',configurationIndexAddressing:'yamlPath'}},
   {name:'beta'+suffix,status:'static-parameters',source:{path:'beta.ts'},parameters:{type:'Beta',xml:'Item',xmlParents:['Root','Second'],yaml:'Вторая'}},
  ]};
  const catalog=new Map(Object.values(collections).map(({module})=>[module.id,module]));
  const blocked=emitCandidates([owner],catalog,undefined,{}, {},{collectionValues:collections});
  assert.equal(blocked.entries[0].ownerBlockers.some(row=>row.reason==='owner-collection-contribution-required'),true);
  const result=emitCandidates([owner],catalog,undefined,{}, {},{collectionValues:collections,deferOwnerContributions:true});
  assert(result.entries[0].properties.every(row=>row.status==='candidate'));
  assert.deepEqual(result.entries[0].ownerRequirements,[{property:'alpha'+suffix,indexAddressing:'yamlPath'}]);
  const fragments=result.modules.filter(module=>module.kind==='fragment');
  assert.equal(fragments.length,2);
  for(const fragment of fragments) {
   const field=fragment.value.fields[0].name;
   assert.deepEqual(fragment.presence,[{target:{field},
    xml:{missing:{denotes:{sequence:[]}}},
    yaml:{missing:{denotes:{sequence:[]}},omitWhen:{not:{exists:{in:{field},as:'row',where:{literal:true}}}}}}]);
  }
  assert.deepEqual(fragments.map(module=>module.representations.xml.fields[0].path.at(-1)).sort(),['First','Second']);
  const projection=result.modules.find(module=>module.kind==='object');
  assert.equal(Object.keys(projection.inputs).length,2);
  const inputTypes=Object.values(projection.inputs).map(input=>input.type.scalar).sort();
  assert.deepEqual(inputTypes,['boolean','text']);
  const wrong=structuredClone(owner);wrong.properties[0].parameters.configurationIndexAddressing='uuid';
  assert.equal(emitCandidates([wrong],catalog,undefined,{}, {},{collectionValues:collections}).entries[0].properties[0].status,'blocked');
 }
});
