import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {candidateCatalog,yaml} from '../src/candidate-catalog.mjs';
import {fileEnvelopeOperation} from '../src/file-envelope-operation.mjs';
import {execFileSync} from 'node:child_process';
import * as roots from '../src/file-root-envelope.mjs';

function data(){
 const catalog=candidateCatalog().catalog;
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 const source=extraction.entries.find(row=>row.symbol==='AdditionalIndexRules');
 const value=structuredClone(catalog.get('common.additional-indexes'));
 value.representations.xml=value.representations.xml.content;
 const owner=structuredClone(catalog.get('migration.additional-indexes'));
 owner.representations.xml.fields[0].path=[];
 return {catalog,source,value,owner};
}

test('single collection file envelope comes from rules.ts and preserves the accepted declarations',()=>{
 const {catalog,source,value,owner}=data();
 const result=roots.bindFileRootEnvelope(value,owner,source);
 assert.deepEqual(result.value,catalog.get('common.additional-indexes'));
 assert.deepEqual(result.owner,catalog.get('migration.additional-indexes'));
 assert.equal(owner.representations.xml.fields[0].path.length,0);
 const renamedOwner=structuredClone(owner);
 renamedOwner.namespaces={r:owner.namespaces.x};
 const aliasedValue=structuredClone(value);aliasedValue.namespaces.other=value.namespaces.x;
 const aliased=roots.bindFileRootEnvelope(aliasedValue,renamedOwner,source);
 assert.deepEqual(aliased.owner.representations.xml.fields[0].path,['r:AdditionalIndexes']);
 assert.equal(aliased.value.namespaces.other,value.namespaces.x);
 const changed=structuredClone(source);
 const root=changed.properties.find(row=>row.type==='XMLRoot').parameters;
 root.container='DifferentRoot';root.rootAttributes._version='3.00';
 const newer=roots.bindFileRootEnvelope(value,owner,changed);
 assert.deepEqual(newer.owner.representations.xml.fields[0].path,['x:DifferentRoot']);
 assert.deepEqual(newer.value.representations.xml.attributes,[{name:'version',value:{text:'3.00'}}]);
});

test('file envelope binding rejects unrelated imports, existing paths and ordinary object envelopes',()=>{
 const {source,value,owner}=data();
 const wrong=structuredClone(owner);wrong.imports.indexes='common.unrelated';
 assert.throws(()=>roots.bindFileRootEnvelope(value,wrong,source),/file envelope/);
 const rooted=structuredClone(owner);rooted.representations.xml.fields[0].path=['x:Existing'];
 assert.throws(()=>roots.bindFileRootEnvelope(value,rooted,source),/file envelope/);
 const metadata=structuredClone(source);metadata.properties.find(row=>row.type==='XMLRoot').parameters.isFileRoot=false;
 assert.throws(()=>roots.bindFileRootEnvelope(value,owner,metadata),/file envelope/);
 const wrapped=structuredClone(value);wrapped.representations.xml={kind:'with-attributes',attributes:[],content:wrapped.representations.xml};
 assert.throws(()=>roots.bindFileRootEnvelope(wrapped,owner,source),/file envelope/);
});

for(const profilePath of ['tools/rules-migration/profiles/additional-indexes-envelope.yaml','tools/rules-migration/profiles/predefined-catalog-envelope.yaml','tools/rules-migration/profiles/predefined-characteristic-envelope.yaml','tools/rules-migration/profiles/predefined-calculation-envelope.yaml','tools/rules-migration/profiles/predefined-account-envelope.yaml','tools/rules-migration/profiles/predefined-extension-envelope.yaml'])
test(`checked-in file envelope profile ${profilePath} generates declarations from its registered source`,()=>{
 const profile=yaml.load(readFileSync(profilePath,'utf8'));
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 const result=fileEnvelopeOperation(profile,extraction);
 for(const [role,module] of Object.entries(result))
  assert.deepEqual(module,yaml.load(readFileSync(profile.outputs[role],'utf8')));
 execFileSync(process.execPath,['tools/rules-migration/src/file-envelope-operation.mjs',profilePath,'--check']);
 assert.throws(()=>fileEnvelopeOperation({...profile,format:'unknown'},extraction),/profile/);
 assert.throws(()=>fileEnvelopeOperation({...profile,source:{...profile.source,symbol:'Missing'}},extraction),/registration/);
});

