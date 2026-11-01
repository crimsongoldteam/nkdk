import {isDeepStrictEqual} from 'node:util';

// Checked migration data; expressions are compiled by the ordinary DSL compiler.
export function reconstructionProfiles(profiles,graph,entries) {
  const fields={},xmlNamespaces={},applied=[];
  for(const profile of profiles) {
    const source=profile?.source;
    if(!source || Object.keys(profile).some(key=>!['source','binding'].includes(key)) ||
      Object.keys(source).some(key=>!['path','symbol','property','parameters','registration','xmlNamespace'].includes(key)) ||
      !['path','symbol','property'].every(key=>typeof source[key]==='string' && source[key].length) ||
      !source.registration || Object.keys(source.registration).some(key=>!['type','parameters'].includes(key)) || !profile.binding)throw new Error('Invalid reconstruction profile');
    const candidates=entries.filter(entry=>entry.path===source.path && entry.symbol===source.symbol);
    const property=candidates[0]?.properties?.find(property=>property.name===source.property);
    if(candidates.length!==1 || property?.status!=='static-parameters' ||
      !isDeepStrictEqual(property.parameters,source.parameters))throw new Error('Changed reconstruction source correspondence');
    const registrations=graph.registrations.filter(registration=>registration.type===source.registration.type &&
      registration.item?.path===source.path && registration.item?.symbol===source.symbol);
    if(registrations.length!==1 || registrations[0].issues?.length || registrations[0].blockers?.length ||
      !isDeepStrictEqual(registrations[0].parameters,source.registration.parameters))
      throw new Error('Changed reconstruction registration correspondence');
    const key=source.path+'#'+source.symbol;
    if(Object.hasOwn(fields[key]??{},source.property))throw new Error('Duplicate reconstruction binding');
    if(source.xmlNamespace) {
      const ns=source.xmlNamespace;
      if(Object.keys(ns).some(key=>!['prefix','uri'].includes(key)) ||
        typeof ns.prefix!=='string' || !/^[A-Za-z][A-Za-z0-9]*$/.test(ns.prefix) || typeof ns.uri!=='string' || !ns.uri)
        throw new Error('Invalid reconstruction XML namespace');
      if(xmlNamespaces[key] && !isDeepStrictEqual(xmlNamespaces[key],ns))throw new Error('Conflicting reconstruction XML namespace');
      xmlNamespaces[key]=structuredClone(ns);
    }
    (fields[key]??={})[source.property]=structuredClone(profile.binding);
    applied.push({path:source.path,symbol:source.symbol,property:source.property,registration:source.registration.type});
  }
  return {fields,xmlNamespaces,applied};
}
