// Researched source contract: enumValues is a collection of named values.
// Emit ordinary index contributions; no metadata names enter the Rust runtime.
export function attachOwnerMembership(emission) {
  const result=emission.results[0],context=result.ownerRequirements;
  if(!context)return;
  if(context.ownerFactRole!=='enumValues' || typeof context.configurationIndexUidSegment!=='string')return;
  const owner=emission.modules[2];
  const identity=owner.contributions?.find(c=>c.index==='metadata.own-identities');
  if(!identity?.key?.record?.name)throw new Error('Owner membership requires a declared named identity');
  const {component,owner:parent,name}=identity.key.record;
  owner.contributions.push(
    {index:'metadata.owner-members',forEach:structuredClone(identity.forEach),
      key:{record:{component,owner:parent,role:{literal:context.ownerFactRole},name}},value:name},
    {index:'metadata.owner-member-identities',forEach:structuredClone(identity.forEach),
      key:{record:{component,owner:parent,segment:{literal:context.configurationIndexUidSegment},name}},value:identity.value});
  result.ownerContributions=structuredClone(context);
  delete result.ownerRequirements;
}
