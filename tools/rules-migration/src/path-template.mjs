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
  if(!ts.isTemplateExpression(body) || body.head.text!=='' || body.templateSpans.length!==1)return undefined;
  const span=body.templateSpans[0];
  if(!ts.isIdentifier(span.expression) || span.expression.text!==binding.name.text)return undefined;
  const parts=span.literal.text.split('/');
  if(parts.shift()!=='' || !parts.length || parts.some(part=>!part || ['.','..'].includes(part) || /[\\\0:]/.test(part)))return undefined;
  return [{input:key.text},...parts];
}
