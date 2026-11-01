import * as resourceHelpers from '../src/source-resource-facts.mjs';
import {sourceResourceFacts} from '../src/source-resource-facts.mjs';
import {sourceFileOwners} from '../src/source-file-owners.mjs';
import {sourceTabularCollections} from '../src/source-tabular-collections.mjs';
import {sourceInputHistory} from '../src/source-input-history.mjs';
import {sourceOwnerAttachments} from '../src/source-owner-attachments.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {composeOwnerFragments,mergeOwnerFragments} from '../src/owner-composition.mjs';
import {assembleSourceOwner,sourceOwnerFieldOrder} from '../src/source-owner-assembly.mjs';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {candidateCatalog,dependencyFiles} from '../src/candidate-catalog.mjs';
import {characteristicOwnerOperation} from '../src/characteristic-owner-operation.mjs';
import {renameOwnerFields} from '../src/owner-fragment.mjs';
import {statefulScalarDeclarations,statefulScalarCatalog} from '../src/stateful-scalar.mjs';
import {stateHistoryEntries} from '../src/state-history.mjs';
import {ownerBaseState} from '../src/owner-base-state.mjs';
import {numericOwnerFragment} from '../src/numeric-owner-fragment.mjs';
import {assembleRecordStateOwner} from '../src/source-record-owner.mjs';
import {ownerStateRecords,sourceRecordStateFields} from '../src/owner-state-records.mjs';
import {ownerIndexRequirements,bindPreparedOwnerIndexes} from '../src/owner-index-requirements.mjs';
import {recordOwnerOperation,recordOwnerCollectionItem} from '../src/record-owner-operation.mjs';
import {sourceOwnerCollections} from '../src/source-owner-collections.mjs';
import {recordOwnerFactCollections} from '../src/record-owner-fact-sources.mjs';
import {partitionFileDeclarations} from '../src/record-owner-file-operation.mjs';
import {recordOwnerFileRoute} from '../src/record-owner-file-route.mjs';

test('owner index providers follow bindings rather than input names or shapes',()=>{
  const input={type:{kind:'index',key:{kind:'scalar',scalar:'text'},value:{kind:'scalar',scalar:'text'}}};
  const leaf={id:'sample.leaf',kind:'value',inputs:{lookup:input},value:{kind:'scalar',scalar:'text'}};
  const middle={id:'sample.middle',kind:'fragment',imports:{leaf:leaf.id},inputs:{renamed:input},
    value:{kind:'record',fields:[{name:'value',type:{use:'leaf',bind:{lookup:{input:'renamed'}}}}]}};
  const owner={id:'sample.owner',kind:'object',imports:{part:middle.id},
    inputs:{outer:structuredClone(input),independent:structuredClone(input)},compose:[{use:'part',bind:{renamed:{input:'outer'}}}],
    value:{kind:'record',fields:[]}};
  const catalog=new Map([leaf,middle,owner].map(row=>[row.id,row]));
  const providers={[leaf.id]:{lookup:'sample.values'}};
  assert.deepEqual(ownerIndexRequirements(owner,catalog,providers),{
    bindings:{outer:'sample.values'},missing:['independent'],
  });
  middle.imports.recursive=middle.id;
  middle.value.fields.push({name:'children',type:{kind:'sequence',item:{use:'recursive',
    bind:{renamed:{input:'renamed'}}}}});
  assert.deepEqual(ownerIndexRequirements(owner,catalog,providers),{
    bindings:{outer:'sample.values'},missing:['independent'],
  },'Value recursion must not lose a provider discovered later in the binding graph');
  const explicit=structuredClone(owner);
  explicit.inputs.independent.index='sample.other-values';
  assert.deepEqual(ownerIndexRequirements(explicit,catalog,providers),{
    bindings:{outer:'sample.values',independent:'sample.other-values'},missing:[],
  });
  const prepared=bindPreparedOwnerIndexes(explicit,ownerIndexRequirements(explicit,catalog,providers));
  assert.equal(prepared.inputs.outer.index,'sample.values');
  assert.equal(owner.inputs.outer.index,undefined,'Prepared indexes belong to the root, not the nested fragment');
  assert.equal(middle.inputs.renamed.index,undefined);
  assert.throws(()=>bindPreparedOwnerIndexes(owner,ownerIndexRequirements(owner,catalog,providers)),/Missing index provider/);
  const conflicting=structuredClone(owner);
  conflicting.inputs.outer.index='sample.other-values';
  assert.throws(()=>ownerIndexRequirements(conflicting,catalog,providers),/Conflicting index provider/);
  const detached=structuredClone(owner);
  detached.compose[0].bind.renamed={literal:'not-an-index'};
  assert.throws(()=>ownerIndexRequirements(detached,catalog,providers),/Index provider requires an input binding/);
  const producer={id:'sample.producer',kind:'object',contributions:[{index:'sample.values'}]};
  const otherProducer={id:'sample.other-producer',kind:'object',contributions:[{index:'sample.other-values'}]};
  const sources=new Map([...catalog,[producer.id,producer],[otherProducer.id,otherProducer]]);
  assert.deepEqual(new Set(dependencyFiles([prepared],sources,{includeIndexes:true}).map(row=>row.id)),
    new Set([leaf.id,middle.id,producer.id,otherProducer.id]));
  assert.throws(()=>dependencyFiles([prepared],catalog,{includeIndexes:true}),/Missing index declaration dependency/);
  assert.deepEqual(new Set(dependencyFiles([prepared],sources).map(row=>row.id)),new Set([leaf.id,middle.id]),
    'Import-only closure must not register additional project sources implicitly');
});

