import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {conditionalPathTemplate} from '../src/conditional-path-template.mjs';

test('conditional resource paths are read as data for all external source command families',()=>{
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  for(const [symbol,folder] of [
    ['MetadataExternalDataSourceCubeCommandRules','Cubes'],
    ['MetadataExternalDataSourceTableCommandRules','Tables'],
    ['MetadataExternalDataSourceDimensionTableCommandRules','DimensionTables'],
  ]) {
    const owner=extraction.entries.find(entry=>entry.symbol===symbol);
    const source=owner.properties.find(property=>property.name==='commandModule').parameters.xmlPath.$unresolved.expression;
    assert.deepEqual(conditionalPathTemplate(source),{
      optionalInput:'parentName',
      absent:['Commands',{input:'name'},'Ext','CommandModule.bsl'],
      present:[folder,{input:'parentName'},'Commands',{input:'name'},'Ext','CommandModule.bsl'],
    });
  }
});

test('conditional path reader rejects code and unreviewed conditions',()=>{
  for(const source of [
    '({name,parentName}) => parentName ? call() : `Commands/${name}/Ext/Module.bsl`',
    '({name,parentName}) => parentName === undefined ? `Commands/${name}/Ext/Module.bsl` : `../${parentName}/Commands/${name}/Ext/Module.bsl`',
    '({name,parentName}) => other === undefined ? `Commands/${name}/Ext/Module.bsl` : `Cubes/${parentName}/Commands/${name}/Ext/Module.bsl`',
  ])assert.equal(conditionalPathTemplate(source),undefined);
});

test('reviewed conditional path selects a reusable resource fragment',async()=>{
  const {readyAttachment}=await import('../src/ready-attachment.mjs');
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const property=extraction.entries.find(entry=>entry.symbol==='MetadataExternalDataSourceCubeCommandRules').properties.find(item=>item.name==='commandModule');
  const profiles=JSON.parse(readFileSync('tools/rules-migration/profiles/ready-attachments.json','utf8'));
  const catalog=new Map([['fragment.command-module-with-parent-resource',{inputs:{name:{type:{kind:'scalar',scalar:'text'}},parentName:{type:{kind:'scalar',scalar:'text'}},container:{type:{kind:'scalar',scalar:'text'}}}}]]);
  const result=readyAttachment(property,catalog,profiles);
  assert.equal(result.status,'ready',JSON.stringify(result));
  assert.deepEqual(result.compose.bind.container,{literal:'Cubes'});
  assert.deepEqual(Object.keys(result.inputs).sort(),['name','parentName']);
});

test('candidate resource examples cover both branches of the declared path',async()=>{
  const {fileResourceCases}=await import('../src/file-resource-cases.mjs');
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const owner=extraction.entries.find(entry=>entry.symbol==='MetadataExternalDataSourceCubeCommandRules');
  const cases=fileResourceCases({entries:[owner]},[{path:owner.path,symbol:owner.symbol,property:'commandModule',status:'ready',candidate:'candidate'}]);
  assert.equal(cases.length,2);
  assert.deepEqual(cases.map(item=>item.resources[0].xml),[
    ['Cubes','example','Commands','example','Ext','CommandModule.bsl'],
    ['Commands','example','Ext','CommandModule.bsl'],
  ]);
  assert.deepEqual(cases.map(item=>item.inputs.parentName),['example','']);
});
