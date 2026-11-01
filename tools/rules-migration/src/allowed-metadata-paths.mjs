// Compile a declarative metadataTarget path vocabulary into disjoint text forms.
// Every shape is literal except its object names, so conversion needs no
// per-item policy search or owner-specific Rust branch.
export function allowedMetadataPaths(target,catalog,{id,item='xr:Object',verifyTargets=false}={}) {
  if(target?.kind!=='member' || target.owner!=='explicit' ||
    Object.keys(target).some(key=>!['kind','owner','allowedObjectPaths','allowedMemberPaths','nestedObjectRoots'].includes(key)))
    throw new Error('Unrepresented metadata target policy');
  if(!id || !/^[-.a-z0-9]+$/i.test(id) || !/^xr:[A-Za-z]+$/.test(item))throw new Error('Invalid path declaration identity');
  const rootWords=catalog.get('common.path-root')?.enum;
  const memberWords=catalog.get('common.path-member-kind')?.enum;
  const objectWords=catalog.get('common.path-object-kind')?.enum;
  if(!rootWords || !memberWords || !objectWords)throw new Error('Missing path vocabularies');
  const nestedRoots=target.nestedObjectRoots??[];
  const declaredPaths=[...(target.allowedObjectPaths??[]),...(target.allowedMemberPaths??[])];
  if(!Array.isArray(nestedRoots) || (!declaredPaths.length && !nestedRoots.length)
    || !declaredPaths.every(path=>Array.isArray(path) && path.length>=1 && path.every(word=>typeof word==='string')))
    throw new Error('Expected static allowed metadata paths');
  const paths=declaredPaths.filter(path=>path.length!==1 || !nestedRoots.includes(path[0]));
  const indexInputs={
    roots:{type:{kind:'index',key:{kind:'record',fields:[{name:'kind',type:{use:'rootKind'}},{name:'name',type:{kind:'scalar',scalar:'text'}}]},value:{kind:'scalar',scalar:'text'}}},
    pathChildren:{type:{kind:'index',key:{kind:'record',fields:[{name:'parent',type:{kind:'scalar',scalar:'text'}},{name:'kind',type:{kind:'scalar',scalar:'text'}},{name:'name',type:{kind:'scalar',scalar:'text'}}]},value:{kind:'scalar',scalar:'text'}}},
  };
  const bindings={roots:{input:'roots'},pathChildren:{input:'pathChildren'}};
  const bindInputs=inputs=>Object.fromEntries(Object.keys(inputs).map(name=>[name,bindings[name]]));
  const rootLookup=(kind,name)=>({lookup:{in:{input:'roots'},key:{record:{kind:{literal:kind},name}}}});
  const childLookup=(parent,kind,name)=>({lookup:{in:{input:'pathChildren'},key:{record:{parent,kind:{literal:kind},name}}}});
  const targetConstraint=assert=>({id:'target-exists',appliesTo:['xml-import','yaml-validation'],
    assert,diagnostic:{code:'metadata.target-missing',severity:'error',at:{self:true},message:'Target is missing'}});
  const seen=new Set();
  const variants=paths.map((path,index)=>{
    const key=JSON.stringify(path);
    if(seen.has(key))throw new Error(`Duplicate metadata path: ${key}`);
    seen.add(key);
    const words=path.map((word,position)=>{
      const vocabulary=position===0?rootWords:{...memberWords,...objectWords};
      if(!Object.hasOwn(vocabulary,word))throw new Error(`Unknown metadata path kind: ${word}`);
      return vocabulary[word];
    });
    const fields=path.map((_,position)=>({name:`name${position}`,type:{use:'name'}}));
    const parts=(names)=>names.flatMap((word,position)=>[{literal:word},{field:`name${position}`}]);
    const result={format:'nkdk-declarations/1',kind:'value',id:`${id}.path${index}`,
      imports:{name:'common.metadata-name',...(verifyTargets?{rootKind:'common.path-root'}:{})},value:{kind:'record',fields},
      representations:{xml:{kind:'text-pattern',separator:'.',parts:parts(path)},
        yaml:{kind:'text-pattern',separator:'.',parts:parts(words)}}};
    if(verifyTargets) {
      result.inputs=path.length===1?{roots:indexInputs.roots}:indexInputs;
      const resolve=(position,parent)=>{
        const next=position===0?rootLookup(path[0],{field:'name0'}):
          childLookup({var:parent},path[position],{field:`name${position}`});
        if(position===path.length-1)return {present:next};
        return {match:{value:next,present:{as:`parent${position}`,then:resolve(position+1,`parent${position}`)},
          absent:{literal:false}}};
      };
      result.constraints=[targetConstraint(resolve(0))];
    }
    return result;
  });
  const nested=[];
  for(const [index,root] of nestedRoots.entries()) {
    if(seen.has(JSON.stringify([root,'nested'])))throw new Error(`Duplicate nested metadata root: ${root}`);
    seen.add(JSON.stringify([root,'nested']));
    if(!Object.hasOwn(rootWords,root))throw new Error(`Unknown nested metadata root: ${root}`);
    const word=rootWords[root];
    const kindId=`${id}.nested${index}.kind`,segmentId=`${id}.nested${index}.segment`,tailId=`${id}.nested${index}.tail`,pathId=`${id}.nested${index}`;
    nested.push({format:'nkdk-declarations/1',kind:'value',id:kindId,enum:{[root]:word}});
    nested.push({format:'nkdk-declarations/1',kind:'value',id:segmentId,
      imports:{kind:kindId,name:'common.metadata-name'},value:{kind:'record',fields:[{name:'kind',type:{use:'kind'}},{name:'name',type:{use:'name'}}]},
      representations:{xml:{kind:'text-pattern',parts:[{field:'kind'},{literal:'.'},{field:'name'}]},
        yaml:{kind:'text-pattern',parts:[{field:'kind'},{literal:'.'},{field:'name'}]}}});
    nested.push({format:'nkdk-declarations/1',kind:'value',id:tailId,
      imports:{item:segmentId},value:{kind:'sequence',item:{use:'item'}},
      representations:{xml:{kind:'text-sequence',separator:'.'},yaml:{kind:'text-sequence',separator:'.'}}});
    const nestedPath={format:'nkdk-declarations/1',kind:'value',id:pathId,
      imports:{root:kindId,name:'common.metadata-name',tail:tailId,...(verifyTargets?{rootKind:'common.path-root'}:{})},
      value:{kind:'record',fields:[{name:'root',type:{use:'root'}},{name:'name',type:{use:'name'}},{name:'tail',type:{use:'tail'}}]},
      representations:{xml:{kind:'text-pattern',parts:[{field:'root'},{literal:'.'},{field:'name'},{literal:'.'},{field:'tail'}]},
        yaml:{kind:'text-pattern',parts:[{field:'root'},{literal:'.'},{field:'name'},{literal:'.'},{field:'tail'}]}}};
    if(verifyTargets) {
      nestedPath.inputs=indexInputs;
      nestedPath.constraints=[targetConstraint({present:{fold:{
        in:{field:'tail'},initial:rootLookup(root,{field:'name'}),
        as:'segment',state:'parent',next:childLookup({var:'parent'},root,{get:{of:{var:'segment'},field:'name'}}),
      }}})];
    }
    nested.push(nestedPath);
    variants.push(nested.at(-1));
  }
  const choiceInputs=variants.some(variant=>Object.hasOwn(variant.inputs??{},'pathChildren'))?
    indexInputs:{roots:indexInputs.roots};
  const choices={format:'nkdk-declarations/1',kind:'value',id:`${id}.item`,
    imports:{...Object.fromEntries(variants.map((variant,index)=>[`path${index}`,variant.id])),...(verifyTargets?{rootKind:'common.path-root'}:{})},
    ...(verifyTargets?{inputs:choiceInputs}:{}),
    value:{kind:'choice',variants:variants.map((variant,index)=>({name:`path${index}`,type:{use:`path${index}`,...(verifyTargets?{bind:bindInputs(variant.inputs)}:{})}}))},
    representations:{xml:{kind:'choice'},yaml:{kind:'choice'}}};
  const list={format:'nkdk-declarations/1',kind:'value',id,
    imports:{item:choices.id,...(verifyTargets?{rootKind:'common.path-root'}:{})},namespaces:{xr:'http://v8.1c.ru/8.3/xcf/readable'},
    ...(verifyTargets?{inputs:choiceInputs}:{}),
    value:{kind:'sequence',item:{use:'item',...(verifyTargets?{bind:bindInputs(choiceInputs)}:{})}},
    representations:{xml:{kind:'element-sequence',path:[item]},yaml:{kind:'sequence'}},
    presence:[{target:'self',xml:{missing:{denotes:{absent:true}},empty:[{form:'empty-element',denotes:{absent:true}}]},
      yaml:{missing:{denotes:{absent:true}},empty:[{form:'empty-sequence',denotes:{absent:true}}],omitWhen:{not:{present:{self:true}}}}}]};
  return [...nested.filter(module=>!variants.includes(module)),...variants,choices,list];
}
