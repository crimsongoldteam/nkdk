import {createHash} from 'node:crypto';

// Registration -> ordinary fields/defaults/index expressions. No element-specific
// converter or name generator is installed in Rust or the operation dispatcher.
function identityProfile(registration,catalog) {
  const fail=()=>{throw new Error('Unsupported element identity registration');};
  const params=registration?.parameters,style=params?.nameStyle;
  if(!catalog.has('common.xml-name') || registration?.blockers?.length || registration?.issues?.length ||
    !params || Object.keys(params).some(key=>!['propertyType','nameStyle','directId'].includes(key)) ||
    !style || Object.keys(style).some(key=>!['canonicalSuffix','referenceSuffixes','canonicalNameMode','explicitXMLName'].includes(key)) ||
    style.explicitXMLName!==true || !['fixed','ownerSuffix'].includes(style.canonicalNameMode) ||
    typeof style.canonicalSuffix!=='string' || !style.canonicalSuffix ||
    !Array.isArray(style.referenceSuffixes) || style.referenceSuffixes[0]!==style.canonicalSuffix ||
    !style.referenceSuffixes.every(suffix=>typeof suffix==='string' && suffix.length) ||
    new Set(style.referenceSuffixes).size!==style.referenceSuffixes.length ||
    (params.directId!==undefined && (typeof params.directId!=='string' || !/^-?\d+$/.test(params.directId))))fail();
  if(registration.constantOutput && (style.canonicalNameMode!=='fixed' ||
    registration.constantOutput.name!==style.canonicalSuffix ||
    registration.constantOutput.id!==params.directId))fail();
  const text={kind:'scalar',scalar:'text'};
  const index={type:{kind:'index',key:{kind:'record',fields:
    ['component','owner','name'].map(name=>({name,type:text}))},value:text}};
  const nameFor=suffix=>style.canonicalNameMode==='fixed'?{literal:suffix}:
    {concat:[{input:'ownerName'},{literal:suffix}]};
  const canonical=nameFor(style.canonicalSuffix);
  const key={record:{component:{input:'component'},owner:{input:'owner'},name:canonical}};
  const variants={sequence:style.referenceSuffixes.map(nameFor)};
  const resolved={match:{value:{lookup:{in:{input:'names'},key}},
    present:{as:'indexedName',then:{if:{exists:{in:variants,as:'variantName',where:{eq:[{var:'variantName'},{var:'indexedName'}]}}},then:{var:'indexedName'},else:canonical}},
    absent:canonical}};
  const name={variant:{name:'explicit',value:{record:{name:resolved}}}};
  const id=params.directId!==undefined?{literal:params.directId}:
    {require:{lookup:{in:{input:'identities'},key}}};
  return {key,module:{
    format:'nkdk-declarations/1',kind:'fragment',
    id:'fragment.element-identity.'+createHash('sha256').update(JSON.stringify(registration)).digest('hex').slice(0,20),
    imports:{name:'common.xml-name'},
    inputs:{component:{type:text},owner:{type:text},
      ...(style.canonicalNameMode==='ownerSuffix'?{ownerName:{type:text}}:{}),names:structuredClone(index),
      ...(params.directId===undefined?{identities:structuredClone(index)}:{})},
    value:{kind:'record',fields:[{name:'name',type:{use:'name'}},{name:'id',type:text}]},
    representations:{xml:{kind:'record',fields:[{field:'name',path:[],attribute:'name'},{field:'id',path:[],attribute:'id'}]},
      yaml:{kind:'mapping',fields:[{field:'name',key:'Имя'},{field:'id',key:'Идентификатор'}]}},
    presence:[
      {target:{field:'name'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:name},
        omitWhen:{eq:[{get:{of:{variantValue:{value:{field:'name'},variant:'explicit'}},field:'name'}},resolved]}}},
      {target:{field:'id'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:id},
        omitWhen:{eq:[{field:'id'},id]}}},
    ],
    constraints:[{id:'identity-text',appliesTo:['xml-import','yaml-validation'],
      when:{present:{field:'id'}},assert:{matches:{value:{field:'id'},pattern:'-?[0-9]+'}},
      diagnostic:{code:'element.identity',severity:'error',at:{field:'id'},message:'Недопустимый идентификатор элемента'}},
      ...(params.directId===undefined?[]:[{id:'fixed-identity',appliesTo:['xml-import','yaml-validation'],
        when:{present:{field:'id'}},assert:{eq:[{field:'id'},{literal:params.directId}]},
        diagnostic:{code:'element.fixed-identity',severity:'error',at:{field:'id'},message:'Идентификатор отличается от заданного регистрацией'}}])],
  }};
}

export function sourceElementIdentity(registration,catalog) {
  return identityProfile(registration,catalog).module;
}

export function sourceElementIdentityFacts(registration,catalog) {
  const {module,key}=identityProfile(registration,catalog);
  const text={kind:'scalar',scalar:'text'};
  return {format:module.format,kind:'object',id:module.id+'.facts',
    inputs:Object.fromEntries(Object.entries(module.inputs).filter(([name])=>!['names','identities'].includes(name))),
    value:{kind:'record',fields:['name','id'].map(name=>({name,type:text}))},
    representations:{xml:structuredClone(module.representations.xml),
      yaml:{kind:'mapping',fields:[{field:'name',key:'Имя'},{field:'id',key:'Идентификатор'}]}},
    presence:['name','id'].map(field=>({target:{field},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}})),
    contributions:[
      {index:'metadata.element-names',key,value:{field:'name'},when:{present:{field:'name'}}},
      {index:'metadata.element-identities',key,value:{field:'id'},when:{present:{field:'id'}}},
      ...(registration.parameters.directId===undefined?[{
        index:'metadata.element-identities',key,allocate:{scope:['component','owner'],first:1},
      }]:[]),
    ]};
}
