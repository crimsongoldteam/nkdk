import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readyAttachment} from '../src/ready-attachment.mjs';

test('ready attachments preserve fragments and reject unreviewed source parameters',()=>{
  const profile={type:'Example',parameters:{type:'Example',filePath:'Ext/Data.xml'},fragment:'fragment.example'};
  const catalog=new Map([['fragment.example',{id:'fragment.example',inputs:{owner:{type:{kind:'scalar',scalar:'text'}}}}]]);
  const property={status:'static-parameters',parameters:{filePath:'Ext/Data.xml',type:'Example'}};
  const result=readyAttachment(property,catalog,[profile]);
  assert.equal(result.status,'ready');
  assert.deepEqual(result.compose,{use:'ready',bind:{owner:{input:'owner'}}});
  assert.deepEqual(result.inputs,catalog.get(profile.fragment).inputs);
  assert.equal(readyAttachment({...property,parameters:{...property.parameters,extra:true}},catalog,[profile]).reason,'unreviewed-attachment-parameters');
  assert.equal(readyAttachment(property,new Map(),[profile]).reason,'missing-declaration:fragment.example');
  assert.equal(readyAttachment({...property,status:'dynamic'},catalog,[profile]).reason,'requires-expression-mapping');
  assert.equal(readyAttachment(property,catalog,[]),undefined);
  assert.throws(()=>readyAttachment(property,catalog,[profile,profile]),/Ambiguous/);
});

test('owner attachment binding checks actual composition and complete input mapping',async()=>{
  const {verifyOwnerAttachment}=await import('../src/owner-attachment.mjs');
  const fragment={id:'fragment.example',inputs:{source:{type:{kind:'scalar',scalar:'text'}}}};
  const owner={id:'owner',imports:{arbitrary:'fragment.example'},inputs:{context:{type:{kind:'scalar',scalar:'text'}}},compose:[{use:'arbitrary',bind:{source:{input:'context'}}}]};
  const profile={declaration:'owner',fragment:fragment.id,bindings:{source:'context'}};
  const catalog=new Map([[fragment.id,fragment],['owner',owner]]);
  assert.equal(verifyOwnerAttachment(profile,catalog).status,'bound');
  const configured=structuredClone(owner);configured.compose[0].with={mode:true};
  assert.equal(verifyOwnerAttachment(profile,new Map([...catalog,['owner',configured]])).reason,'unreviewed-owner-compose-parameters');
  const broken=structuredClone(owner);broken.compose[0].bind.source.input='missing';
  assert.equal(verifyOwnerAttachment(profile,new Map([...catalog,['owner',broken]])).reason,'owner-binding-mismatch');
  assert.equal(verifyOwnerAttachment({...profile,bindings:{}},catalog).reason,'incomplete-input-mapping');
  broken.compose=[...owner.compose,...owner.compose];
  assert.equal(verifyOwnerAttachment(profile,new Map([...catalog,['owner',broken]])).reason,'ambiguous-owner-attachment');
  broken.compose=[];
  assert.equal(verifyOwnerAttachment(profile,new Map([...catalog,['owner',broken]])).reason,'missing-owner-attachment');
  broken.compose=owner.compose;broken.inputs={context:{type:{kind:'scalar',scalar:'boolean'}}};
  assert.equal(verifyOwnerAttachment(profile,new Map([...catalog,['owner',broken]])).reason,'owner-input-type-mismatch:context');
});

test('fixed routes distinguish repeated fragments and reject ambiguity',async()=>{
  const {verifyOwnerAttachment}=await import('../src/owner-attachment.mjs');
  const fragment={id:'f',inputs:{path:{type:{kind:'sequence',item:{kind:'scalar',scalar:'text'}}}}};
  const fixedBindings={path:{sequence:[{literal:'first.bin'}]}};
  const first={use:'f',bind:fixedBindings},second={use:'f',bind:{path:{sequence:[{literal:'second.bin'}]}}};
  const owner={id:'o',kind:'resources',imports:{f:'f'},compose:[first,second]};
  const catalog=new Map([['o',owner],['f',fragment]]);
  const profile={declaration:'o',fragment:'f',fixedBindings};
  assert.equal(verifyOwnerAttachment(profile,catalog).status,'bound');
  assert.equal(verifyOwnerAttachment({...profile,bindings:{path:'other'}},catalog).reason,'overlapping-input-mapping');
  owner.compose=[second];
  assert.equal(verifyOwnerAttachment(profile,catalog).status,'blocked');
  owner.compose=[first,first];
  assert.equal(verifyOwnerAttachment(profile,catalog).reason,'ambiguous-owner-attachment');
});

test('named owner indexes require explicit matching identity',async()=>{
  const {verifyOwnerAttachment}=await import('../src/owner-attachment.mjs');
  const fragment={id:'f',inputs:{rows:{type:{kind:'index',key:{kind:'scalar',scalar:'text'},value:{kind:'scalar',scalar:'text'}}}}};
  const owner={id:'o',imports:{f:'f'},inputs:{ids:{index:'example.ids'}},compose:[{use:'f',bind:{rows:{input:'ids'}}}]};
  const catalog=new Map([['o',owner],['f',fragment]]);
  const profile={declaration:'o',fragment:'f',bindings:{rows:'ids'}};
  assert.equal(verifyOwnerAttachment(profile,catalog).reason,'owner-index-mismatch:ids');
  assert.equal(verifyOwnerAttachment({...profile,indexes:{ids:'other.ids'}},catalog).reason,'owner-index-mismatch:ids');
  assert.equal(verifyOwnerAttachment({...profile,indexes:{ids:'example.ids'}},catalog).status,'bound');
});

