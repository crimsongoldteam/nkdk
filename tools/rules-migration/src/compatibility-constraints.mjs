import {stateCapabilitiesFor} from './state-contributions.mjs';
import {readFileSync} from 'node:fs';

// Compile the extracted source registry to ordinary expressions, never runtime callbacks.
export function compatibilityConstraints(source,catalog,{participates={field:'participates'},enumInput=false}={}) {
  const enumeration=catalog.get('system.CompatibilityMode')?.enum;
  if(!enumeration)throw new Error('Missing compatibility enumeration');
  const registry=readFileSync('packages/rules/metadata/appliedObjects/configurationExtension/propertyStateCapabilities.ts','utf8');
  const defaultMode=registry.match(/const DEFAULT_COMPATIBILITY_MODE = "([^"]+)"/)?.[1];
  if(!Object.values(enumeration).includes(defaultMode))throw new Error('Unresolved default compatibility');
  const defaultXML=Object.keys(enumeration).find(name=>enumeration[name]===defaultMode);
  const modes=enumInput?Object.keys(enumeration):Object.entries(enumeration).flatMap(([xml,yaml])=>[xml,yaml]);
  const permitted=mode=>stateCapabilitiesFor(source,mode,defaultXML).extendedConfigurationObject?.modes??[];
  const allowed=mode=>({or:modes.filter(value=>permitted(value).includes(mode)).map(value=>({eq:[{input:'compatibilityMode'},{literal:value}]}))});
  return [
    {id:'borrowed-compatibility',appliesTo:['xml-import','yaml-validation'],
      assert:{or:[{not:participates},allowed('control')]},
      diagnostic:{code:'metadata.borrowed-compatibility',severity:'error',at:{field:'objectBelonging'},message:'Borrowing is unavailable in this compatibility mode'}},
    {id:'notify-compatibility',appliesTo:['xml-import','yaml-validation'],
      assert:{or:[{not:{present:{field:'notice'}}},allowed('notify')]},
      diagnostic:{code:'metadata.notify-compatibility',severity:'error',at:{field:'state'},message:'Notification is unavailable in this compatibility mode'}},
  ];
}
