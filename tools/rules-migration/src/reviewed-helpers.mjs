import { createHash } from 'node:crypto';
import { location } from './syntax.mjs';

const fragmentSource = 'packages/rules/metadata/commonObjects/metadataRuleFragment.ts';
const fragmentHash = 'd7e8bb8eeb35a443bb04ebc7fa61f357903476cadbae196b6e1c03f251a3a315';

// Mirrors assertExactFragmentKeys; unknown input or changed implementation is never assumed valid.
export function fragmentValue(order, properties, source) {
  const fail = reason => ({kind:'unknown', reason, source});
  if (order?.kind !== 'array' || properties?.kind !== 'object' || !properties.complete) return fail('unknown-fragment-input');
  if (order.values.some(v => v.kind !== 'scalar' || typeof v.value !== 'string')) return fail('unknown-fragment-order');
  const keys = order.values.map(v => v.value);
  if (new Set(keys).size !== keys.length || keys.length !== properties.fields.size || keys.some(k => !properties.fields.has(k)))
    return fail('invalid-fragment-keys');
  return {kind:'object', complete:true, blockers:[], fragments:[], overrides:[], fields:new Map([
    ['xmlOrder', {value:order, source}], ['properties', {value:properties, source}],
  ])};
}

export function composedValue(base, fragments, source) {
  const fail=reason=>({kind:'unknown',reason,source});
  if(base?.kind!=='object' || !base.complete) return fail('unknown-composition-input');
  const fields=new Map(), order=[], origins=[];
  for(const fragment of fragments) {
    if(fragment?.kind!=='object' || !fragment.complete) return fail('unknown-composition-input');
    const keys=fragment.fields.get('xmlOrder')?.value, properties=fragment.fields.get('properties')?.value;
    const checked=fragmentValue(keys,properties,source);
    if(checked.kind==='unknown') return checked;
    for(const key of keys.values) {
      if(fields.has(key.value))return fail('duplicate-composed-property');
      order.push(key); fields.set(key.value,properties.fields.get(key.value));
    }
    origins.push(...(properties.fragments??[]));
  }
  return {...base,fields:new Map([...base.fields,
    ['xmlOrder',{value:{kind:'array',values:order},source}],
    ['properties',{value:{kind:'object',fields,complete:true,blockers:[],overrides:[],fragments:origins},source}],
  ])};
}

export function reviewedHelper(node, args) {
  if (location(node).path !== fragmentSource || !['metadataRuleFragment','composeMetadataItemRule'].includes(node.name?.text)) return undefined;
  const source = location(node);
  if (createHash('sha256').update(node.getSourceFile().text).digest('hex') !== fragmentHash)
    return {kind:'unknown', reason:'reviewed-helper-changed', source};
  return node.name.text === 'composeMetadataItemRule' ? composedValue(args[0],args.slice(1),source) : fragmentValue(args[0], args[1], source);
}
