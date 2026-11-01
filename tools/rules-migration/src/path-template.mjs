import {ts,unwrap} from './syntax.mjs';

export function pathTemplate(source) {
  if(typeof source!=='string')return undefined;
  const file=ts.createSourceFile('path.ts',`const value = (${source});`,ts.ScriptTarget.Latest,true);
  if(file.parseDiagnostics.length || file.statements.length!==1)return undefined;
  const statement=file.statements[0];
  if(!ts.isVariableStatement(statement) || statement.declarationList.declarations.length!==1)return undefined;
  const fn=unwrap(statement.declarationList.declarations[0].initializer);
  if(!ts.isArrowFunction(fn) || fn.modifiers?.length || fn.parameters.length!==1)return undefined;
  const parameter=fn.parameters[0];
  if(parameter.initializer || parameter.dotDotDotToken || !ts.isObjectBindingPattern(parameter.name) || parameter.name.elements.length!==1)return undefined;
  const binding=parameter.name.elements[0];
  if(binding.initializer || binding.dotDotDotToken || !ts.isIdentifier(binding.name))return undefined;
  const key=binding.propertyName??binding.name;
  if(!ts.isIdentifier(key))return undefined;
  const body=unwrap(fn.body);
  const operands=[];
  if(ts.isTemplateExpression(body)) {
    if(body.templateSpans.length!==1)return undefined;
    const span=body.templateSpans[0];
    if(!ts.isIdentifier(span.expression) || span.expression.text!==binding.name.text)return undefined;
    operands.push(body.head.text,null,span.literal.text);
  } else {
    function flatten(node) {
      if(ts.isBinaryExpression(node) && node.operatorToken.kind===ts.SyntaxKind.PlusToken) {
        return flatten(node.left) && flatten(node.right);
      }
      if(ts.isStringLiteral(node) && !node.text.includes('\0')) {operands.push(node.text);return true;}
      if(ts.isIdentifier(node) && node.text===binding.name.text) {operands.push(null);return true;}
      return false;
    }
    if(!flatten(body))return undefined;
  }
  if(operands.filter(value=>value===null).length!==1)return undefined;
  const segments=operands.map(value=>value===null?'\0':value).join('').split('/');
  if(segments.some(segment=>!segment || ['.','..'].includes(segment) || /[\\:]/.test(segment)))return undefined;
  return segments.map(segment=>{
    const at=segment.indexOf('\0');
    if(at<0)return segment;
    const before=segment.slice(0,at),after=segment.slice(at+1);
    if(!before && !after)return {input:key.text};
    return {concat:[...(before?[{literal:before}]:[]),{input:key.text},...(after?[{literal:after}]:[])]};
  });
}
