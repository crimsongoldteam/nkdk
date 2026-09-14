// Migration input only: preserve the source declarations, including version
// deltas. This module neither chooses a compatibility mode nor converts values.
export function stateContributionsFor(contributions,itemType) {
  const ids=new Set();
  for(const contribution of contributions) {
    if(ids.has(contribution.id))throw new Error(`Duplicate state contribution: ${contribution.id}`);
    ids.add(contribution.id);
  }
  const items=contributions.filter(c=>c.item?.itemType===itemType);
  if(items.length>1)throw new Error(`Duplicate state item: ${itemType}`);
  if(!items.length)return [];
  const profiles=new Set(items[0].item.profiles);
  for(const id of profiles)if(!contributions.some(c=>c.id===id&&c.profile))throw new Error(`Missing profile: ${id}`);
  const selected=contributions.flatMap(c=>{
    if(c===items[0] || (c.profile && profiles.has(c.id)))return [c];
    if(!c.delta)return [];
    const patches=c.delta.items.filter(item=>item.itemType===itemType);
    return patches.length?[{...c,delta:{...c.delta,items:patches}}]:[];
  });
  return copyData(selected);
}

function copyData(value) {
  if(value===null || ['string','boolean'].includes(typeof value))return value;
  if(typeof value==='number' && Number.isFinite(value))return value;
  if(Array.isArray(value))return value.map(copyData);
  if(typeof value!=='object' || Object.getPrototypeOf(value)!==Object.prototype)throw new Error('State contribution must contain data only');
  return Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(value)).map(([key,descriptor])=>{
    if(!Object.hasOwn(descriptor,'value'))throw new Error('State contribution must contain data only');
    return [key,copyData(descriptor.value)];
  }));
}
