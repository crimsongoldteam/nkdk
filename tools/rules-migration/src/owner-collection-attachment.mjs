import {verifyOwnerAttachment} from './owner-attachment.mjs';

export function verifyCollectionOwnerAttachment(profile,graph,catalog) {
  const edges=graph.edges.filter(edge=>edge.owner.symbol===profile.symbol&&edge.property===profile.property);
  if(edges.length!==1)return {status:'blocked',reason:edges.length?'ambiguous-collection-link':'missing-collection-link'};
  const edge=edges[0];
  if(edge.status!=='linked-structure'||edge.blockers.length)return {status:'blocked',reason:'unresolved-collection-link'};
  return verifyOwnerAttachment(profile,catalog);
}
