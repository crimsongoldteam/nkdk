import { sourceContract } from '../src/source-contract.mjs';
import { propertyContractSignature } from '../src/property-contract.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emitCandidates } from '../src/emit.mjs';
import { safeUpdate } from '../src/candidate-output.mjs';
import { mapProperty, METADATA_ATTRIBUTE_TYPE_DESCRIPTION_TYPES } from '../src/mappings.mjs';
import { checkSnapshot } from '../src/source-snapshot.mjs';
import { candidateDiff } from '../src/candidate-diff.mjs';
import { candidateCatalog } from '../src/candidate-catalog.mjs';
import { readFileSync } from 'node:fs';
import { prepareCollectionProperty } from '../src/collection-property.mjs';
import { sourceProgram } from '../src/source-program.mjs';
import { evaluator, serialize } from '../src/static-value.mjs';
import { ts } from '../src/syntax.mjs';

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
  const attributeUuid=mapProperty({...property,name:'uuid',parameters:{
    type:'uuid',xml:'_uuid',evaluateWhenYAMLMissing:true,xmlOnly:true,toYAML:false,fromYAML:false,
  }},new Map([['common.uuid',{inputs:{}}]]));
  assert.equal(attributeUuid.status,'candidate');
  assert.equal(attributeUuid.identityProjection,true);
  const metadataLinkCatalog=new Map([
    ['common.metadata-form-link',{id:'common.metadata-form-link',inputs:{roots:{type:{kind:'index'}},forms:{type:{kind:'index'}}}}],
    ['common.owner-attribute-link',{id:'common.owner-attribute-link',inputs:{ownerRoot:{type:{kind:'scalar',scalar:'text'}},ownerName:{type:{kind:'scalar',scalar:'text'}},attributes:{type:{kind:'sequence'}}}}],
  ]);
  const choiceForm=mapProperty({...property,name:'choiceForm',parameters:{type:'MetadataItemLink',yaml:'ФормаВыбора',xml:'ChoiceForm',xmlParents:['Properties'],defaultValueXMLRaw:'',metadataTarget:{kind:'member',owner:'type',typeProperty:'type',memberKinds:['Form']}}},metadataLinkCatalog);
  assert.equal(choiceForm.id,'common.metadata-form-link');
  assert.deepEqual(Object.keys(choiceForm.inputs),['roots','forms']);
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
  const metadataValueCatalog=new Map([
    ['common.metadata-value',{id:'common.metadata-value',inputs:{onlyStringType:{type:{kind:'scalar',scalar:'boolean'}}}}],
    ['common.fill-value-profile',fillProfile],
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
  assert.equal(orphanValue.entries[0].properties[0].reason,'sibling-expression-required');
  assert.equal(orphanValue.entries[0].projections.length,0);
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