test('reviewed equal source paths connect both Help profiles but keep differing paths blocked',async()=>{
  const {readFileSync}=await import('node:fs');
  const profiles=JSON.parse(readFileSync(new URL('../profiles/ready-attachments.json',import.meta.url),'utf8'));
  const catalog=new Map([['fragment.help',{inputs:{}}]]);
  for(const flags of [{},{toXML:false,fromXML:false}]) {
    const parameters={type:'Help',externalMetadata:{segment:'Help',placement:'derivedEntry'},filePath:'Ext/Help.xml',xmlPath:'Ext/Help.xml',nkdkDir:'Справка',...flags};
    const property={status:'static-parameters',parameters};
    assert.equal(readyAttachment(property,catalog,profiles).status,'ready');
    assert.equal(readyAttachment({...property,parameters:{...parameters,xmlPath:'Elsewhere/Help.xml'}},catalog,profiles).status,'blocked');
    assert.equal(readyAttachment({...property,parameters:{...parameters,unexpected:true}},catalog,profiles).status,'blocked');
  }
});

test('configuration Help keeps its root placement distinct from derived owners',async()=>{
  const {readFileSync}=await import('node:fs');
  const profiles=JSON.parse(readFileSync(new URL('../profiles/ready-attachments.json',import.meta.url),'utf8'));
  const parameters={type:'Help',filePath:'Ext/Help.xml',nkdkDir:'Справка'};
  const catalog=new Map([['fragment.help',{inputs:{}}]]);
  assert.equal(readyAttachment({status:'static-parameters',parameters},catalog,profiles).status,'ready');
  assert.equal(readyAttachment({status:'static-parameters',parameters:{...parameters,externalMetadata:{placement:'ownedEntry',segment:'Help'}}},catalog,profiles).status,'blocked');
});

test('attachment composition preserves primary fields and rejects collisions',async()=>{
  const {composeAttachment}=await import('../src/compose-attachment.mjs');
  const primary={id:'p',imports:{base:'f'},compose:[{use:'base'}],inputs:{name:{type:{kind:'scalar',scalar:'text'}}},value:{kind:'record',fields:[]}};
  const mapped={status:'ready',fragment:'help',inputs:{pages:{type:{kind:'sequence',item:{kind:'scalar',scalar:'text'}}}}};
  const result=composeAttachment(primary,mapped,'joined');
  assert.equal(primary.compose.length,1);
  assert.deepEqual(result.compose[0],primary.compose[0]);
  assert.deepEqual(result.compose[1].bind,{pages:{input:'attachment_pages'}});
  assert.equal(result.imports.attachment,'help');
  assert.throws(()=>composeAttachment({...primary,imports:{attachment:'other'}},mapped,'joined'),/collision/);
  assert.throws(()=>composeAttachment(primary,{status:'blocked'},'joined'),/not ready/);
});

test('fixed fragment inputs are declared once and removed from runtime requirements',async()=>{
  const profile={type:'Binary',parameters:{type:'Binary'},fragment:'file',bindings:{sourcePath:{sequence:[{literal:'Ext'},{literal:'Data.bin'}]}}};
  const catalog=new Map([['file',{inputs:{sourcePath:{type:{kind:'sequence',item:{kind:'scalar',scalar:'text'}}}}}]]);
  const result=readyAttachment({status:'static-parameters',parameters:{type:'Binary'}},catalog,[profile]);
  assert.deepEqual(result.inputs,{});
  assert.deepEqual(result.compose.bind,profile.bindings);
  const {composeAttachment}=await import('../src/compose-attachment.mjs');
  assert.deepEqual(composeAttachment({id:'owner'},result,'joined').compose[0].bind,profile.bindings);
});

test('static module profiles preserve both alternatives and block other routing contracts',async()=>{
  const {readFileSync}=await import('node:fs');
  const {fileResourceCases}=await import('../src/file-resource-cases.mjs');
  const profiles=JSON.parse(readFileSync(new URL('../profiles/ready-attachments.json',import.meta.url),'utf8'));
  const parameters={type:'Module',xmlPath:'Ext/ManagerModule.bsl',nkdkPath:'МодульМенеджера.bsl',externalMetadata:{placement:'derivedEntry',segment:'ManagerModule'}};
  const property={name:'module',type:'Module',status:'static-parameters',parameters};
  const catalog=new Map([['fragment.manager-module-resource',{}]]);
  assert.equal(readyAttachment(property,catalog,profiles).status,'ready');
  for(const change of [{syncArea:{kind:'unknown'}},{xmlPath:'different.bsl'},{xmlPath:{$unresolved:{expression:'choosePath()'}}}]) {
    assert.equal(readyAttachment({...property,parameters:{...parameters,...change}},catalog,profiles).status,'blocked');
  }
  const [result]=fileResourceCases({entries:[{path:'source',symbol:'Owner',properties:[property]}]},[{path:'source',symbol:'Owner',property:'module',status:'ready',candidate:'candidate'}]);
  assert.deepEqual(result.resources,[
    {xml:['Ext','ManagerModule.bsl'],yaml:['МодульМенеджера.bsl']},
    {xml:['Ext','ManagerModule.bin'],yaml:['МодульМенеджера.bin']},
  ]);
  assert.deepEqual(result.resourceGroups,[2]);
});
