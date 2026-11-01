import {readFileSync} from 'node:fs';

const profiles=JSON.parse(readFileSync(new URL('../profiles/declared-collections.json',import.meta.url),'utf8'));

// Checked legacy builders point to accepted collections; their normal values,
// validation and preservation policy remain entirely in the declaration.
export function declaredCollectionProperty(property,catalog) {
 const p=property.parameters,profile=profiles[p?.type];
 if(!profile)return undefined;
 const fail=reason=>({status:'blocked',reason});
 if(Object.keys(p).some(key=>!profile.parameters.includes(key)))return fail('declared-collection-parameters');
 const declaration=catalog.get(profile.declaration);
 if(declaration?.value?.kind!=='sequence')return fail('unsupported-common');
 const xml=p.xml??property.name[0].toUpperCase()+property.name.slice(1),parents=p.xmlParents??[];
 if((p.tag!==undefined && (typeof p.tag!=='string' || !p.tag)) || typeof p.yaml!=='string' || !p.yaml || typeof xml!=='string' ||
  !/^[A-Za-z][A-Za-z0-9]*$/.test(xml) || !Array.isArray(parents) ||
  parents.some(part=>typeof part!=='string' || !/^[A-Za-z][A-Za-z0-9]*$/.test(part)))
  return fail('declared-collection-path');
 const bind={};
 if(profile.recordTable) {
  const table=profile.recordTable,values=p[table.parameter],type=declaration.inputs?.[table.input]?.type;
  if(type?.kind!=='sequence' || type.item?.kind!=='record' ||
    ![table.key,table.value].every(name=>type.item.fields.some(field=>field.name===name && field.type.kind==='scalar' && field.type.scalar==='text')) ||
    !['identity','upper-first'].includes(table.keyTransform))return fail('declared-collection-table-contract');
  if(!values || typeof values!=='object' || Array.isArray(values) || Object.entries(values).some(([key,value])=>
    !key || typeof value!=='string' || !value) || new Set(Object.values(values)).size!==Object.keys(values).length)
    return fail('declared-collection-table-values');
  const rows=Object.entries(values).map(([key,value])=>({record:{
    [table.key]:{literal:table.keyTransform==='upper-first'?key[0].toUpperCase()+key.slice(1):key},
    [table.value]:{literal:value},
  }}));
  const keys=rows.map(row=>row.record[table.key].literal);
  if(new Set(keys).size!==keys.length)return fail('declared-collection-table-values');
  bind[table.input]={sequence:rows};
 }
 const {prefix,uri}=profile.xmlNamespace;
 return {status:'candidate',id:declaration.id,type:{use:'value',...(Object.keys(bind).length?{bind}:{})},inputs:{},
  path:[...parents,xml].map(part=>prefix+':'+part),key:p.yaml,namespaces:{[prefix]:uri},
  ...(p.tag?{sourceTag:p.tag}:{}),...(profile.qname?{qname:true}:{}),
  ...(Object.hasOwn(p,'toEnterprise')?{excludedParameters:['toEnterprise']}:{}) ,
  presence:{target:{field:property.name},xml:{missing:{denotes:{absent:true}}},
   yaml:{missing:{denotes:{absent:true}}}},
 };
}
