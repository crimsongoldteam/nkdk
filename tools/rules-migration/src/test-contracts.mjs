import { ts, walk, literal, location } from './syntax.mjs';

function callRoot(node) {
  if (ts.isCallExpression(node)) return callRoot(node.expression);
  if (ts.isPropertyAccessExpression(node)) return callRoot(node.expression);
  return ts.isIdentifier(node) ? node.text : '';
}

export function testContracts(file) {
  const tests = [];
  walk(file, node => {
    if (!ts.isCallExpression(node) || !['it', 'test'].includes(callRoot(node))) return;
    const body = node.arguments.find(a => ts.isArrowFunction(a) || ts.isFunctionExpression(a));
    if (!body) return;
    const assertions = [];
    walk(body.body, inner => {
      if (!ts.isCallExpression(inner) || !ts.isPropertyAccessExpression(inner.expression) || callRoot(inner.expression) !== 'expect') return;
      assertions.push({ matcher: inner.expression.name.text, expected: inner.arguments.map(a => a.getText()).join(', '),
        literal: inner.arguments.length > 0 && inner.arguments.every(literal), source: location(inner) });
    });
    const table = ts.isCallExpression(node.expression) ? node.expression.arguments[0] : undefined;
    tests.push({ title: node.arguments[0]?.getText(), source: location(node),
      tableRows: table && ts.isArrayLiteralExpression(table) ? table.elements.length : null,
      table: table?.getText(), assertions,
      extraction: assertions.length > 0 && assertions.every(a => a.literal) ? 'literal-candidate' : 'requires-review' });
  });
  return tests;
}
