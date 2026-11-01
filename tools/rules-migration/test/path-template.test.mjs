import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pathTemplate} from '../src/path-template.mjs';
test('path templates accept only a bound name and literal safe suffix without executing code',()=>{
  assert.deepEqual(pathTemplate('({ name }: { name: string }) => `${name}/Ext/Help.xml`'),[{input:'name'},'Ext','Help.xml']);
  assert.deepEqual(pathTemplate('({ owner: local }) => `${local}/Files/data.xml`'),[{input:'owner'},'Files','data.xml']);
  assert.deepEqual(pathTemplate('({ name }: { name: string }) => "Commands/" + name + "/Ext/CommandModule.bsl"'),['Commands',{input:'name'},'Ext','CommandModule.bsl']);
  assert.deepEqual(pathTemplate('({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`'),['Commands',{input:'name'},'Ext','CommandModule.bsl']);
  assert.deepEqual(pathTemplate('({ name }: { name: string }) => "Команды/" + name + ".bsl"'),['Команды',{concat:[{input:'name'},{literal:'.bsl'}]}]);
  for(const source of ['({name}) => `${other}/Ext/Help.xml`','({name}) => `${name()}/Ext/Help.xml`','async ({name}) => `${name}/Ext/Help.xml`','({name}) => `${name}/../Help.xml`','({name}) => `${name}/Ext/${name}.xml`','({name = call()}) => `${name}/Ext/Help.xml`'])assert.equal(pathTemplate(source),undefined,source);
});

test('computed Help paths retain the owner root as an explicit migration requirement',async()=>{
  const {readyAttachment}=await import('../src/ready-attachment.mjs');
  const {readFileSync}=await import('node:fs');
  const profiles=JSON.parse(readFileSync(new URL('../profiles/ready-attachments.json',import.meta.url),'utf8'));
  const parameters={type:'Help',externalMetadata:{segment:'Help',placement:'derivedEntry'},filePath:'Ext/Help.xml',nkdkDir:'Справка',xmlPath:{$unresolved:{expression:'({name}) => `${name}/Ext/Help.xml`'}}};
  const result=readyAttachment({status:'contains-expressions',parameters},new Map([['fragment.help',{inputs:{}}]]),profiles);
  assert.equal(result.status,'ready');
  assert.deepEqual(result.sourceRoot,[{input:'name'}]);
  assert.deepEqual(result.xmlSourcePath,[{input:'name'},'Ext','Help.xml']);
  assert.equal(readyAttachment({status:'contains-expressions',parameters:{...parameters,nkdkDir:{$unresolved:{expression:'call()'}}}},new Map(),profiles).status,'blocked');
});

test('computed command module paths match a reviewed resource declaration',async()=>{
  const {readyAttachment}=await import('../src/ready-attachment.mjs');
  const parameters={type:'Module',nkdkPath:{$unresolved:{expression:'({ name }: { name: string }) => "Команды/" + name + ".bsl"'}},xmlPath:{$unresolved:{expression:'({ name }: { name: string }) => "Commands/" + name + "/Ext/CommandModule.bsl"'}}};
  const profile={type:'Module',fragment:'fragment.command-module-resource',parameters:{type:'Module',nkdkPath:{$pathTemplate:['Команды',{concat:[{input:'name'},{literal:'.bsl'}]}]},xmlPath:{$pathTemplate:['Commands',{input:'name'},'Ext','CommandModule.bsl']}}};
  const catalog=new Map([['fragment.command-module-resource',{inputs:{name:{type:{kind:'scalar',scalar:'text'}}}}]]);
  const result=readyAttachment({status:'contains-expressions',parameters},catalog,[profile]);
  assert.equal(result.status,'ready');
  assert.deepEqual(result.compose.bind.name,{input:'name'});
});
