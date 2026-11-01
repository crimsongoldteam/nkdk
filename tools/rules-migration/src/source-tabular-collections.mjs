import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {sourceOwnerCollections} from './source-owner-collections.mjs';

// Checked source registration -> existing composed item and collection data.
// These providers belong to the accepted tabular-section assembly contract;
// equal index shapes never identify a provider.
const indexProviders={typeIds:'metadata.internal-type-ids',valueIds:'metadata.internal-value-ids',
 identities:'metadata.own-identities',roots:'metadata.roots',forms:'metadata.forms'};
export function sourceTabularCollections(source,catalog,id,{claimed=[]}={}) {
 const result={attachments:[],modules:[],blockers:[]};
 const properties=source.properties.filter(row=>row.parameters?.ownerFactRole==='tabularSections'&&!claimed.includes(row.name));
 if(!properties.length)return result;
 const extraction=JSON.parse(readFileSync(new URL('../../../tests/migration/rules-extraction.json',import.meta.url)));
 const graph=JSON.parse(readFileSync(new URL('../../../tests/migration/collection-links.json',import.meta.url)));
 const original=extraction.entries.find(row=>row.symbol===source.symbol&&row.path===source.path);
 for(const property of properties) {
  const edges=graph.edges.filter(edge=>edge.owner.symbol===source.symbol&&edge.owner.path===source.path&&edge.property===property.name);
  if(!isDeepStrictEqual(property,original?.properties.find(row=>row.name===property.name))||edges.length!==1) {
   result.blockers.push({properties:[property.name],reason:'unreviewed-tabular-collection'});continue;
  }
  const itemId=`migration.${edges[0].item.symbol.replace(/Rules$/,'')}`;
  if(!catalog.has(itemId)) {
   result.blockers.push({properties:[property.name],reason:'missing-composed-tabular-item'});continue;
  }
  const collection=sourceOwnerCollections(source,extraction,catalog,graph,{id,properties:[property.name],
   composedItems:{[property.name]:{id:itemId,indexProviders}}});
  for(const attachment of collection.attachments)attachment.bindings=Object.fromEntries(
   Object.keys(attachment.module.inputs).map(name=>[name,
    name==='parentOwner'?{field:'uuid'}:name==='parentName'?{field:'name'}:`${property.name}_${name}`]));
  result.attachments.push(...collection.attachments);
  result.modules.push(...collection.modules);
  result.blockers.push(...collection.blockers);
 }
 return result;
}
