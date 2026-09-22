// A declared named collection contributes owner membership with its source role.
// Remaining operation routing stays explicit until a project adapter binds it.
export function attachOwnerMembership(emission) {
  const result=emission.results[0],context=result.ownerRequirements;
  if(!context)return;
  if(typeof context.ownerFactRole!=='string')return;
  const owner=emission.modules[2];
  const identity=owner.contributions?.find(c=>c.index==='metadata.own-identities');
  if(!identity?.key?.record?.name)throw new Error('Owner membership requires a declared named identity');
  const {component,owner:parent,name}=identity.key.record;
  owner.contributions.push({index:'metadata.owner-members',forEach:structuredClone(identity.forEach),
    key:{record:{component,owner:parent,role:{literal:context.ownerFactRole},name}},value:name});
  if(typeof context.configurationIndexUidSegment==='string')owner.contributions.push(
    {index:'metadata.owner-member-identities',forEach:structuredClone(identity.forEach),
      key:{record:{component,owner:parent,segment:{literal:context.configurationIndexUidSegment},name}},value:identity.value});
  const {ownerFactRole,configurationIndexUidSegment,...remaining}=context;
  result.ownerContributions={ownerFactRole,configurationIndexUidSegment};
  if(Object.keys(remaining).length)result.ownerRequirements=remaining;
  else delete result.ownerRequirements;
}
