import {createHash} from 'node:crypto';

// Translate the source builder's items into ordinary defaults. No runtime handler.
export function internalInfoAttachment(owner) {
  const fail=reason=>({status:'blocked',reason});
  const properties=owner.properties.filter(p=>p.type==='InternalInfo');
  const roots=owner.properties.filter(p=>p.type==='XMLRoot');
  if(properties.length!==1 || roots.length!==1)return fail('internal-info-owner-root-required');
  const property=properties[0],p=property.parameters,root=roots[0].parameters;
  if(property.status!=='static-parameters' || roots[0].status!=='static-parameters')return fail('internal-info-static-parameters-required');
  if(Object.keys(p).some(k=>!['type','evaluateWhenYAMLMissing','xmlParents','xmlOnly','items'].includes(k)) || p.xmlOnly!==true || p.evaluateWhenYAMLMissing!==true || !Array.isArray(p.xmlParents) || p.xmlParents.length)return fail('internal-info-unreviewed-parameters');
  if(!Array.isArray(p.items) || p.items.some(item=>Object.keys(item).sort().join(',')!=='category,name' || typeof item.name!=='string' || !item.name || typeof item.category!=='string') || new Set(p.items.map(item=>item.name)).size!==p.items.length)return fail('internal-info-invalid-items');
  if(typeof root.container!=='string' || !root.container || typeof root.rootAttributes?._xmlns!=='string')return fail('internal-info-invalid-root');
  const text=()=>({kind:'scalar',scalar:'text'});
  const index=()=>({type:{kind:'index',key:{kind:'record',fields:['owner','name'].map(name=>({name,type:text()}))},value:text()}});
  const module={format:'nkdk-declarations/1',kind:'fragment',imports:{types:'common.internal-generated-types'},
    namespaces:{md:root.rootAttributes._xmlns},inputs:{owner:{type:text()},name:{type:text()},typeIds:index(),valueIds:index()},
    value:{kind:'record',fields:[{name:'types',type:{use:'types'}}]},
    representations:{xml:{kind:'record',fields:[{field:'types',path:['md:MetaDataObject',`md:${root.container}`,'md:InternalInfo']}]},yaml:{kind:'mapping',fields:[{field:'types',key:'ВнутренниеТипы'}]}},
    presence:[{target:{field:'types'},xml:{missing:{denotes:{absent:true}}},yaml:{default:{sequence:p.items.map(item=>({record:{
      name:{concat:[{literal:item.name+'.'},{input:'name'}]},category:{literal:item.category},
      ...Object.fromEntries([['typeId','typeIds'],['valueId','valueIds']].map(([field,input])=>[field,{require:{lookup:{in:{input},key:{record:{owner:{input:'owner'},name:{literal:item.name}}}}}}])),
    }}))}}}]};
  module.id='candidate.internal-info.'+createHash('sha256').update(JSON.stringify(module)).digest('hex').slice(0,20);
  return {status:'candidate',module};
}
