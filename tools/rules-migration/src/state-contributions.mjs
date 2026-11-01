// Migration input only: preserve the source declarations, including version
// deltas. Policy resolution emits declaration data; it does not convert values.
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

// Include the union of declared versions without selecting a compatibility mode.
function taggedProperties(entry) {
  const profiles=new Set((entry.propertyStates??[]).flatMap(contribution=>
    contribution.item?.itemType===entry.itemType?contribution.item.profiles??[]:[]));
  const names=new Set((entry.propertyStates??[]).flatMap(contribution=>
    [...(contribution.profile && profiles.has(contribution.id)?[contribution.profile]:[]),
      ...[contribution.item,...(contribution.delta?.items??[])].filter(item=>item?.itemType===entry.itemType)]
      .flatMap(item=>Object.entries(item.properties??{})
        .filter(([,property])=>property.representation==='tagged' && property.modes?.length)
        .map(([name])=>name))));
  return entry.properties.filter(property=>names.has(property.name));
}

export const taggedNumberProperties=entry=>taggedProperties(entry).filter(property=>property.type==='number');
export const taggedScalarProperties=entry=>taggedProperties(entry).filter(property=>['boolean','SystemEnumeration'].includes(property.type));
export const taggedTextProperties=entry=>taggedProperties(entry).filter(property=>property.type==='string' && property.parameters?.runtimeOnly!==true);

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

// Source-only policy resolution. Emitted conditions use the finite declared
// compatibility vocabulary; Rust never parses version or metadata names.
const version=mode=>{
 const found=/^(?:Версия|Version)(\d+)_(\d+)(?:_(\d+))?$/.exec(mode);
 if(!found)throw new Error(`Unknown compatibility mode: ${mode}`);
 return found.slice(1).map(value=>Number(value??0));
};
const compareVersion=(left,right)=>{
 const a=version(left),b=version(right);
 for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];
 return 0;
};
export function stateCapabilitiesFor(entry,mode,defaultMode='Version8_3_27') {
 const selected=mode===undefined||['DontUse','НеИспользовать'].includes(mode)?defaultMode:mode;
 version(selected);
 const contributions=stateContributionsFor(entry.propertyStates??[],entry.itemType);
 const item=contributions.find(row=>row.item)?.item;
 if(!item)return {};
 const properties={};
 for(const id of item.profiles)Object.assign(properties,contributions.find(row=>row.id===id).profile.properties);
 Object.assign(properties,item.properties);
 for(const contribution of contributions) {
  if(!contribution.delta || compareVersion(contribution.delta.mode,selected)>0)continue;
  for(const patch of contribution.delta.items)for(const [key,value] of Object.entries(patch.properties))
   properties[key]={...properties[key],...value};
 }
 return copyData(properties);
}

export function stateVersionConstraints(entry,properties,enumValues,xmlName,{variants=[['changed','extend'],['notified','notify'],['plain','control']]}={}) {
 const policies=new Map(Object.keys(enumValues).map(mode=>[mode,stateCapabilitiesFor(entry,mode)]));
 return properties.flatMap(property=>variants.flatMap(([variant,mode])=>{
  const allowed=[...policies].filter(([,policy])=>policy[property.name]?.modes.includes(mode)).map(([version])=>version);
  if(allowed.length===policies.size && variant==='plain')return [];
  const field=xmlName(property);
  return [{id:`state-version-${property.name}-${mode}`,appliesTo:['xml-import','yaml-validation'],
   when:{and:[{present:{field}},{isVariant:{value:{field},variant}}]},
   assert:{if:{input:'adopted'},then:allowed.length?{or:allowed.map(version=>({eq:[{input:'compatibilityMode'},{literal:version}]}))}:{literal:false},else:{literal:variant==='plain'}},
   diagnostic:{code:'state.mode.unavailable',severity:'error',at:{field},message:'Пометка свойства недоступна для этого объекта или версии совместимости'}}];
 }));
}
