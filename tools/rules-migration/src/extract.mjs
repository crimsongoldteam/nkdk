import { sourceProgram } from './source-program.mjs';
import { evaluator, serialize } from './static-value.mjs';
import { ts, location,unwrap } from './syntax.mjs';

export function extract(sources, requests) {
  const program = sourceProgram(sources), evaluate = evaluator(program);
  function literalTree(input) {
    const node=unwrap(input);
    return ts.isStringLiteralLike(node) || (ts.isNumericLiteral(node) && Number.isSafeInteger(Number(node.text))) ||
      [ts.SyntaxKind.TrueKeyword,ts.SyntaxKind.FalseKeyword,ts.SyntaxKind.NullKeyword].includes(node.kind) ||
      (ts.isArrayLiteralExpression(node) && node.elements.every(literalTree));
  }
  function parameters(value,issues,constantDefaults) {
    if(value.kind!=='object')return serialize(value,issues);
    issues.push(...value.blockers);
    return Object.fromEntries([...value.fields].map(([key,field])=>{
      const fn=field.value,node=fn.node;
      if(key==='defaultValue' && fn.kind==='function' && ts.isArrowFunction(node) && node.parameters.length===0 &&
        !node.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.AsyncKeyword) && literalTree(node.body)) {
        const problems=[],result=serialize(evaluate(node.body),problems);
        if(!problems.length) {
          constantDefaults.push(key);
          return [key,{$constantFunction:{value:result,source:location(node),expression:node.getText()}}];
        }
      }
      return [key,serialize(fn,issues)];
    }));
  }
  return requests.map(request => {
    const file = program.parsed.get(`/${request.path}`);
    const symbol = file && program.checker.getSymbolAtLocation(file);
    const exported = symbol && program.checker.getExportsOfModule(symbol).find(s => s.name === request.symbol);
    const resolved = exported && (exported.flags & ts.SymbolFlags.Alias ? program.checker.getAliasedSymbol(exported) : exported);
    const localDeclaration = file?.statements.filter(ts.isVariableStatement)
      .flatMap(s => [...s.declarationList.declarations]).find(d => d.name.getText() === request.symbol);
    const declaration = resolved?.valueDeclaration ?? localDeclaration;
    const value = declaration?.initializer ? evaluate(declaration.initializer) : {kind:'unknown', reason:'missing-export'};
    const itemType = value.kind === 'object' ? value.fields.get('itemType')?.value : undefined;
    const props = value.kind === 'object' ? value.fields.get('properties')?.value : value;
    const blockers = [...(value.blockers ?? []), ...(props?.blockers ?? [])];
    if (props?.kind !== 'object') blockers.push({reason:'unresolved-properties', detail: props?.reason});
    const order = value.kind === 'object' ? value.fields.get('xmlOrder')?.value : undefined;
    const xmlOrder = !order ? {status:'absent'} : order.kind === 'array' && order.values.every(v => v.kind === 'scalar' && typeof v.value === 'string')
      ? {status:'static',keys:order.values.map(v => v.value)} : {status:'unresolved'};
    return {...request, itemType:itemType?.kind==='scalar' && typeof itemType.value==='string'?itemType.value:null, exportStatus:!exported ? 'not-exported' : value.kind === 'object' && value.complete && !value.fields.has('properties') ? 'fragment-without-properties' : 'owner-candidate',
      source:declaration && location(declaration), xmlOrder, shapeComplete: value.kind === 'object' && value.complete && props?.kind === 'object' && props.complete,
      properties: props?.kind === 'object' ? [...props.fields].map(([name, field]) => {
        const issues = [], constantDefaults=[], encoded = parameters(field.value, issues,constantDefaults);
        return {name, source:field.source, type:encoded?.type ?? null, parameters:encoded, issues,...(constantDefaults.length?{constantDefaults}:{}),
          status:issues.length ? 'requires-expression-mapping' : 'static-parameters'};
      }) : [], fragments:props?.fragments ?? [], overrides:props?.overrides ?? [], blockers};
  });
}
