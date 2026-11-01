import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {candidateCatalog} from '../src/candidate-catalog.mjs';
import {assembleSourceElement} from '../src/source-element-assembly.mjs';

const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
const graph=JSON.parse(readFileSync('tests/migration/form-element-links.json','utf8'));
const {catalog}=candidateCatalog();

test('element assembly mounts registration identity and emitted properties without hiding pending children',()=>{
  for(const registration of graph.registrations) {
    const source=extraction.entries.find(entry=>entry.path===registration.item.path && entry.symbol===registration.item.symbol);
    const result=assembleSourceElement(source,registration,catalog,{id:'test.element.'+registration.type,path:[source.itemType]});
    assert.equal(result.owner.kind,'object');
    assert.deepEqual(result.owner.xmlOrder.slice(0,2),['name','id']);
    assert(result.owner.compose.length>=2);
    const identity=result.modules.find(module=>module.id===result.owner.imports.identity);
    assert.deepEqual(identity.representations.xml.fields.map(field=>field.path),[[source.itemType],[source.itemType]]);
    assert.equal(result.coverage.pending.some(row=>row.name==='name'),false);
    assert.equal(result.coverage.complete,result.coverage.pending.length===0 && result.coverage.blockers.length===0);
    assert.equal(new Set(result.coverage.assembled).size,result.coverage.assembled.length);
    assert.equal(result.coverage.assembled.length+result.coverage.pending.length+(result.coverage.notSerialized?.length??0),source.properties.length);
  }
});

test('runtime-only enumeration without a representation is accounted for, not silently converted or lost',()=>{
  const registration=graph.registrations.find(row=>row.type==='ExtendedTooltip');
  const source=extraction.entries.find(entry=>entry.symbol===registration.item.symbol);
  const options={id:'test.tooltip',path:[source.itemType]};
  const result=assembleSourceElement(source,registration,catalog,options);
  assert.deepEqual(result.coverage.notSerialized,[{name:'type',reason:'runtime-only-no-xml-yaml'}]);
  assert(!result.coverage.pending.some(row=>row.name==='type'));
  assert(!result.modules.some(module=>module.value?.fields?.some(field=>field.name==='type')));
  for(const extra of [{yaml:'Тип'},{xml:'Type'},{implicitValueYAML:'Label'},{defaultValue:'Label'}]) {
    const changed=structuredClone(source);
    Object.assign(changed.properties.find(row=>row.name==='type').parameters,extra);
    const checked=assembleSourceElement(changed,registration,catalog,options);
    assert(checked.coverage.pending.some(row=>row.name==='type'));
    assert.deepEqual(checked.coverage.notSerialized,[]);
  }
});

test('element assembly rejects a changed name contract, wrong source link, or unchecked XML route',()=>{
  const registration=graph.registrations[0];
  const source=extraction.entries.find(entry=>entry.symbol===registration.item.symbol);
  const options={id:'test.element',path:['AutoCommandBar']};
  for(const mutate of [value=>value.properties.find(row=>row.name==='name').parameters.required=true,
    value=>value.properties.find(row=>row.name==='name').parameters.fromXML=true,
    value=>value.symbol='Other',
    value=>value.properties.push({...structuredClone(value.properties[0]),name:'id'}),
    value=>value.properties.push(structuredClone(value.properties[0]))]) {
    const changed=structuredClone(source);mutate(changed);
    assert.throws(()=>assembleSourceElement(changed,registration,catalog,options));
  }
  for(const path of [[],['../bad'],undefined])assert.throws(()=>assembleSourceElement(source,registration,catalog,{...options,path}));
  for(const xmlNamespace of ['',false,{}])assert.throws(()=>assembleSourceElement(source,registration,catalog,{...options,xmlNamespace}));
});

test('element placement applies the declared default namespace to identity and ordinary XML routes',()=>{
  const registration=graph.registrations[0];
  const source=extraction.entries.find(entry=>entry.symbol===registration.item.symbol);
  const result=assembleSourceElement(source,registration,catalog,{id:'test.qualified',path:[source.itemType],xmlNamespace:'urn:placement'});
  for(const module of result.modules.filter(module=>module.kind==='fragment')) {
    assert.equal(module.namespaces.md,'urn:placement');
    for(const field of module.representations.xml.fields)for(const part of field.path)
      assert(part.includes(':'),'Unqualified XML path in a qualified owner');
  }
});

// Reusable bodies must keep relative routes; the reference supplies placement once.
test('value element assembly keeps identity at the relative root',()=>{
  for(const registration of graph.registrations) {
    const source=extraction.entries.find(entry=>entry.symbol===registration.item.symbol);
    const result=assembleSourceElement(source,registration,catalog,
      {id:'test.relative.'+registration.type,kind:'value',path:[],xmlNamespace:'urn:placement'});
    assert.equal(result.owner.kind,'value');
    for(const part of result.owner.compose.filter(part=>part.use!=='identity'))
      if(Object.hasOwn(part.bind,'ownerName'))assert.deepEqual(part.bind.ownerName,
        {get:{of:{variantValue:{value:{field:'name'},variant:'explicit'}},field:'name'}});
    const identity=result.modules.find(module=>module.id===result.owner.imports.identity);
    assert.deepEqual(identity.representations.xml.fields.map(field=>field.path),[[],[]]);
    for(const module of result.modules.filter(module=>module.kind==='fragment'))
      for(const field of module.representations.xml.fields)
        assert(!field.path.includes('md:'+source.itemType));
  }
});
