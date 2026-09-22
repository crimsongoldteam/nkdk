import {emitCollections} from './collection-emission.mjs';

// An explicit cf branch for conversion of complete child elements. Extension
// contracts remain required by the default emitter and by full acceptance.
export function emitBaseCollections(graph,entries,catalog,namespaces={}) {
  const selected=structuredClone(entries),excluded=[];
  for(const entry of selected) {
    if(!Array.isArray(entry.propertyStates))continue;
    const properties=entry.propertyStates.flatMap(c=>[
      ...Object.entries(c.item?.properties??c.profile?.properties??{}),
      ...(c.delta?.items??[]).flatMap(item=>Object.entries(item.properties)),
    ]);
    const removable=entry.properties.filter(p=>p.parameters?.runtimeOnly===true &&
      p.status==='static-parameters' && properties.some(([name,state])=>name===p.name&&state.availability==='borrowed') &&
      !properties.some(([name,state])=>name===p.name&&state.availability==='own')).map(p=>p.name);
    entry.properties=entry.properties.filter(p=>!removable.includes(p.name));
    entry.propertyStates=[];
    if(removable.length)excluded.push({path:entry.path,symbol:entry.symbol,properties:removable});
  }
  const result=emitCollections(graph,selected,catalog,namespaces,{deferOwnerContributions:true,canonicalYamlKeyOrder:true,
    ...(namespaces.md?{defaultXmlNamespace:'md'}:{})});
  return {...result,profile:'base-configuration',excluded,
    scope:'Complete cf child conversion only; extension profiles and deferred owner contributions are not accepted'};
}