test('standard QName attributes retain the source namespace meaning in generated shells',()=>{
 const {source,value,owner}=data();
 const changed=structuredClone(source);
 const root=changed.properties.find(row=>row.type==='XMLRoot').parameters;
 root.rootAttributes['_xsi:type']='AnyCollection';
 const result=roots.bindFileRootEnvelope(value,owner,changed);
 assert.deepEqual(result.value.representations.xml.attributes,[
  {name:'version',value:{text:'2.20'}},
  {name:'xsi:type',value:{qname:'x:AnyCollection'}},
 ]);
 assert.equal(result.value.namespaces.xsi,'http://www.w3.org/2001/XMLSchema-instance');
 root.rootAttributes['_xsi:type']='unknown:AnyCollection';
 assert.throws(()=>roots.bindFileRootEnvelope(value,owner,changed),/file envelope/);
});

test('ordinary metadata envelopes use the same source attributes without changing composed content',()=>{
 const catalog=candidateCatalog().catalog;
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 const source=extraction.entries.find(row=>row.symbol==='MetadataDocumentJournalRules');
 const owner=catalog.get('metadata.journal');
 assert.deepEqual(roots.bindObjectRootEnvelope(owner,source),owner);
 const changed=structuredClone(source);
 changed.properties.find(row=>row.type==='XMLRoot').parameters.rootAttributes._version='3.00';
 const result=roots.bindObjectRootEnvelope(owner,changed);
 assert.deepEqual(result.representations.xml.attributes,[{name:'version',value:{text:'3.00'}}]);
 assert.deepEqual(result.representations.xml.content,owner.representations.xml.content);
 assert.deepEqual(result.compose,owner.compose);
 const composed=catalog.get('migration.journal-internal-info');
 const bound=roots.bindObjectRootEnvelope(composed,source,undefined,catalog);
 assert.deepEqual(bound.compose,composed.compose);
 assert.deepEqual(bound.representations.xml.content,composed.representations.xml);
 assert.deepEqual(bound.representations.xml.attributes,[{name:'version',value:{text:'2.20'}}]);
 const wrong=structuredClone(source);
 wrong.properties.find(row=>row.type==='XMLRoot').parameters.container='Other';
 assert.throws(()=>roots.bindObjectRootEnvelope(owner,wrong),/envelope/);
});

