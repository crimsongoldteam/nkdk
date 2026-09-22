import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectExecutableFamily} from '../src/family-check.mjs';

test('family check selects only declared acceptance families',()=>{
  const families=[{id:'enum-values',role:'accept-first'},{id:'document-attributes',role:'accept-next'},{id:'form-attribute',role:'requirements'}];
  assert.equal(selectExecutableFamily(families,['--','--family','document-attributes']),'document-attributes');
  assert.equal(selectExecutableFamily(families,['--family','enum-values']),'enum-values');
  assert.throws(()=>selectExecutableFamily(families,['--family','form-attribute']),/not executable/);
  assert.throws(()=>selectExecutableFamily(families,['--family','unknown']),/not executable/);
  assert.throws(()=>selectExecutableFamily(families,[]),/Usage: test:migration-family/);
});
