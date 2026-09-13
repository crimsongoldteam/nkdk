export function composeAttachment(primary,mapped,id) {
  if(mapped.status!=='ready')throw new Error('Attachment not ready');
  const result=structuredClone(primary);
  result.id=id;
  result.imports??={};result.inputs??={};result.compose??=[];
  if(Object.hasOwn(result.imports,'attachment'))throw new Error('Attachment import collision');
  for(const [alias,target]of Object.entries(mapped.imports??{})) {
    if(alias==='attachment' || (Object.hasOwn(result.imports,alias) && result.imports[alias]!==target))throw new Error('Attachment dependency collision');
    result.imports[alias]=target;
  }
  result.imports.attachment=mapped.fragment;
  const bind=structuredClone(mapped.compose?.bind??{});
  for(const [name,input]of Object.entries(mapped.inputs)) {
    const target=`attachment_${name}`;
    if(Object.hasOwn(result.inputs,target))throw new Error('Attachment input collision');
    result.inputs[target]=input;bind[name]={input:target};
  }
  result.compose.push({use:'attachment',...(Object.keys(bind).length?{bind}:{})});
  return result;
}
