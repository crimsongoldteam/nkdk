const text={kind:'scalar',scalar:'text'};

// Shared YAML materialization only: existing XML identities stay authoritative.
export function identityPresence(address) {
  return [
    {target:{field:'name'},yaml:{missing:{denotes:{input:'ownerName'}}}},
    {target:{field:'uuid'},yaml:{missing:{denotes:{identity:{
      seed:{input:'identitySeed'},domain:'uuid',format:'uuid',address,
    }}}}},
  ];
}

export function ownIdentityDeclaration({id,namespace,xmlKind,yamlKind,identityKind,version='2.20'}) {
  const xmlPath=['md:MetaDataObject',`md:${xmlKind}`];
  return {
    format:'nkdk-declarations/1',kind:'object',id,
    namespaces:{md:namespace},imports:{facts:'fragment.metadata-own-identity'},
    inputs:{component:{type:text},parent:{type:text},ownerName:{type:text},identitySeed:{type:text}},
    value:{kind:'record',fields:['name','uuid'].map(name=>({name,type:text}))},
    compose:[{use:'facts',bind:{component:{input:'component'},owner:{input:'parent'},
      kind:{literal:identityKind},name:{field:'name'},identity:{field:'uuid'}}}],
    representations:{
      xml:{kind:'with-attributes',attributes:[{name:'version',value:{text:version}}],
        content:{kind:'record',fields:[
          {field:'name',path:[...xmlPath,'md:Properties','md:Name']},
          {field:'uuid',path:xmlPath,attribute:'uuid'},
        ]}},
      yaml:{kind:'mapping',fields:['name','uuid'].map(name=>({field:name,key:name}))},
    },
    presence:identityPresence([{literal:yamlKind},{input:'ownerName'}]),
  };
}

export function internalTypeDeclaration({template,fragment,id,identityKind,yamlKind,items,identityContext=[]}) {
  if(fragment.representations.xml.fields[0]?.field!=='types' || !Array.isArray(items) ||
    items.some(item=>typeof item.name!=='string' || !item.name ||
      typeof item.category!=='string' || !item.category) ||
    new Set(items.map(item=>item.name)).size!==items.length)
    throw new Error(`Unsupported generated-type source: ${id}`);
  const declaration=structuredClone(template);
  declaration.id=id;
  delete declaration.inputs.owner;
  for(const name of ['ownerName','component','parent','identitySeed'])declaration.inputs[name]={type:text};
  declaration.inputs.identities={index:'metadata.own-identities'};
  declaration.representations.xml.fields[0].path=structuredClone(fragment.representations.xml.fields[0].path);
  const identity=(typeName,last)=>({identity:{
    seed:{input:'identitySeed'},domain:'uuid',format:'uuid',
    address:[{literal:yamlKind},{input:'ownerName'},...structuredClone(identityContext),
      {literal:'InternalInfo'},{literal:'GeneratedType'},
      {concat:[{literal:typeName+'.'},{input:'ownerName'}]},{literal:last}],
  }});
  declaration.presence=[{target:{field:'types'},yaml:{missing:{denotes:{sequence:items.map(item=>({record:{
    name:{concat:[{literal:item.name+'.'},{input:'ownerName'}]},
    category:{literal:item.category},typeId:identity(item.name,'TypeId'),
    valueId:identity(item.name,'ValueId'),
  }}))}}}}];
  for(const field of fragment.value.fields.filter(field=>field.name!=='types')) {
    const dependency=field.type.use && fragment.imports?.[field.type.use];
    const xml=fragment.representations.xml.fields.find(row=>row.field===field.name);
    const yaml=fragment.representations.yaml.fields.find(row=>row.field===field.name);
    const presence=fragment.presence?.find(row=>row.target?.field===field.name);
    if(!dependency || !xml || !yaml || !presence ||
      Object.hasOwn(declaration.imports,field.type.use))
      throw new Error(`Unsupported internal-type sibling: ${field.name}`);
    declaration.imports[field.type.use]=dependency;
    declaration.value.fields.push(structuredClone(field));
    declaration.representations.xml.fields.push(structuredClone(xml));
    declaration.representations.yaml.fields.push(structuredClone(yaml));
    declaration.presence.push(structuredClone(presence));
  }
  for(const contribution of declaration.contributions)contribution.key.record.owner={
    require:{lookup:{in:{input:'identities'},key:{record:{
      component:{input:'component'},owner:{input:'parent'},
      kind:{literal:identityKind},name:{input:'ownerName'},
    }}}},
  };
  return declaration;
}
