import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inventory } from '../src/inventory.mjs';
import { cycles } from '../src/summary.mjs';

test('inventory preserves provenance, overrides, unresolved expressions and test contracts', () => {
  const sources = {
    'common.ts': 'export const base = { visible: booleanRule({defaultValueXML: true}) }; export const cycle = other; const other = cycle;',
    'rules.ts': `import { base as shared } from './common';
      export const props = {...shared, visible: booleanRule({defaultValueXML: false}), name: stringRule({defaultValue: ({name}) => name})};
      export const Rules = { properties: props, child: { properties: { nested: numberRule({}) } } } as const satisfies ExternalRule;
      export const Copied = {...Rules.properties}; export const Unknown = {...missing};
      const Override = {properties: {old: 1}, ...{properties: {new: 2}}} as const satisfies ExternalRule;
      const FromOverride = {...Override.properties};`,
    'rules.test.ts': `import { Rules as subject } from './rules';
      it.each([[1, 2], [3, 4]])('pairs', (a, b) => { expect(subject).toEqual({a, b}); });
      test('literal', () => { expect('x').toBe('x'); });`,
  };
  const result = inventory(sources);
  const rules = result.files.find(f => f.path === 'rules.ts');
  assert.deepEqual(rules.imports[0].bindings, [{local: 'shared', imported: 'base'}]);
  const props = rules.objects.find(o => o.name === 'props');
  assert.deepEqual(props.fields.map(f => f.name), ['visible', 'name']);
  assert.equal(props.overrides[0].name, 'visible');
  assert.equal(props.fields[0].source.path, 'rules.ts');
  assert.deepEqual(rules.objects.find(o => o.name === 'Copied').fields.map(f => f.name), ['visible', 'name']);
  assert.deepEqual(rules.objects.find(o => o.name === 'FromOverride').fields.map(f => f.name), ['new']);
  assert.ok(rules.objects.some(o => o.fields.some(f => f.name === 'nested')));
  assert.ok(rules.blockers.some(b => b.reason === 'unresolved-spread'));
  assert.ok(rules.expressions.some(e => e.kind === 'ArrowFunction'));
  assert.ok(result.files[0].blockers.some(b => b.reason === 'cyclic-reference'));
  const tests = result.files.find(f => f.path === 'rules.test.ts').tests;
  assert.equal(tests.length, 2);
  assert.equal(tests[0].tableRows, 2);
  assert.equal(tests[0].assertions[0].matcher, 'toEqual');
  assert.equal(tests[0].extraction, 'requires-review');
  assert.equal(tests[1].assertions[0].expected, "'x'");
  assert.equal(tests[1].extraction, 'literal-candidate');
  assert.deepEqual(inventory(sources), result);
  assert.deepEqual(cycles(new Map([['a', new Set(['b'])], ['b', new Set(['a'])], ['c', new Set(['c'])], ['d', new Set(['a'])]])), [['a', 'b'], ['c']]);
});
