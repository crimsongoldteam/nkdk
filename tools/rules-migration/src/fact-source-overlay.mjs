import {createHash} from 'node:crypto';

const identify=source=>{
  delete source.id;
  source.id=`candidate.member-source.overlay.${createHash('sha256')
    .update(JSON.stringify(source)).digest('hex').slice(0,20)}`;
  return source;
};

// Compose existing contribution expressions, without an interpreter or a
// special merge operation in Rust. A present empty value still shadows base.
export function factSourceOverlay(source,input) {
  if(Object.keys(input).some(key=>!['name','type','index'].includes(key)))
    throw new Error('Unsupported fact overlay option');
  if(!source.contributions?.length||input.type?.kind!=='index'||
    typeof input.index!=='string'||typeof input.name!=='string')
    throw new Error('Fact source overlay requires contributions and a typed index');
  if(source.inputs?.[input.name]||source.contributions.some(row=>row.index===input.index))
    throw new Error('Fact source overlay input conflicts with the source');
  const local=structuredClone(source),base=structuredClone(source);
  local.contributions.push(...source.contributions.map(row=>({...structuredClone(row),index:input.index})));
  base.inputs??={};
  base.inputs[input.name]={type:structuredClone(input.type),index:input.index};
  for(const row of base.contributions){
    const absent={match:{value:{lookup:{in:{input:input.name},key:structuredClone(row.key)}},
      present:{as:'existing',then:{literal:false}},absent:{literal:true}}};
    row.when=row.when?{and:[row.when,absent]}:absent;
  }
  return {local:identify(local),base:identify(base)};
}
