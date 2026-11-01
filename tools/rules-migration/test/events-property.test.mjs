import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mapProperty} from '../src/mappings.mjs';
import {candidateCatalog} from '../src/candidate-catalog.mjs';

const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
const properties=extraction.entries.flatMap(entry=>entry.properties.filter(property=>property.type==='Events'));
const {catalog}=candidateCatalog();

test('all static Events registrations supply their name table as declarations',()=>{
  assert.equal(properties.length,31);
  for(const property of properties){
    const mapped=mapProperty(property,catalog);
    assert.equal(mapped.status,'candidate',JSON.stringify(mapped));
    const rows=mapped.type.bind.eventNames.sequence;
    assert.equal(rows.length,Object.keys(property.parameters.items).length);
    assert.deepEqual(rows[0].record.xml,{literal:Object.keys(property.parameters.items)[0][0].toUpperCase()+Object.keys(property.parameters.items)[0].slice(1)});
    assert.equal(mapped.path.at(-1),'f:Events');
  }
  const property=properties.at(-1);
  for(const items of [{a:'Одинаково',b:'Одинаково'},{a:3},null]) {
    const bad={...property,parameters:{...property.parameters,items}};
    assert.equal(mapProperty(bad,catalog).status,'blocked');
  }
});
