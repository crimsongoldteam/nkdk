import {createHash} from 'node:crypto';
import {qualifiedOwnerName} from './qualified-owner-name.mjs';

// Translate the source builder's items into ordinary defaults. No runtime handler.
export function internalInfoAttachment(owner) {
  const fail=reason=>({status:'blocked',reason});
  const properties=owner.properties.filter(p=>p.type==='InternalInfo');
  const roots=owner.properties.filter(p=>p.type==='XMLRoot');
  if(properties.length!==1 || roots.length>1)return fail('internal-info-owner-root-required');
  const property=properties[0],p=property.parameters,root=roots[0]?.parameters;
  const child=roots.length===0 && /^Metadata[A-Z][A-Za-z]+$/.test(owner.itemType??'') &&
    owner.properties.some(item=>item.name==='uuid');
  if(!root && !child)return fail('internal-info-owner-root-required');
  const nameIssue=p.getName?.$unresolved;
  const qualifiedName=nameIssue?.kind==='expression' && qualifiedOwnerName(nameIssue.expression);
  if((property.status!=='static-parameters' && !(property.status==='requires-expression-mapping' && qualifiedName)) ||
    (root && roots[0].status!=='static-parameters'))return fail('internal-info-static-parameters-required');
  if(Object.keys(p).some(k=>!['type','evaluateWhenYAMLMissing','xmlParents','xmlOnly','items','toYAML','fromYAML','thisNode','containedObjectClassIds',...(qualifiedName?['getName']:[])].includes(k)) ||
    ['toYAML','fromYAML'].some(key=>Object.hasOwn(p,key)&&p[key]!==false) ||
    p.xmlOnly!==true || p.evaluateWhenYAMLMissing!==true ||
    (p.xmlParents!==undefined && (!Array.isArray(p.xmlParents) || p.xmlParents.length>0)))return fail('internal-info-unreviewed-parameters');
  const items=p.items??[];
  if(!Array.isArray(items) || items.some(item=>Object.keys(item).sort().join(',')!=='category,name' || typeof item.name!=='string' || !item.name || typeof item.category!=='string') || new Set(items.map(item=>item.name)).size!==items.length)return fail('internal-info-invalid-items');
  if(p.thisNode!==undefined && p.thisNode!==true)return fail('internal-info-invalid-this-node');
  const classIds=p.containedObjectClassIds??[];
  if(!Array.isArray(classIds) || classIds.some(id=>typeof id!=='string' || !/^[0-9a-f-]{36}$/i.test(id)) || new Set(classIds).size!==classIds.length)return fail('internal-info-invalid-contained-objects');
  if(root && (typeof root.container!=='string' || !root.container || typeof root.rootAttributes?._xmlns!=='string'))return fail('internal-info-invalid-root');
  const route=root?['md:MetaDataObject',`md:${root.container}`]:[`md:${owner.itemType.slice('Metadata'.length)}`];
  const text=()=>({kind:'scalar',scalar:'text'});
  const index=()=>({type:{kind:'index',key:{kind:'record',fields:['owner','name'].map(name=>({name,type:text()}))},value:text()}});
  const module={format:'nkdk-declarations/1',kind:'fragment',imports:{types:'common.internal-generated-types',
      ...(p.thisNode?{thisNode:'common.internal-this-node'}:{}),
      ...(classIds.length?{containedObjects:'common.internal-contained-objects'}:{})},
    namespaces:{md:root?.rootAttributes._xmlns??'http://v8.1c.ru/8.3/MDClasses',
      ...(p.thisNode||classIds.length?{xr:'http://v8.1c.ru/8.3/xcf/readable'}:{})},
    inputs:{owner:{type:text()},name:{type:text()},
      ...(items.length?{typeIds:index(),valueIds:index()}:{})},
    value:{kind:'record',fields:[...(p.thisNode?[{name:'thisNode',type:{use:'thisNode'}}]:[]),
      {name:'types',type:{use:'types'}},
      ...(classIds.length?[{name:'containedObjects',type:{use:'containedObjects'}}]:[])]},
    representations:{xml:{kind:'record',fields:[...(p.thisNode?[{field:'thisNode',path:[...route,'md:InternalInfo','xr:ThisNode']}]:[]),
      {field:'types',path:[...route,'md:InternalInfo']},
      ...(classIds.length?[{field:'containedObjects',path:[...route,'md:InternalInfo']}]:[])]},yaml:{kind:'mapping',fields:[{field:'types',key:'ВнутренниеТипы'},
      ...(classIds.length?[{field:'containedObjects',key:'ВнутренниеОбъекты'}]:[])]}},
    presence:[{target:{field:'types'},xml:{missing:{denotes:{absent:true}}},yaml:{default:{sequence:items.map(item=>({record:{
      name:{concat:[{literal:item.name+'.'},{input:'name'}]},category:{literal:item.category},
      ...Object.fromEntries([['typeId','typeIds'],['valueId','valueIds']].map(([field,input])=>[field,{require:{lookup:{in:{input},key:{record:{owner:{input:'owner'},name:{literal:item.name}}}}}}])),
    }}))}}}]};
  if(p.thisNode) {
    module.inputs.thisNodes={type:{kind:'index',key:text(),value:text()}};
    module.presence.push({target:{field:'thisNode'},xml:{missing:{denotes:{absent:true}}},
      yaml:{default:{require:{lookup:{in:{input:'thisNodes'},key:{input:'owner'}}}}}});
    module.contributions=[{index:'metadata.internal-this-nodes',key:{input:'owner'},value:{field:'thisNode'}}];
  }
  if(classIds.length) {
    module.inputs.containedIds={type:{kind:'index',key:{kind:'record',fields:['owner','classId'].map(name=>({name,type:text()}))},value:text()}};
    module.presence.push({target:{field:'containedObjects'},xml:{missing:{denotes:{absent:true}}},
      yaml:{default:{sequence:classIds.map(classId=>({record:{classId:{literal:classId},
        objectId:{require:{lookup:{in:{input:'containedIds'},key:{record:{owner:{input:'owner'},classId:{literal:classId}}}}}}}}))}}});
    module.contributions=[...(module.contributions??[]),{index:'metadata.internal-contained-ids',forEach:{in:{field:'containedObjects'},as:'row'},
      key:{record:{owner:{input:'owner'},classId:{get:{of:{var:'row'},field:'classId'}}}},
      value:{get:{of:{var:'row'},field:'objectId'}}}];
  }
  module.id='candidate.internal-info.'+createHash('sha256').update(JSON.stringify(module)).digest('hex').slice(0,20);
  return {status:'candidate',module};
}
