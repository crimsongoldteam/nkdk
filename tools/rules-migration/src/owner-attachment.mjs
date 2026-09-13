import {isDeepStrictEqual} from 'node:util';

export function verifyOwnerAttachment(profile,catalog) {
  const fail=reason=>({status:'blocked',reason});
  const owner=catalog.get(profile.declaration),fragment=catalog.get(profile.fragment);
  if(!owner || !fragment)return fail('missing-owner-or-fragment');
  const bindings=profile.bindings??{},fixed=profile.fixedBindings??{},inputs=fragment.inputs??{};
  if(Object.keys(fixed).some(key=>Object.hasOwn(bindings,key)))return fail('overlapping-input-mapping');
  if(!isDeepStrictEqual([...Object.keys(bindings),...Object.keys(fixed)].sort(),Object.keys(inputs).sort()))return fail('incomplete-input-mapping');
  const expected={...Object.fromEntries(Object.entries(bindings).map(([key,input])=>[key,{input}])),...fixed};
  const allParts=(owner.compose??[]).filter(part=>owner.imports?.[part.use]===profile.fragment);
  const parts=Object.keys(fixed).length?allParts.filter(part=>isDeepStrictEqual(part.bind??{},expected)):allParts;
  if(parts.length!==1)return fail(parts.length?'ambiguous-owner-attachment':'missing-owner-attachment');
  if(Object.keys(parts[0]).some(key=>!['use','bind'].includes(key)))return fail('unreviewed-owner-compose-parameters');
  if(!isDeepStrictEqual(parts[0].bind??{},expected))return fail('owner-binding-mismatch');
  for(const [name,input] of Object.entries(bindings)) {
    const actual=owner.inputs?.[input];
    if(!actual)return fail(`missing-owner-input:${input}`);
    if(actual.index) {
      if(inputs[name].type?.kind!=='index' || profile.indexes?.[input]!==actual.index)return fail(`owner-index-mismatch:${input}`);
    } else if(!isDeepStrictEqual(actual,inputs[name]))return fail(`owner-input-type-mismatch:${input}`);
  }
  return {status:'bound',declaration:owner.id,fragment:fragment.id,bindings,...(Object.keys(fixed).length?{fixedBindings:fixed}:{}), ...(profile.indexes?{indexes:profile.indexes}:{})};
}
