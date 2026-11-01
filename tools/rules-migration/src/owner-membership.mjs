// A declared named collection contributes owner membership with its source role.
// Remaining operation routing stays explicit until a project adapter binds it.
export function attachOwnerMembership(emission) {
  const result=emission.results[0],context=result.ownerRequirements;
  if(!context)return;
  const role=typeof context.ownerFactRole==='string'&&context.ownerFactRole?context.ownerFactRole:undefined;
  const segment=typeof context.configurationIndexUidSegment==='string'&&context.configurationIndexUidSegment?context.configurationIndexUidSegment:undefined;
  const owner=emission.modules[2];
  const identity=owner.contributions?.find(c=>c.index==='metadata.own-identities');
  if(!identity&&!role&&!segment)return;
  if(!identity?.key?.record?.name || !identity.key.record.kind || !identity.key.record.owner)
    throw new Error('Owner membership requires a declared named identity');
  const {component,owner:parent,kind,name}=identity.key.record;
  owner.contributions.push({index:'metadata.path-children',forEach:structuredClone(identity.forEach),
    key:{record:{parent:structuredClone(parent),kind:structuredClone(kind),name:structuredClone(name)}},
    value:structuredClone(identity.value)});
  if(role)owner.contributions.push({index:'metadata.owner-members',forEach:structuredClone(identity.forEach),
    key:{record:{component,owner:parent,role:{literal:role},name}},value:name});
  if(segment)owner.contributions.push(
    {index:'metadata.owner-member-identities',forEach:structuredClone(identity.forEach),
      key:{record:{component,owner:parent,segment:{literal:segment},name}},value:identity.value});
  if(role||segment) {
    const {ownerFactRole,configurationIndexUidSegment,...remaining}=context;
    result.ownerContributions={ownerFactRole,configurationIndexUidSegment};
    if(Object.keys(remaining).length)result.ownerRequirements=remaining;
    else delete result.ownerRequirements;
  }
}