test('owner composition binds shared inputs and separates different input shapes',()=>{
  assert.ok(statefulScalarCatalog().some(row=>row.id==='common.stateful.system.StyleElementType'),
    'Tagged enumeration sources without numeric properties must be included');
  const wrappers=statefulScalarDeclarations({ids:{main:'test.states',changed:'test.changed',notified:'test.notified',plain:'test.plain'},
    payload:'value',type:{use:'semantic'},semantic:'common.type-description',implicit:false,plainForm:'sequence',taggedForm:'tagged'});
  const choice=wrappers.find(row=>row.id==='test.states');
  assert.equal(choice.representations.yaml.variants.find(row=>row.variant==='plain').form,'sequence');
  assert.ok(choice.representations.yaml.variants.filter(row=>row.tag).every(row=>row.form==='tagged'));
  for(const wrapper of wrappers) {
    assert.ok(!Object.hasOwn(wrapper.inputs,'implicit'));
    for(const variant of wrapper.value.variants??[])assert.ok(!Object.hasOwn(variant.type.bind,'implicit'));
    for(const presence of wrapper.presence??[])assert.notEqual(presence.target.field,'value');
  }
  const contextual=statefulScalarDeclarations({ids:{main:'test.context',changed:'test.context.changed',notified:'test.context.notified',plain:'test.context.plain'},
    payload:'value',type:{use:'semantic',bind:{labels:{input:'labels'},mode:{input:'mode'}}},semantic:'common.contextual',
    payloadInputs:{labels:{type:{kind:'index',key:{kind:'scalar',scalar:'text'},value:{kind:'scalar',scalar:'text'}}},
      mode:{type:{use:'domain'}}},payloadImports:{domain:'system.CompatibilityMode'},implicit:false,plainForm:'sequence',taggedForm:'tagged'});
  for(const wrapper of contextual) {
    assert.deepEqual(wrapper.inputs.value_labels.type.kind,'index');
    assert.equal(wrapper.imports[wrapper.inputs.value_mode.type.use],'system.CompatibilityMode');
    for(const variant of wrapper.value.variants??[]) {
      assert.deepEqual(variant.type.bind.value_labels,{input:'value_labels'});
      assert.deepEqual(variant.type.bind.value_mode,{input:'value_mode'});
    }
    for(const field of wrapper.value.fields??[])if(field.name==='value')
      assert.deepEqual(field.type.bind,{labels:{input:'value_labels'},mode:{input:'value_mode'}});
  }
  assert.throws(()=>statefulScalarDeclarations({ids:{main:'bad',changed:'bad.c',notified:'bad.n',plain:'bad.p'},
    payload:'value',type:{use:'semantic',bind:{missing:{input:'missing'}}},semantic:'common.contextual',implicit:false}),/Missing payload input/);
  const scalar={type:{kind:'scalar',scalar:'text'}},sequence={type:{kind:'sequence',item:{kind:'scalar',scalar:'text'}}};
  const first={kind:'fragment',id:'first',inputs:{name:scalar,forms:sequence}};
  const second={kind:'fragment',id:'second',inputs:{owner:scalar,forms:sequence}};
  const result=composeOwnerFragments('joined',[{alias:'one',fragment:first,bindings:{name:'name',forms:'firstForms'}},
    {alias:'two',fragment:second,bindings:{owner:'name',forms:'secondForms'}}]);
  assert.deepEqual(Object.keys(result.inputs),['name','firstForms','secondForms']);
  assert.deepEqual(result.compose[1].bind.owner,{input:'name'});
  const projected=composeOwnerFragments('projected',[{alias:'one',fragment:first,bindings:{
    name:{get:{of:{field:'source'},field:'name'}},forms:'sharedForms',
  }}]);
  assert.deepEqual(projected.compose[0].bind.name,{get:{of:{field:'source'},field:'name'}});
  assert.deepEqual(Object.keys(projected.inputs),['sharedForms'], 'A field projection must not become a second external context');
  assert.throws(()=>composeOwnerFragments('invalid-expression',[{alias:'one',fragment:first,bindings:{name:[],forms:'forms'}}]),/Invalid owner binding/);

  assert.throws(()=>composeOwnerFragments('bad',[{alias:'one',fragment:first,bindings:{name:'name'}}]),/Incomplete/);
  assert.throws(()=>composeOwnerFragments('bad',[{alias:'one',fragment:first,bindings:{name:'x',forms:'x'}}]),/Conflicting/);
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const source=extraction.entries.find(row=>row.symbol==='MetadataChartOfCharacteristicTypesRules');
  const {catalog}=candidateCatalog();
  const style=extraction.entries.find(row=>row.symbol==='MetadataStyleRules');
  const styleAssembly=assembleRecordStateOwner(style,catalog,
    {id:'test.style',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
  assert.deepEqual(styleAssembly.coverage.pending,[],
    'A file-only Template registration uses the shared external file composition');
  const styleItem=extraction.entries.find(row=>row.symbol==='MetadataStyleItemRules');
  const styleItemAssembly=assembleRecordStateOwner(styleItem,catalog,
    {id:'test.style-item',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
  assert.deepEqual(styleItemAssembly.coverage.pending,[],
    'Declared index providers and runtime-only service fields are composed automatically');
  const plainType=styleItemAssembly.modules.find(row=>row.id.endsWith('system.StyleElementType.plain'));
  assert.deepEqual(plainType.presence.find(row=>row.target.field==='value').yaml.nullWhen,
    {eq:[{field:'value'},{input:'implicit'}]},
    'Mounting owner history must preserve the declared implicit-value reduction without requiring a state tag');
  const styled=recordOwnerFileRoute(styleItem,styleItemAssembly,catalog,{
    xmlDirectory:'Inputs',yamlDirectory:'Outputs',yamlFile:null,maxBytes:131072,
    factSources:[{entry:'metadata.style-item-type-facts',inputs:{ownerName:'name'}}],
  });
  assert.equal(styled.factSources.at(-1).id,'metadata.style-item-type-facts');
  assert.deepEqual(styled.route.sources.at(-1),{
    entry:'metadata.style-item-type-facts',inputs:{ownerName:'name'},
  });
  assert.throws(()=>recordOwnerFileRoute(styleItem,styleItemAssembly,catalog,{
    xmlDirectory:'Inputs',yamlDirectory:'Outputs',maxBytes:131072,
    factSources:[{entry:'missing'}],
  }),/Missing registered fact source/);
  const changedStyle=structuredClone(style);
  changedStyle.properties.find(row=>row.name==='style').parameters.toXML=true;
  assert.ok(resourceHelpers.sourceResourceAttachments(changedStyle,'test.changed-style',catalog)
    .blockers.length);
  const xdto=extraction.entries.find(row=>row.symbol==='MetadataXDTOPackageRules');
  const xdtoAssembly=assembleRecordStateOwner(xdto,catalog,{id:'test.xdto-files',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
  assert.ok(xdtoAssembly.coverage.assembled.includes('package'),
    'Static ExternalFile paths must mount the shared file declaration automatically');
  const files=xdtoAssembly.modules.find(row=>row.id==='test.xdto-files.external-files');
  assert.deepEqual(files.value,{kind:'record',fields:[]});
  assert.deepEqual(files.compose,[{use:'file',bind:{
    sourcePath:{sequence:[{literal:'Ext'},{literal:'Package.bin'}]},
    targetPath:{sequence:[{literal:'Package.bin'}]},
  }}]);
  assert.ok(!xdtoAssembly.coverage.pending.some(row=>row.name==='package'));
  const routed=recordOwnerFileRoute(xdto,xdtoAssembly,catalog,{xmlDirectory:'Inputs',yamlDirectory:'Outputs',maxBytes:131072});
  const storage=extraction.entries.find(row=>row.symbol==='MetadataSettingsStorageRules');
  const storageAssembly=recordOwnerOperation(extraction,catalog,{symbol:storage.symbol,
    id:'test.storage',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
  const storageRoute=recordOwnerFileRoute(storage,storageAssembly,catalog,
    {xmlDirectory:'Inputs',yamlDirectory:'Outputs',maxBytes:131072});
  for(const [field,folder,file,element] of [['forms','Формы','Форма.yaml','Form'],
    ['templates','Шаблоны','Template.xml','Template']]) {
    const reader=storageRoute.factSources.find(row=>row.id===`test.storage.child-names.${field}`);
    assert.deepEqual(reader.representations.xml.fields[0].path,
      ['md:MetaDataObject','md:SettingsStorage','md:ChildObjects',`md:${element}`]);
    assert.deepEqual(storageRoute.route.sources.find(row=>row.entry===reader.id).resourceNames,
      {directory:[folder],field,entryFile:file,preserveOrder:true});
    assert.deepEqual(storageRoute.route.inputs[`children_${field}`],
      {snapshot:{entry:reader.id,field}});
    assert.ok(!Object.keys(reader.inputs??{}).length,'A source of child names cannot depend on itself');
  }
  assert.deepEqual(storageRoute.route.inputs.ordinary0_forms,storageRoute.route.inputs.children_forms,
    'Form links and child serialization use the same fresh list');
  const typeFacts=storageRoute.factSources.find(row=>row.id==='test.storage.internal-type-facts');
  assert.ok(typeFacts,'Required internal type indexes must have an independent registered reader');
  assert.deepEqual(typeFacts.representations.xml.fields[0].path,
    ['md:MetaDataObject','md:SettingsStorage','md:InternalInfo']);
  assert.deepEqual(typeFacts.contributions.map(row=>row.index),
    ['metadata.internal-type-ids','metadata.internal-value-ids']);
  assert.ok(!Object.values(typeFacts.inputs).some(input=>input.index),
    'The internal type reader must not consume its own indexes');
  assert.deepEqual(typeFacts.contributions[0].key.record.owner,{input:'owner'});
  assert.deepEqual(storageRoute.route.sources.find(row=>row.entry===typeFacts.id).inputs,{
    owner:{snapshot:{entry:'test.storage.own-identity',field:'uuid'}},
    ownerName:{snapshot:{entry:'test.storage.own-identity',field:'name'}},
  });
  const implicitTypes=typeFacts.presence.find(row=>row.target.field==='types').yaml.missing.denotes.sequence;
  assert.equal(implicitTypes.length,1);
  assert.deepEqual(implicitTypes[0].record.category,{literal:'Manager'});
  assert.deepEqual(implicitTypes[0].record.name,
    {concat:[{literal:'SettingsStorageManager.'},{input:'ownerName'}]});
  assert.ok(implicitTypes[0].record.typeId.identity.address.some(part=>part.input==='owner'),
    'Internal identities must include the actual owner identity, including its component and parent');
  const childResources=storageAssembly.modules.find(row=>row.id==='test.storage.children').resources;
  assert.equal(childResources.length,4);
  assert.deepEqual(childResources[0].forEach.in,{input:'templates'});
  assert.deepEqual(childResources[0].oneOf[0].yaml.sequence,
    [{literal:'Шаблоны'},{var:'name'},{literal:'Template.xml'}]);
  const renamedStorage=structuredClone(storage);
  const renamedTemplates=renamedStorage.properties.find(row=>row.name==='templates').parameters;
  renamedTemplates.yaml=renamedTemplates.folderName=renamedTemplates.operationTarget.folderName='ДругаяПапка';
  const renamedStorageAssembly=recordOwnerOperation({...extraction,entries:[renamedStorage]},catalog,
    {symbol:storage.symbol,id:'test.renamed-storage',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
  assert.ok(renamedStorageAssembly.modules.find(row=>row.id==='test.renamed-storage.children')
    .resources.every(row=>(row.oneOf??[row.remainder]).every(path=>path.yaml.sequence[0].literal==='ДругаяПапка')));
  assert.equal(routed.route.owners.cf,xdtoAssembly.owner.id);
  const flat=recordOwnerFileRoute(xdto,xdtoAssembly,catalog,
    {xmlDirectory:'Inputs',yamlDirectory:'Outputs',yamlFile:null,maxBytes:131072});
  assert.ok(!Object.hasOwn(flat.route,'yamlFile'));
  assert.ok(flat.factRoutes.every(row=>!Object.hasOwn(row,'yamlFile')));
  assert.equal(routed.route.owners.cfe,xdtoAssembly.owner.id);
  assert.equal(routed.route.inputs.ordinary0_ownerName.snapshot.field,'name');
  assert.equal(routed.route.inputs.ordinary1_owner,'parent');
  assert.deepEqual(routed.route.inputs.state_owner,routed.route.sources[1].inputs.owner);
  assert.ok(routed.factSources[2].value.fields.some(row=>row.name==='objectBelonging'));
  assert.throws(()=>recordOwnerFileRoute(xdto,{...xdtoAssembly,indexRequirements:{bindings:{},missing:['unknown']}},catalog,
    {xmlDirectory:'Inputs',yamlDirectory:'Outputs',maxBytes:131072}),/Complete registered file owner/);
  const renamedFile=structuredClone(xdtoAssembly);
  const renamedInputs=Object.fromEntries(Object.keys(renamedFile.owner.inputs).map((name,index)=>[name,`fileContext${index}`]));
  renamedFile.owner.inputs=Object.fromEntries(Object.entries(renamedFile.owner.inputs).map(([name,value])=>[renamedInputs[name],value]));
  for(const part of renamedFile.owner.compose)for(const value of Object.values(part.bind))
    if(value.input)value.input=renamedInputs[value.input];
  renamedFile.indexRequirements.bindings=Object.fromEntries(Object.entries(renamedFile.indexRequirements.bindings).map(([name,value])=>[renamedInputs[name],value]));
  const renamedRoute=recordOwnerFileRoute(xdto,renamedFile,catalog,{xmlDirectory:'Inputs',yamlDirectory:'Outputs',maxBytes:131072});
  assert.deepEqual(renamedRoute.route.inputs,Object.fromEntries(Object.entries(routed.route.inputs).map(([name,value])=>[renamedInputs[name],value])),
    'File context follows compose bindings, including renamed inputs');
  assert.ok(xdtoAssembly.coverage.stateContracts.find(row=>row.property==='namespace').attached,
    'Tagged strings must use the same declared state/history mechanism as other scalar values');
  assert.ok(xdtoAssembly.state.module.constraints.some(row=>row.id==='namespace-required'),
    'Wrapping a scalar in state variants must retain its source validation constraints');
  const xdtoChangedFile=structuredClone(xdto);
  xdtoChangedFile.properties.find(row=>row.name==='package').parameters.syncExternalOnly=false;
  assert.ok(resourceHelpers.sourceResourceAttachments(xdtoChangedFile,'test.changed-file',catalog)
    .blockers.some(row=>row.reason==='external-file-contract-unreviewed'));
  const input=catalog.get('fragment.input-by-string.chartofcharacteristictypes');
  const before=structuredClone(input);
  const parameterized=structuredClone(source);
  parameterized.properties.find(row=>row.name==='type').parameters.addTypeDescriptionAttributeToXML=true;
  const wrapped=ownerStateRecords(input,parameterized,catalog,{id:'test.record-parameters',fields:[{name:'type',plainForm:'sequence'}]});
  assert.equal(wrapped.module.value.fields.find(row=>row.name==='type').type.with,undefined,
    'Common parameters belong to the payload, not the state wrapper');
  for(const row of wrapped.declarations.filter(row=>row.value.kind==='record'))
    assert.deepEqual(row.value.fields.find(field=>field.name==='value').type.with,{addTypeDescriptionAttributeToXML:true});

  // A structural adapter example, not acceptance of another metadata property:
  // two registered fields using the same common must retain distinct state types.
  const repeatedSource=structuredClone(source);
  repeatedSource.properties.push({...structuredClone(source.properties.find(row=>row.name==='type')),
    name:'secondType',parameters:{...source.properties.find(row=>row.name==='type').parameters,xml:'SecondType',yaml:'ВторойТип'}});
  const repeated=ownerStateRecords(input,repeatedSource,catalog,{id:'test.two-record-states',
    fields:[{name:'type',plainForm:'sequence'},{name:'secondType',plainForm:'sequence'}]});
  const firstState=repeated.module.value.fields.find(row=>row.name==='type');
  const secondState=repeated.module.value.fields.find(row=>row.name==='secondType');
  assert.notEqual(firstState.type.use,secondState.type.use);
  assert.equal(repeated.module.imports[firstState.type.use],'test.two-record-states.type.state');
  assert.equal(repeated.module.imports[secondState.type.use],'test.two-record-states.secondType.state');

  const contextualCatalog=new Map(catalog),contextualType=structuredClone(catalog.get('common.type-description'));
  contextualType.inputs={labels:{type:{kind:'index',key:{kind:'scalar',scalar:'text'},value:{kind:'scalar',scalar:'text'}}},
    profile:{type:{kind:'scalar',scalar:'text'}}};
  contextualCatalog.set(contextualType.id,contextualType);
  const contextWrapped=ownerStateRecords(input,source,contextualCatalog,{id:'test.record-context',fields:[{name:'type',plainForm:'sequence'}]});
  const contextField=contextWrapped.module.value.fields.find(row=>row.name==='type');
  assert.deepEqual(contextField.type.bind.value_labels,{input:'labels'});
  assert.deepEqual(contextField.type.bind.value_profile,{input:'profile'});
  assert.deepEqual(contextWrapped.module.inputs.labels,contextualType.inputs.labels);
  assert.deepEqual(contextWrapped.module.inputs.profile,contextualType.inputs.profile);
  for(const wrapper of contextWrapped.declarations)
    assert.deepEqual(wrapper.inputs.value_labels,contextualType.inputs.labels);

  const grouped=ownerStateRecords(input,parameterized,catalog,{id:'test.record-grouped',fields:[{
    name:'type',plainForm:'sequence',grouped:{semantic:'common.grouped-type-description',mode:'MultiState'},
  }]});
  assert.ok(grouped.declarations.some(row=>row.value?.variants?.some(variant=>variant.name==='grouped')));
  assert.ok(grouped.module.constraints.some(row=>row.id==='state-version-type-multi'));
  assert.ok(grouped.module.constraints.some(row=>row.id==='state-agrees-type-grouped'));
  const groupedHistory=grouped.module.presence.find(row=>row.target.field==='history').yaml.default.concat;
  assert.ok(groupedHistory.some(row=>row.then.sequence[0].record.mode.literal==='MultiState'));
  const groupedField=grouped.module.value.fields.find(row=>row.name==='type');
  assert.ok(groupedField.type.bind.groupMode.if.present.lookup);

  const groupedContextCatalog=new Map(contextualCatalog),groupedContext=structuredClone(catalog.get('common.grouped-type-description'));
  const typedContext=structuredClone(contextualType);
  typedContext.imports={...typedContext.imports,ownDomain:'system.CompatibilityMode'};
  typedContext.inputs.profile={type:{use:'ownDomain'}};
  groupedContextCatalog.set(typedContext.id,typedContext);
  groupedContext.inputs=structuredClone(typedContext.inputs);
  groupedContext.inputs.profile.type.use='groupedDomain';
  groupedContext.imports.groupedDomain='system.CompatibilityMode';
  groupedContextCatalog.set(groupedContext.id,groupedContext);
  const groupedContextual=ownerStateRecords(input,source,groupedContextCatalog,{id:'test.record-grouped-context',fields:[{
    name:'type',plainForm:'sequence',grouped:{semantic:groupedContext.id,mode:'MultiState'},
  }]});
  const groupedState=groupedContextual.declarations.find(row=>row.value.kind==='choice');
  assert.deepEqual(groupedState.value.variants.find(row=>row.name==='grouped').type.bind,
    {labels:{input:'value_labels'},profile:{input:'value_profile'}});
  const assembled=assembleSourceOwner(source,catalog,{id:'test.characteristic-assembly',attachments:[
    {alias:'input',properties:['inputByString','codeLength','descriptionLength'],module:input},
  ]});
  const child=extraction.entries.find(row=>row.symbol==='MetadataCatalogAttributeRules');
  assert.deepEqual(sourceRecordStateFields(child,catalog),[{name:'type',plainForm:'sequence',
    grouped:{semantic:'common.grouped-type-description',mode:'MultiState',capability:'multi'}},{name:'format',plainForm:'input-profile'}]);
  assert.deepEqual(sourceRecordStateFields(source,catalog),[{name:'type',plainForm:'sequence'}]);
  const catalogSource=extraction.entries.find(row=>row.symbol==='MetadataCatalogRules');
  const rejectedServices=structuredClone(catalogSource);
  rejectedServices.properties.find(row=>row.name==='internalInfo').parameters.unreviewed=true;
  const rejectedAttachments=sourceOwnerAttachments(rejectedServices,'test.rejected-services');
  assert.ok(!rejectedAttachments.attachments.some(row=>row.properties.includes('internalInfo')));
  assert.ok(rejectedAttachments.blockers.some(row=>row.properties.includes('internalInfo')));
  const explicitlyAttached=sourceOwnerAttachments(catalogSource,'test.services',{claimed:['commands']});
  assert.ok(!explicitlyAttached.attachments.some(row=>row.properties.includes('commands')));
  const incompleteCatalog=assembleRecordStateOwner(catalogSource,catalog,
    {id:'test.catalog-coverage',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
  assert.equal(incompleteCatalog.coverage.assembled.length+incompleteCatalog.coverage.pending.length,
    catalogSource.properties.length,'Every unsupported source property remains visible in coverage');
  assert.ok(incompleteCatalog.coverage.assembled.includes('codeAllowedLength'));
  assert.ok(incompleteCatalog.coverage.assembled.includes('hierarchical'));
  assert.ok(incompleteCatalog.coverage.assembled.includes('hierarchyType'));
  assert.ok(incompleteCatalog.coverage.assembled.includes('owners'));
  assert.ok(incompleteCatalog.coverage.blockers.some(row=>row.property==='owners'&&row.reason==='owner-fact-contribution-required'));
  assert.throws(()=>recordOwnerOperation(extraction,catalog,{symbol:catalogSource.symbol,
    id:'test.incomplete-catalog',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'}),/Incomplete record owner/);
  const registeredChild=assembleRecordStateOwner(child,catalog,{id:'test.registered-child',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
  assert.equal(registeredChild.coverage.assembled.length,33);
  assert.deepEqual(registeredChild.coverage.pending,[]);
  assert.deepEqual(registeredChild.state.properties,['type','format']);
  assert.deepEqual(registeredChild.coverage.stateContracts.filter(row=>!row.requiresHistory).map(row=>row.property),
    ['synonym','editFormat','toolTip','choiceForm'],
    'Plain properties preserve values without inferring state history');
  assert.ok(registeredChild.coverage.stateContracts.every(row=>row.attached));
  assert.deepEqual(registeredChild.indexRequirements,{
    bindings:{state_states:'metadata.property-state-membership',state_baseIds:'metadata.base-identities',
      ordinary0_definedTypes:'metadata.defined-type-alternatives',ordinary0_roots:'metadata.roots',
      ordinary0_forms:'metadata.forms',ordinary1_identities:'metadata.own-identities'},missing:[],
  },'All six prepared indexes must survive fragment mounting and composition');
  assert.ok(registeredChild.owner.compose.some(part=>part.use==='state'));
  const operation=recordOwnerOperation(extraction,catalog,{symbol:child.symbol,
    id:'test.record-operation',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
  assert.deepEqual(operation.factSources.map(row=>row.contributions.map(part=>part.index)),[
    ['metadata.own-identities'],['metadata.property-state-membership'],['metadata.base-identities'],
  ]);
  assert.deepEqual(operation.factSources[0].representations.xml.fields.map(row=>row.path),
    [['md:Attribute','md:Properties','md:Name'],['md:Attribute']]);
  const recordIdentity=operation.factSources[0];
  assert.ok(recordIdentity.inputs.ownerName && recordIdentity.inputs.identitySeed,
    'A registered identity reader must materialize a new owner without a handwritten creator');
  assert.deepEqual(recordIdentity.presence.find(row=>row.target.field==='name').yaml.missing.denotes,{input:'ownerName'});
  assert.deepEqual(recordIdentity.presence.find(row=>row.target.field==='uuid').yaml.missing.denotes.identity.address,
    [{input:'component'},{concat:[{literal:'owner:'},{input:'owner'}]},{literal:'Attribute'},{field:'name'}],
    'Nested owners with the same name must be distinguished by parent identity and component');
  assert.ok(operation.factSources.every(row=>!Object.values(row.inputs??{}).some(input=>input.index)),
    'Facts are read before the complete object consumes the prepared indexes');
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  const parent=extraction.entries.find(row=>row.symbol==='MetadataCatalogRules');
  const local=new Map([...catalog,...operation.modules.map(row=>[row.id,row])]);
  const factCollections=recordOwnerFactCollections(child,operation,{parent,catalog,
    edge:graph.edges.find(row=>row.owner.symbol===parent.symbol&&row.property==='attributes'),
    id:'test.catalog-attribute-file-facts'});
  assert.equal(factCollections.entries.length,3);
  assert.equal(factCollections.entries[0].inputs.owner,undefined,'Parent identity must come from the owner XML header');
  assert.deepEqual(factCollections.entries[0].value.fields[0].type.bind.owner,{field:'parentIdentity'});
  for(const entry of factCollections.entries) {
    assert.deepEqual(entry.representations.xml.fields[0].path,
      ['md:MetaDataObject','md:Catalog','md:ChildObjects']);
    assert.ok(Object.values(entry.inputs).every(input=>!input.index));
  }
  assert.deepEqual(factCollections.modules.filter(row=>row.kind==='fragment' && row.contributions?.length)
    .flatMap(row=>row.contributions.map(part=>part.index)),
    ['metadata.own-identities','metadata.property-state-membership','metadata.base-identities']);

  const descriptor=recordOwnerCollectionItem(child,operation);
  const rowBindings=descriptor.bindings;
  const renamedOperation=structuredClone(operation);
  const inputNames=Object.fromEntries(Object.keys(renamedOperation.owner.inputs).map((name,index)=>[name,`context${index}`]));
  renamedOperation.owner.inputs=Object.fromEntries(Object.entries(renamedOperation.owner.inputs).map(([name,value])=>[inputNames[name],value]));
  for(const part of renamedOperation.owner.compose)for(const binding of Object.values(part.bind))
    if(binding.input)binding.input=inputNames[binding.input];
  const renamedDescriptor=recordOwnerCollectionItem(child,renamedOperation);
  assert.deepEqual(Object.keys(renamedDescriptor.bindings),Object.keys(rowBindings).map(name=>inputNames[name]),
    'Row context follows checked compose bindings, not generated prefixes');
  assert.equal(renamedDescriptor.bindings[inputNames.state_adopted].present.lookup.in.input,inputNames.state_baseIds);

  const collection=sourceOwnerCollections(parent,extraction,local,graph,{
    id:'test.complete-attribute-collection',properties:['attributes'],
    composedItems:{attributes:descriptor},
  });
  const collectionItem=collection.modules.find(row=>row.kind==='value'&&row.compose);
  assert.ok(collectionItem);
  assert.deepEqual(collectionItem.compose.find(row=>row.use==='ordinary0').bind.stateView_type,{field:'type'});
  assert.deepEqual(collectionItem.compose.find(row=>row.use==='state').bind.owner,{field:'uuid'});
  assert.deepEqual(collectionItem.compose.find(row=>row.use==='state').bind.adopted,rowBindings.state_adopted);
  assert.deepEqual(Object.keys(collectionItem.inputs),Object.keys(operation.owner.inputs).filter(name=>!Object.hasOwn(rowBindings,name)));
  assert.deepEqual(operation.owner.compose.find(row=>row.use==='state').bind.owner,{input:'state_owner'});
  const providers=ownerIndexRequirements(collection.attachments[0].module,
    new Map([...local,...collection.modules.map(row=>[row.id,row])]),{
      [collection.attachments[0].module.id]:collection.attachments[0].indexProviders,
    });
  assert.deepEqual(providers,operation.indexRequirements,
    'Each collection keeps the six distinct prepared indexes, without rereading the full item');
  const collectionProbe=collection.modules.find(row=>row.id==='test.complete-attribute-collection.attributes.probe');
  for(const [name,index] of Object.entries(operation.indexRequirements.bindings))
    assert.equal(collectionProbe.inputs[name].index,index,'The compiled owner probe must prepare its providers too');
  const integratedCatalog=assembleRecordStateOwner(catalogSource,
    new Map([...local,...collection.modules.map(row=>[row.id,row])]),{
      id:'test.catalog-with-complete-attributes',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses',
      attachments:collection.attachments,
    });
  assert.ok(integratedCatalog.coverage.assembled.includes('attributes'));
  assert.ok(!integratedCatalog.coverage.pending.some(row=>row.name==='attributes'));
  assert.equal(integratedCatalog.coverage.assembled.length+integratedCatalog.coverage.pending.length,
    catalogSource.properties.length);
  assert.ok(integratedCatalog.coverage.assembled.includes('codeAllowedLength'));
  assert.ok(integratedCatalog.coverage.assembled.includes('codeLength'));
  for(const property of ['synonym','objectPresentation','extendedObjectPresentation',
    'listPresentation','extendedListPresentation','explanation'])
    assert.ok(integratedCatalog.coverage.assembled.includes(property));
  assert.equal(integratedCatalog.coverage.assembled.length,69);
  assert.equal(integratedCatalog.coverage.pending.length,0);
  assert.deepEqual(integratedCatalog.indexRequirements.missing,[]);
  for(const property of ['internalInfo','forms','templates','commands'])
    assert.ok(integratedCatalog.coverage.assembled.includes(property));
  assert.equal(integratedCatalog.indexRequirements.bindings.internal_typeIds,'metadata.internal-type-ids');
  assert.equal(integratedCatalog.indexRequirements.bindings.commands_identities,'metadata.own-identities');
  assert.equal(integratedCatalog.indexRequirements.bindings.indexes_identities,'metadata.additional-index-ids');
  assert.ok(integratedCatalog.coverage.assembled.includes('inputByString'));
  assert.equal(integratedCatalog.state.module.value.fields.filter(row=>row.name==='history').length,1);
  for(const name of ['hierarchical','hierarchyType','codeAllowedLength']) {
    assert.ok(integratedCatalog.coverage.stateContracts.find(row=>row.property===name).attached);
    assert.ok(integratedCatalog.state.module.value.fields.some(row=>row.name===name));
    assert.ok(integratedCatalog.state.fieldViews[name]);
  }
  const unreviewedScalar=structuredClone(catalogSource);
  unreviewedScalar.properties.find(row=>row.name==='hierarchyType').parameters.yaml='Unreviewed';
  assert.throws(()=>assembleRecordStateOwner(unreviewedScalar,catalog,{id:'test.unreviewed-scalar'}),
    /Unreviewed scalar state registration/);
  assert.equal(integratedCatalog.indexRequirements.bindings.state_members,'metadata.input-by-string-members');
  assert.ok(integratedCatalog.coverage.assembled.includes('predefined'));
  assert.ok(integratedCatalog.coverage.stateContracts.find(row=>row.property==='predefined').attached,
    'A semantic file collection must also restore its owner history');
  assert.ok(integratedCatalog.owner.compose.some(row=>integratedCatalog.owner.imports[row.use].endsWith('.predefined')));
  assert.equal(integratedCatalog.indexRequirements.bindings.identities,'metadata.predefined-identities');
  const filePart=integratedCatalog.owner.compose.find(row=>integratedCatalog.owner.imports[row.use].endsWith('.predefined'));
  assert.equal(filePart.bind.owner.concat[0].input,'state_component');
  assert.ok(!Object.hasOwn(integratedCatalog.owner.inputs,'component'),
    'File identity must share the owner component instead of introducing a second context');
  const beforeFiles=structuredClone(integratedCatalog);
  sourceFileOwners(integratedCatalog,catalogSource,catalog,{claimed:['predefined']});
  assert.deepEqual(integratedCatalog,beforeFiles);
  const changedFile=structuredClone(catalogSource);
  changedFile.properties.find(row=>row.name==='predefined').parameters.filePath='Ext/Unreviewed.xml';
  const rejectedFile=sourceFileOwners(structuredClone(integratedCatalog),changedFile,catalog);
  assert.ok(rejectedFile.coverage.blockers.some(row=>row.reason==='unreviewed-source-file-owner'));
  assert.equal(rejectedFile.owner.compose.length,integratedCatalog.owner.compose.length);
  assert.ok(integratedCatalog.coverage.blockers.some(row=>row.reason==='file-extension-profile-required'));
  assert.ok(integratedCatalog.coverage.assembled.includes('tabularSections'));
  assert.equal(integratedCatalog.indexRequirements.bindings.tabularSections_typeIds,'metadata.internal-type-ids');
  assert.equal(integratedCatalog.indexRequirements.bindings.tabularSections_identities,'metadata.own-identities');
  const tabularPart=integratedCatalog.owner.compose.find(row=>row.use==='tabularSections');
  assert.deepEqual(tabularPart.bind.parentOwner,{field:'uuid'});
  assert.deepEqual(tabularPart.bind.parentName,{field:'name'});
  assert.deepEqual(sourceTabularCollections(catalogSource,catalog,'test.skip-tabs',{claimed:['tabularSections']}),
    {attachments:[],modules:[],blockers:[]});
  const changedTabs=structuredClone(catalogSource);
  changedTabs.properties.find(row=>row.name==='tabularSections').parameters.yaml='Непроверенные';
  assert.equal(sourceTabularCollections(changedTabs,catalog,'test.bad-tabs').blockers[0].reason,
    'unreviewed-tabular-collection');
  for(const module of integratedCatalog.modules.filter(row=>row.kind==='fragment'))
    assert.ok(Object.values(module.inputs??{}).every(input=>!input.index),
      'Only the operation root prepares indexes; file-owner fragments also receive them through bindings');
  assert.ok(integratedCatalog.coverage.assembled.includes('standardAttributes'));
  assert.equal(integratedCatalog.indexRequirements.bindings.standard_roots,'metadata.roots');
  assert.equal(integratedCatalog.indexRequirements.bindings.standard_forms,'metadata.forms');
  const standaloneStandard=sourceOwnerAttachments(catalogSource,'test.standard',{catalog});
  assert.equal(standaloneStandard.attachments.filter(row=>row.properties.includes('standardAttributes')).length,1);
  const explicitStandard=sourceOwnerAttachments(catalogSource,'test.standard',{catalog,claimed:['standardAttributes']});
  assert.ok(!explicitStandard.attachments.some(row=>row.properties.includes('standardAttributes')));
  const unreviewedStandard=structuredClone(catalogSource);
  unreviewedStandard.properties.find(row=>row.name==='standardAttributes').parameters.unreviewed=true;
  const deniedStandard=sourceOwnerAttachments(unreviewedStandard,'test.standard',{catalog});
  assert.ok(deniedStandard.blockers.some(row=>row.reason==='unreviewed-standard-attachment'));
  assert.ok(!deniedStandard.attachments.some(row=>row.properties.includes('standardAttributes')));
  assert.equal(integratedCatalog.indexRequirements.bindings.state_baseNumbers,'metadata.base-owner-numbers');
  assert.ok(integratedCatalog.state.fieldViews.codeType.value);
  const codeView=integratedCatalog.state.fieldViews.codeType;
  assert.equal(codeView.type.variants[0].type.fields[0].type.kind,'enum');
  assert.deepEqual(codeView.presence,{present:{input:'stateView_codeType'}});
  const withoutInput=new Map(catalog);withoutInput.delete('fragment.input-by-string.catalog');
  assert.equal(sourceInputHistory(catalogSource,withoutInput).reason,'missing-input-history-declaration');
  const changedInput=structuredClone(catalogSource);
  changedInput.properties.find(row=>row.name==='inputByString').parameters.standardFields[0].yaml='Unreviewed';
  assert.equal(sourceInputHistory(changedInput,catalog).reason,'unreviewed-input-history-registration');
  assert.equal(sourceInputHistory(child,catalog),undefined);
  const resourcePolicy=catalog.get('fragment.resource-state-policy');
  assert.equal(resourcePolicy?.kind,'fragment','File comparison must compose without public service fields');
  assert.deepEqual(resourcePolicy.value.fields,[]);
  assert.ok(Object.values(resourcePolicy.inputs).every(input=>!input.index));
  const resourceComparison=catalog.get('migration.resource-state-comparison');
  assert.equal(resourceComparison.imports.policy,resourcePolicy.id);
  assert.deepEqual(resourceComparison.compose[0].bind.property,{field:'property'});
  assert.deepEqual(resourceComparison.compose[0].bind.mode,{field:'mode'});
  execFileSync('node',['tools/rules-migration/src/source-resource-facts.mjs','--check']);
  const resourceParts=integratedCatalog.owner.compose.filter(part=>part.use.startsWith('resourceState_'));
  assert.equal(resourceParts.length,2,'Every registered fixed resource must automatically mount its common policy');
  assert.deepEqual(resourceParts.map(part=>part.bind.property),[{literal:'objectModule'},{literal:'managerModule'}]);
  assert.ok(resourceParts.every(part=>integratedCatalog.owner.imports[part.use]===resourcePolicy.id));
  assert.deepEqual(resourceParts[0].bind.owner,{input:'state_owner'});
  assert.equal(integratedCatalog.indexRequirements.bindings.resource_fingerprints,'metadata.resource-fingerprints');
  assert.equal(integratedCatalog.indexRequirements.bindings.resource_registrations,'metadata.resource-registrations');
  assert.ok(integratedCatalog.coverage.blockers.some(row=>row.reason==='resource-state-fact-routing-required'));
  assert.equal(typeof resourceHelpers.sourceResourceFingerprints,'function');
  const fingerprintSources=resourceHelpers.sourceResourceFingerprints(catalogSource,
    {identitySource:'test.catalog.own-identity',maxBytes:131072});
  assert.equal(fingerprintSources[0].entry,'migration.resource-fingerprint-source');
  assert.deepEqual(fingerprintSources[0].inputs,{component:'component',
    owner:{snapshot:{entry:'test.catalog.own-identity',field:'uuid'}}});
  assert.deepEqual(fingerprintSources[0].factDirections,['xml-to-yaml','yaml-to-xml']);
  assert.deepEqual(fingerprintSources[0].resourcePresence.paths,integratedCatalog.resourceFactSources[0].resourcePresence.paths);
  for(const maxBytes of [-1,undefined,1.5,'131072',Number.MAX_SAFE_INTEGER+1])
    assert.throws(()=>resourceHelpers.sourceResourceFingerprints(catalogSource,
      {identitySource:'test.catalog.own-identity',maxBytes}),/fingerprint budget/);
  assert.throws(()=>resourceHelpers.sourceResourceFingerprints(catalogSource,{identitySource:'',maxBytes:1}),/identity source/);
  assert.deepEqual(integratedCatalog.resourceFactSources,[{
    entry:'migration.resource-presence-source',inputs:{},factDirections:[],newOwner:{template:{files:[]}},
    resourcePresence:{field:'files',paths:[
      {name:'objectModule',xml:['Ext','ObjectModule.bsl'],yaml:['МодульОбъекта.bsl']},
      {name:'managerModule',xml:['Ext','ManagerModule.bsl'],yaml:['МодульМенеджера.bsl']},
    ]},
  }]);
  const commandSource=extraction.entries.find(row=>row.symbol==='MetadataDocumentCommandRules');
  const resourceBlockers=[];
  assert.deepEqual(sourceResourceFacts(commandSource,{blockers:resourceBlockers}),[]);
  assert.deepEqual(resourceBlockers,[{properties:['commandModule'],
    reason:'unresolved-resource-path',parameter:'xmlPath'}]);
  assert.deepEqual(sourceResourceFacts(catalogSource,{blockers:resourceBlockers}),integratedCatalog.resourceFactSources,
    'An unresolved command path must not stop the next owner in the batch');
  assert.throws(()=>sourceResourceFacts(commandSource),/Unresolved external resource path/);
  const commandAssembly=assembleRecordStateOwner(commandSource,catalog,{id:'test.command-resource',
    xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
  assert.equal(commandAssembly.coverage.complete,false);
  assert.deepEqual(commandAssembly.coverage.blockers.filter(row=>row.reason==='unresolved-resource-path'),resourceBlockers);
  assert.ok(commandAssembly.owner.compose.some(row=>row.use==='state'),
    'A section-only history fragment must remain attached even without an ordinary value property');
  assert.deepEqual(commandAssembly.resourceFactSources,[]);
  const twoPaths=[];
  assert.deepEqual(sourceResourceFacts(extraction.entries.find(row=>row.symbol==='MetadataReportRules'),
    {blockers:twoPaths}),[]);
  assert.deepEqual(twoPaths.map(row=>row.properties),[['objectModule'],['managerModule']],
    'The report must list every blocked property, not only the first thrown exception');


  const unreviewedResource=structuredClone(catalogSource);
  unreviewedResource.properties.find(row=>row.name==='objectModule').parameters.xmlPath='Ext/Changed.bsl';
  assert.throws(()=>sourceResourceFacts(unreviewedResource,{blockers:[]}),/Unreviewed external resource registration/,
    'Collecting known migration blockers must not mask unreviewed registrations');
  assert.ok(integratedCatalog.coverage.assembled.includes('objectModule'));
  for(const name of ['objectModule','managerModule'])
    assert.ok(integratedCatalog.coverage.stateContracts.find(row=>row.property===name).attached,
      'External resource routing must also mount its declared state section');
  assert.equal(integratedCatalog.state.module.value.fields.filter(row=>row.name==='section_extend').length,1);
  assert.ok(!integratedCatalog.coverage.blockers.some(row=>row.properties?.includes('objectModule')&&row.reason==='unreviewed-attachment-parameters'));
  for(const [name,index] of Object.entries(operation.indexRequirements.bindings))
    assert.equal(integratedCatalog.indexRequirements.bindings[`attributes_${name}`],index,
      'The complete owner keeps all prepared providers of its attached collection');

  const renamedRegistration=assembleRecordStateOwner(child,catalog,
    {id:'test.renamed-registration',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
  assert.deepEqual(renamedRegistration.coverage.assembled,registeredChild.coverage.assembled);
  execFileSync('node',['tools/rules-migration/src/record-owner-operation.mjs','--check']);
  execFileSync('node',['tools/rules-migration/src/record-owner-file-operation.mjs','--check']);
  const published=JSON.parse(readFileSync('tests/migration/catalog-attribute-owner-coverage.json','utf8'));
  assert.deepEqual(published.collections,[{owner:'MetadataCatalogRules',property:'attributes',
    fragment:'metadata.catalog-attribute.collection.MetadataCatalogRules.attributes',
    probe:'metadata.catalog-attribute.collection.MetadataCatalogRules.attributes.probe',
    indexProviders:operation.indexRequirements.bindings}]);
  assert.ok(candidateCatalog().catalog.has(published.collections[0].fragment),
    'Source collection mounting must be reproducible declaration data, not only test setup');
  const savedCatalog=candidateCatalog().catalog,registration=published.collections[0];
  const restoredOwner=assembleRecordStateOwner(catalogSource,savedCatalog,{
    id:'test.restored-catalog',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses',
    attachments:[{alias:registration.property,properties:[registration.property],
      module:savedCatalog.get(registration.fragment),indexProviders:registration.indexProviders}],
  });
  assert.ok(!restoredOwner.indexRequirements.missing.some(name=>name.startsWith('attributes_')),
    'Persisted collection registration retains its preparation providers');
  assert.deepEqual(restoredOwner.indexRequirements.missing,[],
    'Own-or-common form links also declare their root-index provider');
  const childHistory=numericOwnerFragment('test.child-history',['md:Attribute'],[],catalog,[],child);
  childHistory.inputs.component={type:{kind:'scalar',scalar:'text'}};
  const childBase=ownerBaseState(childHistory,child,{id:'test.child-base',catalog});
  assert.throws(()=>ownerBaseState(childHistory,{...child,propertyStates:[]},{catalog}),/registered property or service policy/);
  assert.equal(childBase.presence.find(row=>row.target.field==='history').xml.canonical[0].form,'empty-element');
  assert.deepEqual(childBase.representations.xml.fields.find(row=>row.field==='base').path,
    ['md:Attribute','md:Properties','md:ExtendedConfigurationObject']);
  assert.equal(childBase.representations.yaml.fields.find(row=>row.field==='state').key,
    'ОбъектРасширяемойКонфигурации');
  const baseOrder=sourceOwnerFieldOrder(childBase,child,new Map([...catalog,[childBase.id,childBase]]));
  assert.deepEqual(baseOrder,['history','base'],
    'History precedes Properties; a service path keeps its source anchor without a phantom property');
  assert.equal(child.properties.some(row=>row.name==='extendedConfigurationObject'),false,
    'A service relation must not manufacture a registered source property');
  const childBefore=structuredClone(child);
  const childAssembly=assembleSourceOwner(child,catalog,{id:'test.complete-child',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
  assert.throws(()=>assembleSourceOwner(child,catalog,{id:'test.child-detached-type',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses',
    attachments:[{alias:'state',properties:['type'],module:grouped.module}]}),/External owner dependency.*type/,
    'A detached state field must not leave FillValue or ChoiceForm pointing at an undeclared sibling');
  const stateCatalog=new Map([...catalog,...grouped.declarations.map(row=>[row.id,row])]);
  const viewed=assembleSourceOwner(child,stateCatalog,{id:'test.child-viewed',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses',
    attachments:[{alias:'state',properties:['type'],module:grouped.module,fieldViews:grouped.fieldViews}]});
  assert.equal(viewed.coverage.assembled.length,33);
  assert.deepEqual(viewed.coverage.pending,[]);
  assert.ok(viewed.owner.compose.some(part=>Object.values(part.bind??{}).some(binding=>binding.field==='type')),
    'The sibling view captures the original state field, not a second external context');
  assert.ok(!Object.keys(viewed.owner.inputs).some(name=>name.includes('stateView')));
  const contextualAssembly=assembleSourceOwner(child,catalog,{id:'test.contextual-child',
    xmlNamespace:'http://v8.1c.ru/8.3/MDClasses',extensionContext:{adopted:'adopted',component:'component'}});
  assert.deepEqual(contextualAssembly.owner.inputs.adopted,{type:{kind:'scalar',scalar:'boolean'}});
  const contextualOrdinary=contextualAssembly.modules.find(row=>row.value.fields.some(field=>field.name==='objectBelonging'));
  assert.deepEqual(contextualOrdinary.presence.find(row=>row.target.field==='objectBelonging').yaml.default,
    {if:{input:'adopted'},then:{literal:'Adopted'},else:{literal:'Native'}});
  assert.ok(contextualOrdinary.presence.find(row=>row.target.field==='synonym').yaml.missing.denotes.if.input==='adopted');
  assert.ok(contextualAssembly.modules.some(row=>row.compose?.some(part=>
    part.bind?.adopted?.input==='adopted' && part.bind?.component?.input==='component')),
    'Context reaches nested composition parts as declared input bindings');
  assert.deepEqual(contextualOrdinary.presence.find(row=>row.target.field==='objectBelonging').xml,
    childAssembly.modules.find(row=>row.value.fields.some(field=>field.name==='objectBelonging'))
      .presence.find(row=>row.target.field==='objectBelonging').xml,
    'The hidden context changes reconstruction, not the normal XML header form');
  assert.equal(childAssembly.coverage.assembled.length,33);
  assert.deepEqual(childAssembly.coverage.pending,[]);
  assert.deepEqual(child,childBefore);
  assert.equal(childAssembly.coverage.complete,false,'State attachment is still required; ordinary coverage is not full acceptance');
  assert.ok(childAssembly.coverage.blockers.some(row=>row.reason==='owner-state-assembly-required'));
  assert.ok(Object.values(childAssembly.owner.inputs).every(input=>!Object.hasOwn(input,'index')));
  for(const module of childAssembly.modules.filter(row=>row.kind==='fragment'))
    for(const field of module.representations.xml.fields)
      assert.equal(field.path[0],'md:Attribute');
  assert.throws(()=>assembleSourceOwner(child,catalog,{id:'test.missing-child-namespace'}),/namespace/i);
  const renamedChild=assembleSourceOwner({...child,itemType:'MetadataRenamedChild'},catalog,
    {id:'test.renamed-child',xmlNamespace:'urn:test:children'});
  for(const module of renamedChild.modules.filter(row=>row.kind==='fragment')) {
    assert.equal(module.namespaces.md,'urn:test:children');
    for(const field of module.representations.xml.fields)assert.equal(field.path[0],'md:RenamedChild');
  }
  assert.equal(assembled.coverage.assembled.length,52);
  assert.ok(assembled.coverage.pending.some(row=>row.name==='attributes'));
  assert.equal(assembled.coverage.complete,false);
  const connected=characteristicOwnerOperation(extraction,catalog);
  execFileSync(process.execPath,['tools/rules-migration/src/characteristic-owner-operation.mjs','--check'],{stdio:'pipe'});
  execFileSync(process.execPath,['tools/rules-migration/src/characteristic-collections-cases.mjs','--check'],{stdio:'pipe'});
  execFileSync(process.execPath,['tools/rules-migration/src/characteristic-base-state-cases.mjs','--check'],{stdio:'pipe'});
  const description=catalog.get('candidate.characteristic-base-state.type');
  assert.deepEqual(description.value.fields[0].type.bind.property,{literal:'Type'});
  assert.ok(description.constraints.some(row=>row.id==='state-version-type-notify'));
  const stateChoice=catalog.get(description.imports[description.value.fields[0].type.use]);
  assert.equal(stateChoice.representations.yaml.variants.find(row=>row.variant==='notified').form,'tagged');
  assert.equal(connected.coverage.assembled.length,65);
  assert.ok(connected.owner.xmlOrder.indexOf('types')<connected.owner.xmlOrder.indexOf('name'));
  assert.ok(connected.owner.xmlOrder.indexOf('CodeLength')<connected.owner.xmlOrder.indexOf('InputByString'));
  assert.equal(connected.owner.xmlOrder.indexOf('base'),connected.owner.xmlOrder.indexOf('name')+1);
  const localCatalog=new Map([...catalog,...connected.modules.map(module=>[module.id,module])]);
  const explicitOrder={...source,xmlOrder:{status:'static',keys:['extendedConfigurationObject',...source.xmlOrder.keys]}};
  const order=sourceOwnerFieldOrder(connected.owner,explicitOrder,localCatalog);
  assert.ok(order.indexOf('base')<order.indexOf('name'));
  assert.throws(()=>sourceOwnerFieldOrder(connected.owner,{...source,
    xmlOrder:{status:'static',keys:source.xmlOrder.keys.filter(name=>name!=='name')}},localCatalog),/Missing source order anchor/);
  assert.equal(new Set(connected.owner.xmlOrder).size,connected.owner.xmlOrder.length);
  assert.ok(!connected.owner.xmlOrder.includes('state'));
  assert.ok(!connected.owner.xmlOrder.includes('notice'));
  assert.ok(connected.owner.yamlOrder.indexOf('useStandardCommands')<connected.owner.yamlOrder.indexOf('comment'));
  assert.deepEqual(connected.coverage.pending,[]);
  const baseState=connected.modules.find(row=>row['state-relations']?.some(relation=>relation.field==='state'));
  assert.ok(baseState);
  assert.equal(baseState['state-relations'][0].sources.notice.from.if.present.field,'history');
  assert.equal(baseState.value.fields.filter(row=>row.name==='history').length,1);
  const stateType=baseState.value.fields.find(row=>row.name==='type');
  assert.ok(stateType,'Structured type must share the full owner history');
  assert.deepEqual(stateType.type.bind.property,{literal:'Type'});
  assert.ok(baseState.constraints.some(row=>row.id==='state-version-type-notify'));
  assert.ok(baseState.constraints.some(row=>row.id==='state-agrees-type-notified'));
  assert.equal(connected.modules.filter(row=>row.kind==='fragment').flatMap(row=>row.value?.fields??[]).filter(row=>row.name==='type').length,1);
  const connectedStates=localCatalog.get(baseState.imports[stateType.type.use]);
  assert.equal(connectedStates.representations.yaml.variants.find(row=>row.variant==='notified').form,'tagged');
  for(const name of ['Hierarchical','CodeAllowedLength']) {
    assert.ok(baseState.value.fields.some(row=>row.name===name));
    assert.ok(baseState.constraints.some(row=>row.id.includes(`state-agrees-${name[0].toLowerCase()+name.slice(1)}`)));
  }
  assert.equal(connected.owner.inputs.input_baseIds.index,'metadata.base-identities');
  assert.ok(connected.modules.some(row=>row.contributions?.some(part=>part.index==='metadata.base-identities')));
  assert.equal(baseState.representations.yaml.fields.find(row=>row.field==='state').key,'ОбъектРасширяемойКонфигурации');
  assert.ok(connected.modules.some(row=>row.value?.fields?.some(field=>field.name==='predefined')));
  for(const field of ['attributes','tabularSections']) {
    const module=connected.modules.find(row=>row.kind==='fragment'&&row.value?.fields?.some(item=>item.name===field));
    assert.ok(module);
    assert.deepEqual(module.representations.xml.fields[0].path,['md:MetaDataObject','md:ChartOfCharacteristicTypes','md:ChildObjects']);
  }
  assert.ok(connected.coverage.blockers.some(row=>row.reason==='collection-extension-profile-required'));
  assert.equal(connected.coverage.complete,false);
  assert.ok(connected.modules.some(row=>row.value?.fields?.some(field=>field.name==='standardAttributes')));
  const standard=renameOwnerFields(catalog.get('metadata.standard-attribute-owner'),{items:'standardAttributes'});
  assert.equal(standard.representations.xml.fields[0].field,'standardAttributes');
  assert.equal(standard.representations.yaml.fields[0].field,'standardAttributes');

  assert.deepEqual(input,before);
  assert.deepEqual(assembled.owner.compose.find(row=>row.use==='input').bind.name,{input:'input_name'});
  const mounted=assembled.modules.filter(row=>row.id.startsWith('test.characteristic-assembly.ordinary'));
  const codePaths=mounted.flatMap(row=>row.representations.xml.fields).filter(row=>row.path.at(-1)==='md:CodeLength');
  assert.equal(codePaths.length,0);
  const uuid=mounted.flatMap(row=>row.value.fields).find(row=>row.name==='uuid');
  assert.ok(uuid);
  assert.ok(assembled.modules.some(row=>row.compose?.some(part=>part.bind?.ownerName?.input==='ownerName')));
  assert.throws(()=>assembleSourceOwner(source,catalog,{id:'bad',attachments:[
    {alias:'one',properties:['codeLength'],module:input},
    {alias:'two',properties:['codeLength'],module:input},
  ]}),/Duplicate source property/);
  assert.throws(()=>assembleSourceOwner(source,catalog,{id:'bad',attachments:[
    {alias:'one',properties:['unknown'],module:input},
  ]}),/Unknown source property/);

});

test('owner composition carries input type imports without alias collisions',()=>{
  const first={kind:'fragment',id:'first',imports:{kind:'common.first'},inputs:{value:{type:{use:'kind'}}}};
  const second={kind:'fragment',id:'second',imports:{kind:'common.second'},inputs:{value:{type:{use:'kind'}}}};
  const result=composeOwnerFragments('joined',[{alias:'one',fragment:first,bindings:{value:'firstValue'}},
    {alias:'two',fragment:second,bindings:{value:'secondValue'}}]);
  assert.equal(result.imports.one_kind,'common.first');
  assert.equal(result.imports.two_kind,'common.second');
  assert.equal(result.inputs.firstValue.type.use,'one_kind');
  assert.equal(result.inputs.secondValue.type.use,'two_kind');
});

test('owner composition reuses equivalent imported input types',()=>{
  const first={kind:'fragment',id:'first',imports:{root:'common.path-root'},inputs:{ownerRoot:{type:{use:'root'}}}};
  const second={kind:'fragment',id:'second',imports:{kind:'common.path-root'},inputs:{ownerRoot:{type:{use:'kind'}}}};
  const result=composeOwnerFragments('joined',[
    {alias:'first',fragment:first,bindings:{ownerRoot:'ownerRoot'}},
    {alias:'second',fragment:second,bindings:{ownerRoot:'ownerRoot'}},
  ]);
  assert.deepEqual(Object.keys(result.inputs),['ownerRoot']);
  assert.deepEqual(result.compose.map(part=>part.bind.ownerRoot),[{input:'ownerRoot'},{input:'ownerRoot'}]);
});

test('owner record merge writes shared XML parents once',()=>{
  const first={kind:'fragment',id:'forms',imports:{link:'common.form-link'},namespaces:{md:'urn:md'},
    inputs:{owner:{type:{kind:'scalar',scalar:'text'}}},value:{kind:'record',fields:[{name:'form',type:{use:'link'}}]},
    representations:{xml:{kind:'record',fields:[{field:'form',path:['md:Root','md:Properties','md:Form']}]},yaml:{kind:'mapping',fields:[{field:'form',key:'Форма'}]}}};
  const second={kind:'fragment',id:'fields',imports:{fields:'common.metadata-fields'},namespaces:{md:'urn:md'},
    inputs:{root:{type:{kind:'scalar',scalar:'text'}}},value:{kind:'record',fields:[{name:'dataLockFields',type:{use:'fields'}}]},
    representations:{xml:{kind:'record',fields:[{field:'dataLockFields',path:['md:Root','md:Properties','md:DataLockFields']}]},yaml:{kind:'mapping',fields:[{field:'dataLockFields',key:'ПоляБлокировкиДанных'}]}}};
  const result=mergeOwnerFragments('merged',[first,second]);
  assert.deepEqual(result.value.fields.map(field=>field.name),['form','dataLockFields']);
  assert.deepEqual(result.representations.xml.fields.map(field=>field.path.at(-1)),['md:Form','md:DataLockFields']);
  assert.deepEqual(Object.keys(result.inputs),['owner','root']);
  assert.throws(()=>mergeOwnerFragments('bad',[first,first]),/Duplicate/);
});

test('owner record merge retains constraints and state relations without sharing mutable data',()=>{
  const availability={notified:{input:'adopted'}};
  const history=stateHistoryEntries({field:'description',property:'type',xml:'Type',availability});
  const groupedHistory=stateHistoryEntries({field:'description',property:'type',xml:'Type',modes:[{variant:'grouped',mode:'MultiState'}]});
  assert.equal(groupedHistory.defaults.length,1);
  assert.equal(groupedHistory.defaults[0].then.sequence[0].record.mode.literal,'MultiState');
  assert.equal(groupedHistory.constraints[0].assert.eq[0].isVariant.variant,'grouped');
  assert.equal(history.defaults[1].then.sequence[0].record.name.literal,'Type');
  assert.deepEqual(history.defaults[1].if.and[0],{isVariant:{value:{field:'description'},variant:'notified'}});
  assert.deepEqual(history.constraints[1].when.and[1],{input:'adopted'});
  history.defaults[1].if.and[1].input='changed';
  assert.deepEqual(history.constraints[1].when.and[1],availability.notified);
  const part=name=>({kind:'fragment',id:name,imports:{},inputs:{},value:{kind:'record',fields:[{name,type:{kind:'scalar',scalar:'text'}}]},
    representations:{xml:{kind:'record',fields:[{field:name,path:[name]}]},yaml:{kind:'mapping',fields:[{field:name,key:name}]}},
    constraints:[{id:'check-'+name,assert:{present:{field:name}}}],
    'state-relations':[{field:name,sources:{base:{present:{literal:name}}},states:{default:['base']}}]});
  const first=part('first'),second=part('second');
  const merged=mergeOwnerFragments('all',[first,second]);
  assert.deepEqual(merged.constraints,[...first.constraints,...second.constraints]);
  assert.deepEqual(merged['state-relations'],[...first['state-relations'],...second['state-relations']]);
  first.constraints.push({id:'row-selector',assert:{eq:[
    {get:{of:{field:'first'},field:'first'}},{literal:'x'},
  ]}});
  const renamed=renameOwnerFields(first,{first:'ownerField'});
  assert.equal(renamed.constraints[0].assert.present.field,'ownerField');
  assert.deepEqual(renamed.constraints[1].assert.eq[0],{get:{of:{field:'ownerField'},field:'first'}});
  assert.equal(renamed['state-relations'][0].field,'ownerField');
  assert.throws(()=>renameOwnerFields(merged,{first:'second'}),/Duplicate renamed/);

  merged.constraints[0].id='changed';
  assert.equal(first.constraints[0].id,'check-first');
  second.constraints[0].id='check-first';
  assert.throws(()=>mergeOwnerFragments('bad',[first,second]),/Duplicate owner constraint/);
});

// Partition ownership is a separate contract from conversion behaviour.
test('file declaration partitions preserve unique shared ownership and reject conflicts',()=>{
  const shared={id:'sample.shared',kind:'value'},first={id:'sample.first'},second={id:'sample.second'};
  const profiles=[{}, {declarationFile:'rust/declarations/objects/sample-next.generated.yaml'}];
  const grouped=partitionFileDeclarations([{modules:[first,shared]},{modules:[second,shared]}],profiles,new Map());
  assert.deepEqual([...grouped.values()],[[first,shared],[second]]);
  assert.throws(()=>partitionFileDeclarations([{modules:[shared]},{modules:[{...shared,kind:'object'}]}],profiles,new Map()),/Conflicting shared declaration/);
});
