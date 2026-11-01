// Fixture wiring only: runtime inheritance remains a declared index dependency.
export function linkedOwnerSources(headers) {
  const identities=new Map();
  for(const header of headers){
    if(!header.identity || !header.kind)throw new Error('Incomplete base source header');
    if(identities.has(header.identity))throw new Error(`Repeated base source identity: ${header.identity}`);
    identities.set(header.identity,header);
  }
  return header=>{
    if(!header.baseIdentity)return undefined;
    const source=identities.get(header.baseIdentity);
    if(!source)throw new Error(`Linked base source is missing: ${header.baseIdentity}`);
    if(source.kind!==header.kind)throw new Error(`Linked base source kind mismatch: ${header.kind}`);
    return source;
  };
}
