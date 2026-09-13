import { sourceProgram } from './source-program.mjs';
import { evaluator,serialize } from './static-value.mjs';
import { ts,walk,location,unwrap } from './syntax.mjs';

export function literalTables(path,text) {
  const program = sourceProgram({[path]:text}), evaluate = evaluator(program);
  const tables = [], pending = [], file = program.parsed.get(`/${path}`);
  walk(file,node => {
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression) || node.expression.name.text !== 'each') return;
    const value = evaluate(node.arguments[0]);
    if (value.kind !== 'array') { pending.push({source:location(node),reason:'dynamic-table'}); return; }
    const issues = [];
    tables.push({source:location(node),rows:serialize(value,issues),issues});
  });
  return {tables,pending};
}

export function booleanExpectations(path,text) {
  const program = sourceProgram({[path]:text}), evaluate = evaluator(program), result = [];
  walk(program.parsed.get(`/${path}`),node => {
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression) || node.expression.name.text !== 'toBe') return;
    const expect = node.expression.expression;
    if (!ts.isCallExpression(expect) || expect.expression.getText() !== 'expect') return;
    let actual = unwrap(expect.arguments[0]);
    if (actual && ts.isIdentifier(actual)) actual = unwrap(program.target(actual)?.initializer);
    if (!actual || !ts.isCallExpression(actual)) return;
    const operation = actual.expression.getText();
    if (!['importBooleanFromXML','exportBooleanToYAML','importBooleanFromYAML'].includes(operation)) return;
    const input = evaluate(actual.arguments.at(-1)), expected = evaluate(node.arguments[0]);
    if (input.kind === 'scalar' && expected.kind === 'scalar') result.push({operation,input:input.value,expected:expected.value,source:location(node)});
  });
  return result;
}

export function literalFixture(path,text,name) {
  const program = sourceProgram({[path]:text}), evaluate = evaluator(program);
  const file = program.parsed.get(`/${path}`);
  const declaration = file.statements.filter(ts.isVariableStatement).flatMap(s => [...s.declarationList.declarations]).find(d => d.name.getText() === name);
  if (!declaration) throw new Error(`Missing literal fixture ${name}`);
  const value = evaluate(declaration.initializer), issues = [];
  const data = serialize(value,issues);
  if (issues.length) throw new Error(`Nonliteral fixture ${name}`);
  return {source:location(declaration),data};
}
