import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonicalYamlXmlEnum} from '../src/canonical-xml-enum.mjs';

test('canonical XML labels derive original accepted spellings from their source',()=>{
  const projected=canonicalYamlXmlEnum({enum:{A:'А',B:{yaml:'Б',xml:'Other',accept:['B','Б']}}},'test.labels');
  assert.deepEqual(projected.enum,{A:{yaml:'А',xml:'А',accept:['A']},B:{yaml:'Б',xml:'Б',accept:['Other','B']}});
});
