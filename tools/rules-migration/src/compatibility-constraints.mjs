import {readFileSync} from 'node:fs';

// Compile the extracted source registry to ordinary expressions, never runtime callbacks.
export function compatibilityConstraints(source,catalog) {
  const enumeration=catalog.get('system.CompatibilityMode')?.enum;
  if(!enumeration)throw new Error('Missing compatibility enumeration');
  const registry=readFileSync('packages/rules/metadata/appliedObjects/configurationExtension/propertyStateCapabilities.ts','utf8');
  const defaultMode=registry.match(/const DEFAULT_COMPATIBILITY_MODE = "([^"]+)"/)?.[1];
  if(!Object.values(enumeration).includes(defaultMode))throw new Error('Unresolved default compatibility');
  const version=mode=>{
    const match=/^(?:Версия|Version)(\d+)_(\d+)(?:_(\d+))?$/.exec(mode);
    if(!match)throw new Error('Unresolved compatibility version: '+mode);
    return match.slice(1).map(value=>Number(value??0));
  };
  const compare=(a,b)=>{const av=version(a),bv=version(b);return av[0]-bv[0]||av[1]-bv[1]||av[2]-bv[2];};
  const modes=Object.entries(enumeration).flatMap(([xml,yaml])=>[xml,yaml]);
  if(source.propertyStates.some(c=>c.profile || c.item?.profiles?.length))throw new Error('Unmapped compatibility profile');
  const permitted=mode=>{
    if(['DontUse','НеИспользовать'].includes(mode))mode=defaultMode;
    let property;
    for(const contribution of source.propertyStates) {
      if(contribution.item?.properties?.extendedConfigurationObject)property=contribution.item.properties.extendedConfigurationObject;
      if(contribution.delta && compare(mode,contribution.delta.mode)>=0) {
        for(const item of contribution.delta.items??[])if(item.properties?.extendedConfigurationObject)property={...property,...item.properties.extendedConfigurationObject};
      }
    }
    return property?.modes??[];
  };
  const allowed=mode=>({or:modes.filter(value=>permitted(value).includes(mode)).map(value=>({eq:[{input:'compatibilityMode'},{literal:value}]}))});
  return [
    {id:'borrowed-compatibility',appliesTo:['xml-import','yaml-validation'],
      assert:{or:[{not:{field:'participates'}},allowed('control')]},
      diagnostic:{code:'metadata.borrowed-compatibility',severity:'error',at:{field:'objectBelonging'},message:'Borrowing is unavailable in this compatibility mode'}},
    {id:'notify-compatibility',appliesTo:['xml-import','yaml-validation'],
      assert:{or:[{not:{present:{field:'notice'}}},allowed('notify')]},
      diagnostic:{code:'metadata.notify-compatibility',severity:'error',at:{field:'state'},message:'Notification is unavailable in this compatibility mode'}},
  ];
}
