import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {stateCapabilitiesFor} from './state-contributions.mjs';
import {orderNumericHistory} from './numeric-owner-fragment.mjs';

// A semantic collection denotes its own state by presence. Bind that presence
// from the composed owner, rather than reparsing its YAML in a private handler.
export function ownerSemanticStates(assembly,source,state,catalog) {
 const capabilities=stateCapabilitiesFor(source);
 const selected=source.properties.filter(row=>capabilities[row.name]?.representation==='semantic' &&
  assembly.coverage.assembled.includes(row.name));
 if(!selected.length)return [];
 const snapshot=JSON.parse(readFileSync(new URL('../../../tests/migration/rules-extraction.json',import.meta.url)));
 const registered=snapshot.entries.find(row=>row.symbol===source.symbol&&row.path===source.path);
 const fragment=assembly.modules.find(row=>row.id===state.module.id);
 const part=assembly.owner.compose.find(row=>assembly.owner.imports[row.use]===fragment?.id);
 const history=fragment?.presence.find(row=>row.target.field==='history')?.yaml?.default?.concat;
 if(!fragment || !part || !history)throw new Error('Semantic states require a mounted shared history');
 for(const property of selected) {
  const capability=capabilities[property.name];
  if(!isDeepStrictEqual(property,registered?.properties.find(row=>row.name===property.name)) ||
    capability.availability!=='borrowed' || !isDeepStrictEqual(capability.modes,['extend']))
   throw new Error('Unreviewed semantic state registration: '+property.name);
  const input='semanticPresent_'+property.name;
  if(fragment.inputs[input] || part.bind[input])throw new Error('Duplicate semantic state presence: '+property.name);
  fragment.inputs[input]={type:{kind:'scalar',scalar:'boolean'}};
  part.bind[input]={present:{field:property.name}};
  const versions=Object.keys(catalog.get('system.CompatibilityMode').enum)
   .filter(version=>stateCapabilitiesFor(source,version)[property.name]?.modes.includes('extend'));
  const available={or:versions.map(version=>({eq:[{input:'compatibilityMode'},{literal:version}]}))};
  fragment.constraints.push({id:'semantic-version-'+property.name,appliesTo:['xml-import','yaml-validation'],
   when:{and:[{input:'adopted'},{input}]},assert:available,
   diagnostic:{code:'state.mode.unavailable',severity:'error',at:{field:'history'},
    message:'Состояние коллекции недоступно для этой версии совместимости'}});
  history.push({if:{and:[{input:'adopted'},{input},available]},then:{sequence:[{record:{
   name:{literal:property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1)},
   mode:{literal:'Extended'},
  }}]},else:{sequence:[]}});
 }
 orderNumericHistory(fragment);
 state.module=fragment;
 return selected.map(row=>row.name);
}
