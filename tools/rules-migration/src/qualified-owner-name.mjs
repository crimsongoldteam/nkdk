// Only dot-joined metadata names are translated into a bound declaration input.
// The migration tool does not execute source callbacks.
export function qualifiedOwnerName(expression) {
  if(typeof expression!=='string')return false;
  const compact=expression.replace(/\s+/g,'');
  const arrow=compact.indexOf('=>');
  if(arrow<0)return false;
  const parameter=compact.slice(0,arrow);
  const destructured=parameter.startsWith('({context,metadata}')||parameter.startsWith('({metadata}');
  const named=parameter.startsWith('(params:');
  if(!destructured&&!named)return false;
  const context=destructured?'context':'params.context';
  const own=destructured?'metadata.name':'params.metadata.name';
  let body=compact.slice(arrow+2);
  const parents=[];
  if(body.startsWith('{')&&body.endsWith('}')) {
    body=body.slice(1,-1);
    const escapedContext=context.replace('.','\\.');
    const declaration=new RegExp(`^const([A-Za-z][A-Za-z0-9]*)=getParentFromContext\\(${escapedContext},\\["Metadata[A-Za-z]+"(?:asnever)?\\]\\);?`);
    for(;;) {
      const match=body.match(declaration);
      if(!match)break;
      parents.push(`${match[1]}.name`);
      body=body.slice(match[0].length);
    }
    if(!body.startsWith('return'))return false;
    body=body.slice('return'.length).replace(/;$/,'');
  }
  const inlineParent=new RegExp(`^getParentFromContext\\(${context.replace('.','\\.')},\\["Metadata[A-Za-z]+"(?:asnever)?\\]\\)\\.name$`);
  const valid=part=>part===own||parents.includes(part)||inlineParent.test(part);
  const joined=parts=>parts.length>0&&parts.at(-1)===own&&
    parts.filter(part=>part===own).length===1&&
    parts.every(valid)&&new Set(parts).size===parts.length;
  if(body===own)return parents.length===0;
  const listSuffix='].filter(Boolean).join(".")';
  if(body.startsWith('[')&&body.endsWith(listSuffix))
    return joined(body.slice(1,-listSuffix.length).split(','));
  const parseTemplate=text=>{
    const match=text.match(/^`(.*)`$/);
    return match?.[1].split(/(?<=\})\.(?=\$\{)/)
      .map(part=>part.match(/^\$\{([^}]+)\}$/)?.[1]);
  };
  const templateParts=parseTemplate(body);
  if(templateParts && joined(templateParts))return true;
  const ternary=body.match(/^([A-Za-z][A-Za-z0-9]*\.name)\?(`[^`]+`):(.+)$/);
  if(!ternary||!parents.includes(ternary[1])||ternary[3]!==own)return false;
  const parts=parseTemplate(ternary[2]);
  return joined(parts)&&parts[0]===ternary[1];
}
