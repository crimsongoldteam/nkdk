const text={kind:'scalar',scalar:'text'};

export function childIdentityCatalog({prefix,xmlRoute,children}) {
 const rowId=`migration.${prefix}-child-identity-row`;
 const childRow={format:'nkdk-declarations/1',kind:'value',id:rowId,
  namespaces:{md:'http://v8.1c.ru/8.3/MDClasses'},
  value:{kind:'record',fields:[{name:'name',type:text},{name:'uuid',type:text},{name:'base',type:text}]},
  representations:{xml:{kind:'record',fields:[
   {field:'name',path:['md:Properties','md:Name']},
   {field:'uuid',path:[],attribute:'uuid'},
   {field:'base',path:['md:Properties','md:ExtendedConfigurationObject']},
  ]},yaml:{kind:'mapping',fields:[{field:'name',key:'name'},
   {field:'uuid',key:'uuid'},{field:'base',key:'base'}]}},
  presence:[{target:{field:'base'},xml:{missing:{denotes:{absent:true}}},
   yaml:{missing:{denotes:{absent:true}}}}]};
 const lists=children.map(({field,kind})=>({format:'nkdk-declarations/1',kind:'value',
  id:`migration.${prefix}-${field}-identities`,imports:{row:rowId},
  namespaces:{md:'http://v8.1c.ru/8.3/MDClasses'},
  value:{kind:'sequence',item:{use:'row'}},
  representations:{xml:{kind:'element-sequence',path:[`md:${kind}`],item:{kind:'declared'}},
   yaml:{kind:'sequence',item:{kind:'declared'}}},
  presence:[{target:'self',xml:{missing:{denotes:{sequence:[]}}},
   yaml:{missing:{denotes:{sequence:[]}}}}],
 }));
 const sources=children.map(({field,kind},index)=>({format:'nkdk-declarations/1',kind:'object',
  id:`migration.${prefix}-${field}-identity-source`,
  namespaces:{md:'http://v8.1c.ru/8.3/MDClasses'},
  imports:{[field]:lists[index].id},
  inputs:{component:{type:text},ownerIdentity:{type:text}},
  value:{kind:'record',fields:[{name:field,type:{use:field}}]},
  representations:{xml:{kind:'record',fields:[{field,
   path:[...xmlRoute,'md:ChildObjects']}]},
   yaml:{kind:'mapping',fields:[{field,key:field}]}},
  presence:[{target:{field},xml:{missing:{denotes:{sequence:[]}}},
   yaml:{missing:{denotes:{sequence:[]}}}}],
  contributions:[{index:'metadata.own-identities',
   forEach:{in:{field},as:'row'},
   key:{record:{component:{input:'component'},owner:{input:'ownerIdentity'},
    kind:{literal:kind},name:{get:{of:{var:'row'},field:'name'}}}},
   value:{get:{of:{var:'row'},field:'uuid'}},
  },{index:'metadata.base-identities',forEach:{in:{field},as:'row'},
   when:{present:{get:{of:{var:'row'},field:'base'}}},
   key:{record:{component:{input:'component'},identity:{get:{of:{var:'row'},field:'uuid'}}}},
   value:{get:{of:{var:'row'},field:'base'}},
  }],
 }));
 const bases=sources.map(source=>({
  ...structuredClone(source),
  id:source.id.replace('-identity-source','-base-source'),
  contributions:[structuredClone(source.contributions[1])],
 }));
 return {format:'nkdk-declarations/1',kind:'catalog',
  declarations:[childRow,...lists,...sources,...bases]};
}