test('object root binding follows composed declaration paths and namespace URIs',()=>{
 const source={symbol:'NeutralRules',properties:[{status:'static-parameters',parameters:{
  type:'XMLRoot',container:'Container',rootAttributes:{_xmlns:'urn:metadata',_version:'1'},xmlOnly:true}}]};
 const owner={format:'nkdk-declarations/1',kind:'object',id:'test.composed-root',
  namespaces:{md:'urn:metadata'},imports:{body:'test.body'},compose:[{use:'body'}],
  value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
 const body={format:'nkdk-declarations/1',kind:'fragment',id:'test.body',namespaces:{r:'urn:metadata'},
  value:{kind:'record',fields:[{name:'name',type:{kind:'scalar',scalar:'text'}}]},
  representations:{xml:{kind:'record',fields:[{field:'name',path:['r:MetaDataObject','r:Container','r:Name']}]},
   yaml:{kind:'mapping',fields:[{field:'name',key:'Name'}]}}};
 const catalog=new Map([[body.id,body]]);
 const result=roots.bindObjectRootEnvelope(owner,source,undefined,catalog);
 assert.deepEqual(result.representations.xml.attributes,[{name:'version',value:{text:'1'}}]);
 assert.deepEqual(result.compose,owner.compose);
 assert.deepEqual(result.representations.xml.content,owner.representations.xml);
 assert.equal(owner.representations.xml.kind,'record');
 const typedSource=structuredClone(source);
 typedSource.properties[0].parameters.rootAttributes['_xmlns:xsi']='http://www.w3.org/2001/XMLSchema-instance';
 typedSource.properties[0].parameters.rootAttributes['_xsi:type']='ContainerType';
 const inherited=structuredClone(owner);delete inherited.namespaces;
 const typed=roots.bindObjectRootEnvelope(inherited,typedSource,undefined,catalog);
 assert.deepEqual(typed.representations.xml.attributes[1],{name:'xsi:type',value:{qname:'md:ContainerType'}});
 assert.equal(typed.namespaces.md,'urn:metadata');
 assert.throws(()=>roots.bindObjectRootEnvelope(owner,source),/envelope/);
 const wrong=structuredClone(body);
 wrong.namespaces.r='urn:wrong';
 assert.throws(()=>roots.bindObjectRootEnvelope(owner,source,undefined,new Map([[body.id,wrong]])),/envelope/);
 const nested=structuredClone(body);
 nested.representations.xml.fields=[];
 nested.imports={self:nested.id};nested.compose=[{use:'self'}];
 assert.throws(()=>roots.bindObjectRootEnvelope(owner,source,undefined,new Map([[nested.id,nested]])),/envelope/);
});


test('file envelopes reuse namespace meaning when source aliases collide with body aliases',()=>{
 const {source,value,owner}=data();
 const changed=structuredClone(source);
 const attributes=changed.properties.find(row=>row.type==='XMLRoot').parameters.rootAttributes;
 attributes['_xsi:type']='AnyCollection';
 value.namespaces.xsi='urn:body';
 value.namespaces.instance='http://www.w3.org/2001/XMLSchema-instance';
 const bound=roots.bindFileRootEnvelope(value,owner,changed);
 assert.equal(bound.value.namespaces.xsi,'urn:body');
 assert.deepEqual(bound.value.representations.xml.attributes.at(-1),
  {name:'instance:type',value:{qname:'x:AnyCollection'}});
 delete value.namespaces.instance;
 const allocated=roots.bindFileRootEnvelope(value,owner,changed);
 assert.equal(allocated.value.namespaces.xsi,'urn:body');
 assert.equal(allocated.value.namespaces.xsi1,'http://www.w3.org/2001/XMLSchema-instance');
 assert.deepEqual(allocated.value.representations.xml.attributes.at(-1),
  {name:'xsi1:type',value:{qname:'x:AnyCollection'}});
});

test('computed file shells specialize the same source for every supported fixed owner',()=>{
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 const source=extraction.entries.find(row=>row.symbol==='PredefinedRules');
 const {value,owner}=data();
 for(const module of [value,owner])module.namespaces.x='http://v8.1c.ru/8.3/xcf/predef';
 for(const [itemType,type] of [
  ['MetadataCatalog','CatalogPredefinedItems'],
  ['MetadataChartOfAccounts','ChartOfAccountsPredefinedItems'],
  ['MetadataChartOfCharacteristicTypes','PlanOfCharacteristicKindPredefinedItems'],
  ['MetadataChartOfCalculationTypes','CalculationTypePredefinedItems'],
 ]){
  const result=roots.bindFileRootEnvelope(value,owner,source,{ownerMetadataItem:{itemType}});
  assert.deepEqual(result.owner.representations.xml.fields[0].path,['x:PredefinedData']);
  assert.deepEqual(result.value.representations.xml.attributes,[
   {name:'xsi:type',value:{qname:'x:'+type}},{name:'version',value:{text:'2.20'}}]);
  assert.equal(result.value.namespaces.xsi,'http://www.w3.org/2001/XMLSchema-instance');
 }
 const inherited=extraction.entries.find(row=>row.symbol==='ChartOfAccountsPredefinedRules');
 const result=roots.bindFileRootEnvelope(value,owner,inherited,{ownerMetadataItem:{itemType:'MetadataChartOfAccounts'}});
 assert.deepEqual(result.value.representations.xml.attributes,[
  {name:'xsi:type',value:{qname:'x:ChartOfAccountsPredefinedItems'}},
  {name:'version',value:{text:'2.20'}}]);

});


test('file envelope generator creates new outputs and checks both destinations before writing',()=>{
 const temporary=mkdtempSync(join(tmpdir(),'nkdk-file-envelope-'));
 try {
  const profile=yaml.load(readFileSync('tools/rules-migration/profiles/additional-indexes-envelope.yaml','utf8'));
  const path=join(temporary,'profile.yaml');
  const run=()=>execFileSync(process.execPath,['tools/rules-migration/src/file-envelope-operation.mjs',path],{stdio:'pipe'});
  profile.outputs={value:join(temporary,'value.yaml'),owner:join(temporary,'owner.yaml')};
  writeFileSync(path,yaml.dump(profile));
  assert.throws(()=>execFileSync(process.execPath,['tools/rules-migration/src/file-envelope-operation.mjs',path,'--check'],{stdio:'pipe'}));
  assert.equal(existsSync(profile.outputs.value),false);
  run();
  const value=readFileSync(profile.outputs.value,'utf8'),owner=readFileSync(profile.outputs.owner,'utf8');
  assert.equal(yaml.load(value).id,profile.value.id);
  assert.equal(yaml.load(owner).id,profile.owner.id);
  execFileSync(process.execPath,['tools/rules-migration/src/file-envelope-operation.mjs',path,'--check']);
  profile.value.id='common.changed';profile.owner.imports.indexes=profile.value.id;
  profile.outputs.owner=profile.outputs.value;
  writeFileSync(path,yaml.dump(profile));
  assert.throws(run);
  assert.equal(readFileSync(profile.outputs.value,'utf8'),value);
  profile.outputs.owner=temporary+'/./value.yaml';
  writeFileSync(path,yaml.dump(profile));
  assert.throws(run);
  assert.equal(readFileSync(profile.outputs.value,'utf8'),value);
  delete profile.outputs.owner;
  writeFileSync(path,yaml.dump(profile));
  assert.throws(run);
  assert.equal(readFileSync(profile.outputs.value,'utf8'),value);
  assert.equal(readFileSync(join(temporary,'owner.yaml'),'utf8'),owner);
 } finally {rmSync(temporary,{recursive:true,force:true});}
});


test('external file attachment reads owner registration for all four file envelopes',()=>{
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 const cases=[['catalog','MetadataCatalogRules'],['characteristic','MetadataChartOfCharacteristicTypesRules'],['account','MetadataChartOfAccountsRules'],['calculation','MetadataChartOfCalculationTypesRules'],['extension','MetadataCatalogRules']];
 for(const [name,symbol] of cases){
  const profile=yaml.load(readFileSync(`tools/rules-migration/profiles/predefined-${name}-envelope.yaml`,'utf8'));
  profile.attachment={id:`test.${name}`,source:{symbol,path:extraction.entries.find(row=>row.symbol===symbol).path},property:'predefined'};
  profile.owner.inputs.identities.index='test.identities';
  const result=fileEnvelopeOperation(profile,extraction);
  assert.equal(result.attachment.kind,'fragment');
  assert.equal(result.attachment.id,`test.${name}`);
  const expectedInputs=structuredClone(result.owner.inputs);
  delete expectedInputs.identities.index;
  assert.deepEqual(result.attachment.inputs,expectedInputs);
  assert.equal(result.owner.inputs.identities.index,'test.identities');
  const hostProfile={
   id:`test.${name}.owner`,fields:[{field:'name',property:'name',key:'Имя'},
    {field:'belonging',property:'objectBelonging',key:'Принадлежность'}],
   identity:{input:'owner',name:'name',component:'component'},
   conditions:{borrowed:{field:'belonging',equals:'Adopted'}},
  };
  const host=roots.bindExternalFileOwner(result.owner,result.attachment,extraction.entries.find(row=>row.symbol===symbol),hostProfile);
  const header=structuredClone(host);
  header.kind='fragment';header.id='existing.header';
  for(const field of header.value.fields)if(field.name==='belonging')field.name='objectBelonging';
  for(const side of ['xml','yaml'])for(const field of header.representations[side].fields)if(field.field==='belonging')field.field='objectBelonging';
  delete header.compose;delete header.imports;header.inputs={};
  const existing={format:'nkdk-declarations/1',kind:'object',id:'existing.owner',
   imports:{header:header.id},inputs:{identities:{type:{kind:'scalar',scalar:'text'}}},
   constraints:[{id:'existing-check',assert:{present:{field:'name'}}}],
   compose:[{use:'header'}],value:{kind:'record',fields:[]},
   representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
  const connected=roots.attachExternalFileOwner(existing,result.owner,result.attachment,
   extraction.entries.find(row=>row.symbol===symbol),hostProfile,new Map([[header.id,header]]));
  assert.equal(connected.id,existing.id);
  assert.deepEqual(connected.compose[0],existing.compose[0]);
  assert.deepEqual(connected.value,existing.value);
  assert.deepEqual(connected.constraints,existing.constraints);
  assert.deepEqual(connected.inputs.identities,existing.inputs.identities);
  const filePart=connected.compose[1];
  assert.deepEqual(filePart.bind.owner,host.compose[0].bind.owner);
  if(name==='extension')assert.deepEqual(filePart.bind.borrowed,{eq:[{field:'objectBelonging'},{literal:'Adopted'}]});
  assert.notEqual(filePart.bind.identities.input,'identities');
  assert.equal(connected.inputs[filePart.bind.identities.input].index,'test.identities');
  assert.equal(existing.compose.length,1);
  const indexed=structuredClone(result.owner),indexedAttachment=structuredClone(result.attachment);
  indexed.imports.key='common.metadata-name';
  indexed.inputs.identities.type.key={use:'key'};
  indexedAttachment.inputs.identities.type.key={use:'key'};
  const typed=roots.attachExternalFileOwner(existing,indexed,indexedAttachment,
   extraction.entries.find(row=>row.symbol===symbol),hostProfile,new Map([[header.id,header]]));
  const input=typed.inputs[typed.compose[1].bind.identities.input];
  assert.equal(typed.imports[input.type.key.use],'common.metadata-name');
  profile.attachment.host=hostProfile;
  profile.attachment.target={declaration:existing.id,id:'connected.owner'};
  assert.deepEqual(fileEnvelopeOperation(profile,extraction,new Map([[existing.id,existing],[header.id,header]])).connected,{...connected,id:'connected.owner'});
  const missing=structuredClone(profile);delete missing.attachment.target.id;
  assert.throws(()=>fileEnvelopeOperation(missing,extraction,new Map([[existing.id,existing],[header.id,header]])),/target/);
  delete profile.attachment.host;delete profile.attachment.target;
  assert.throws(()=>roots.attachExternalFileOwner(existing,result.owner,result.attachment,
   extraction.entries.find(row=>row.symbol===symbol),hostProfile,new Map()),/context/);
  const wrongRoot=structuredClone(header);wrongRoot.representations.xml.fields[0].path[1]='md:Unrelated';
  assert.throws(()=>roots.attachExternalFileOwner(existing,result.owner,result.attachment,
   extraction.entries.find(row=>row.symbol===symbol),hostProfile,new Map([[header.id,wrongRoot]])),/context/);
  assert.throws(()=>roots.attachExternalFileOwner(connected,result.owner,result.attachment,
   extraction.entries.find(row=>row.symbol===symbol),hostProfile,new Map([[header.id,header],[result.attachment.id,result.attachment]])),/context/);
  const directory={catalog:'Справочник',extension:'Справочник',characteristic:'ПланВидовХарактеристик',account:'ПланСчетов',calculation:'ПланВидовРасчета'}[name];
  assert.deepEqual(host.compose[0].bind.owner,{concat:[{input:'component'},{literal:'/'},{literal:directory+'.'},{field:'name'}]});
  assert.equal(host.inputs.identities.index,'test.identities');
  assert.deepEqual(host.compose[0].bind.identities,{input:'identities'});
  if(name==='extension')assert.deepEqual(host.compose[0].bind.borrowed,{eq:[{field:'belonging'},{literal:'Adopted'}]});
  assert.deepEqual(host.representations.xml.fields[0].path,[...rootsRoute(symbol),'md:Properties','md:Name']);
  const unsupported=structuredClone(extraction.entries.find(row=>row.symbol===symbol));
  unsupported.properties.find(row=>row.name==='name').status='unsupported';
  assert.throws(()=>roots.bindExternalFileOwner(result.owner,result.attachment,unsupported,hostProfile),/context/);
  const duplicate=structuredClone(hostProfile);duplicate.fields.push(duplicate.fields[0]);
  assert.throws(()=>roots.bindExternalFileOwner(result.owner,result.attachment,extraction.entries.find(row=>row.symbol===symbol),duplicate),/context/);
  assert.deepEqual(result.attachment.value,result.owner.value);
  assert.deepEqual(result.attachment.representations.xml.fields,[{field:'items',path:['p:PredefinedData'],file:['Ext','Predefined.xml']}]);
  assert.deepEqual(result.attachment.representations.yaml,{kind:'mapping',fields:[{field:'items',key:'Предопределенные'}]});
  const renamed=structuredClone(extraction);
  const property=renamed.entries.find(row=>row.symbol===symbol).properties.find(row=>row.name==='predefined');
  property.parameters.filePath='Extra/Values.xml';property.parameters.yaml='Значения';
  const other=fileEnvelopeOperation(profile,renamed).attachment;
  assert.deepEqual(other.representations.xml.fields[0].file,['Extra','Values.xml']);
  assert.equal(other.representations.yaml.fields[0].key,'Значения');
  for(const path of ['../outside.xml','/absolute.xml','Ext/../outside.xml','Ext\\outside.xml','Ext//Values.xml']){
   property.parameters.filePath=path;
   assert.throws(()=>fileEnvelopeOperation(profile,renamed),/attachment/);
  }
  profile.attachment.property='missing';
  assert.throws(()=>fileEnvelopeOperation(profile,extraction),/attachment/);
 }
});

function rootsRoute(symbol){
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 const root=extraction.entries.find(row=>row.symbol===symbol).properties.find(row=>row.type==='XMLRoot');
 return ['md:MetaDataObject','md:'+root.parameters.container];
}
