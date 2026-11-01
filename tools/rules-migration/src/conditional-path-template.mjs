import {ts,unwrap} from './syntax.mjs';

// Recognize a small, reversible path expression without evaluating TypeScript.
export function conditionalPathTemplate(source) {
  if(typeof source!=='string')return undefined;
  const file=ts.createSourceFile('path.ts',`const value = (${source});`,ts.ScriptTarget.Latest,true);
  if(file.parseDiagnostics.length || file.statements.length!==1)return undefined;
  const statement=file.statements[0];
  if(!ts.isVariableStatement(statement) || statement.declarationList.declarations.length!==1)return undefined;
  const fn=unwrap(statement.declarationList.declarations[0].initializer);
  if(!ts.isArrowFunction(fn) || fn.modifiers?.length || fn.parameters.length!==1)return undefined;
  const parameter=fn.parameters[0];
  if(parameter.initializer || parameter.dotDotDotToken || !ts.isObjectBindingPattern(parameter.name))return undefined;
  const bindings=new Map();
  for(const binding of parameter.name.elements) {
    const key=binding.propertyName??binding.name;
    if(binding.initializer || binding.dotDotDotToken || !ts.isIdentifier(key) || !ts.isIdentifier(binding.name))return undefined;
    bindings.set(binding.name.text,key.text);
  }
  const body=unwrap(fn.body);
  if(!ts.isConditionalExpression(body) || !ts.isBinaryExpression(body.condition) || body.condition.operatorToken.kind!==ts.SyntaxKind.BarBarToken)return undefined;
  const equal=(node,right)=>ts.isBinaryExpression(node) && node.operatorToken.kind===ts.SyntaxKind.EqualsEqualsEqualsToken && ts.isIdentifier(node.left) && bindings.has(node.left.text) && right(node.right) ? bindings.get(node.left.text) : undefined;
  const undefinedName=equal(body.condition.left,node=>ts.isIdentifier(node) && node.text==='undefined');
  const emptyName=equal(body.condition.right,node=>ts.isStringLiteral(node) && node.text==='');
  if(!undefinedName || undefinedName!==emptyName)return undefined;
  const absent=path(body.whenTrue,bindings),present=path(body.whenFalse,bindings);
  if(!absent || !present || absent.some(part=>uses(part,undefinedName)) || !present.some(part=>uses(part,undefinedName)))return undefined;
  return {optionalInput:undefinedName,absent,present};
}

function uses(part,name) {
  return typeof part==='object' && (part.input===name || part.concat?.some(value=>uses(value,name)));
}

function path(node,bindings) {
  if(!ts.isTemplateExpression(node) || node.head.text.includes('\0'))return undefined;
  let joined=node.head.text;
  for(const span of node.templateSpans) {
    if(!ts.isIdentifier(span.expression) || !bindings.has(span.expression.text) || span.literal.text.includes('\0'))return undefined;
    joined+=`\0${bindings.get(span.expression.text)}\0${span.literal.text}`;
  }
  const segments=joined.split('/');
  if(segments.some(segment=>!segment || ['.','..'].includes(segment) || /[\\:]/.test(segment)))return undefined;
  return segments.map(segment=>{
    const parts=segment.split(/\0([^\0]+)\0/);
    if(parts.length===1)return segment;
    const values=[];
    for(let index=0;index<parts.length;index++) {
      if(index%2===1)values.push({input:parts[index]});
      else if(parts[index])values.push({literal:parts[index]});
    }
    return values.length===1?values[0]:{concat:values};
  });
}
