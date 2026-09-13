import { createRequire } from 'node:module';

// Reuse the project's explicitly pinned compiler API; TS 7 has no JS compiler API.
export const ts = createRequire(new URL('../../dependency-cruiser/package.json', import.meta.url))('typescript');

export function unwrap(node) {
  while (node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node))) node = node.expression;
  return node;
}

export function walk(node, visit) {
  visit(node);
  ts.forEachChild(node, child => walk(child, visit));
}

export function location(node) {
  const file = node.getSourceFile();
  const start = file.getLineAndCharacterOfPosition(node.getStart());
  return { path: file.fileName.replace(/^\//, ''), line: start.line + 1, column: start.character + 1 };
}

export function literal(node) {
  node = unwrap(node);
  if (!node) return false;
  if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node) ||
      [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.kind)) return true;
  if (ts.isPrefixUnaryExpression(node)) return literal(node.operand);
  if (ts.isArrayLiteralExpression(node)) return node.elements.every(literal);
  if (ts.isObjectLiteralExpression(node)) return node.properties.every(p => ts.isPropertyAssignment(p) && literal(p.initializer));
  return false;
}
