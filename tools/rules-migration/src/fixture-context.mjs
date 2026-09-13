export function ownerContext(snapshot, source, name) {
  const records=[...snapshot.roots,...snapshot.children];
  const matches=records.filter(row=>row.source===source && row.name===name);
  if(matches.length!==1)throw new Error('Ambiguous owner fixture context');
  const owner=matches[0],chain=[],seen=new Set();
  let current=owner;
  while(current) {
    if(seen.has(current.identity))throw new Error('Cyclic owner fixture context');
    seen.add(current.identity);chain.unshift(current);
    if(!current.parent)break;
    const parents=records.filter(row=>row.identity===current.parent);
    if(parents.length!==1)throw new Error('Ambiguous parent fixture context');
    current=parents[0];
  }
  const forms=snapshot.forms.filter(row=>row.parent===owner.identity);
  return {values:{owner:chain.flatMap(row=>[row.kind,row.name]).join('.'),forms:forms.map(row=>row.name)},sources:[...chain,...forms]};
}
