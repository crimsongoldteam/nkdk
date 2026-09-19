import { ts, unwrap, location } from './syntax.mjs';
import { reviewedHelper } from './reviewed-helpers.mjs';
import { createHash } from 'node:crypto';

export function evaluator(program) {
  let steps = 0;
  const unknown = (node, reason) => ({kind:'unknown', reason, source: node && location(node)});
  const scalar = value => ({kind:'scalar', value});
  function evaluate(input, env = new Map(), active = new Set()) {
    const node = unwrap(input);
    if (!node) return scalar(undefined);
    if (++steps > 100000 || active.size > 128) return unknown(node, 'evaluation-budget');
    if (active.has(node)) return unknown(node, 'cyclic-reference');
    const next = new Set([...active, node]);
    const run = value => evaluate(value, env, next);
    if (ts.isStringLiteralLike(node)) return scalar(node.text);
    if (ts.isTemplateExpression(node)) {
      let text=node.head.text;
      for(const span of node.templateSpans) {
        const value=run(span.expression);
        if(value.kind!=='scalar' || (value.value!==null && !['string','number','boolean','undefined'].includes(typeof value.value)) || (typeof value.value==='number' && !Number.isFinite(value.value)))return unknown(span.expression,'nonliteral-template-part');
        text+=String(value.value)+span.literal.text;
      }
      return scalar(text);
    }
    if (ts.isNumericLiteral(node)) return scalar(Number(node.text));
    if (node.kind === ts.SyntaxKind.TrueKeyword) return scalar(true);
    if (node.kind === ts.SyntaxKind.FalseKeyword) return scalar(false);
    if (node.kind === ts.SyntaxKind.NullKeyword) return scalar(null);
    if (ts.isIdentifier(node)) {
      const declaration = program.target(node);
      if (env.has(declaration)) return env.get(declaration);
      if (!declaration && node.text === 'undefined') return scalar(undefined);
      if (declaration && ts.isBindingElement(declaration) && ts.isObjectBindingPattern(declaration.parent) && ts.isVariableDeclaration(declaration.parent.parent)) {
        const source=run(declaration.parent.parent.initializer);
        if(source.kind!=='object' || !source.complete)return unknown(node,'unknown-destructured-object');
        const keyOf=element=>{
          const key=element.propertyName??element.name;
          return ts.isIdentifier(key)||ts.isStringLiteral(key)?key.text:undefined;
        };
        if(declaration.dotDotDotToken) {
          const excluded=declaration.parent.elements.filter(e=>!e.dotDotDotToken).map(keyOf);
          if(excluded.includes(undefined))return unknown(node,'dynamic-destructuring-key');
          return {...source,fields:new Map([...source.fields].filter(([key])=>!excluded.includes(key)))};
        }
        const key=keyOf(declaration);
        if(key===undefined)return unknown(node,'dynamic-destructuring-key');
        const value=source.fields.get(key)?.value??scalar(undefined);
        return value.kind==='scalar'&&value.value===undefined&&declaration.initializer?run(declaration.initializer):value;
      }
      if (declaration?.initializer) {
        const value=run(declaration.initializer);
        return value.kind==='object' ? {...value,reference:{path:location(declaration).path,symbol:declaration.name.getText()}} : value;
      }
      if (declaration && ts.isFunctionDeclaration(declaration)) {
        const symbol = program.checker.getSymbolAtLocation(declaration.name);
        const implementation = symbol?.declarations?.find(d => ts.isFunctionDeclaration(d) && d.body);
        return implementation ? {kind:'function', node:implementation, env} : unknown(node, 'function-without-body');
      }
      return unknown(node, 'unresolved-symbol');
    }
    if (ts.isTypeOfExpression(node)) {
      const value=run(node.expression);
      return value.kind==='scalar' ? scalar(typeof value.value) : ['array','object','function'].includes(value.kind) ? scalar(value.kind==='function'?'function':'object') : unknown(node,'dynamic-typeof');
    }
    if (ts.isElementAccessExpression(node)) {
      const object=run(node.expression), key=run(node.argumentExpression);
      if(object.kind==='array' && key.kind==='scalar' && Number.isInteger(key.value) && key.value>=0)
        return object.values[key.value] ?? scalar(undefined);
      return unknown(node,'dynamic-element-access');
    }
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return {kind:'function', node, env};
    if (ts.isPropertyAccessExpression(node)) {
      const member=program.namespaceMember(node);
      if(member?.initializer)return run(member.initializer);
      if(member && ts.isFunctionDeclaration(member))return {kind:'function',node:member,env};
      const owner = run(node.expression);
      if (owner.kind === 'object') return owner.fields.get(node.name.text)?.value ??
        (owner.complete ? scalar(undefined) : unknown(node, 'unknown-member'));
      return {...unknown(node, 'unresolved-member'), cause:owner.kind === 'unknown' ? owner : {kind:owner.kind}};
    }
    if (ts.isArrayLiteralExpression(node)) {
      const values = [];
      for (const item of node.elements) {
        const value = run(ts.isSpreadElement(item) ? item.expression : item);
        if (ts.isSpreadElement(item)) {
          if (value.kind !== 'array') return unknown(item, 'unknown-array-spread');
          values.push(...value.values);
        } else values.push(value);
      }
      return {kind:'array', values};
    }
    if (ts.isObjectLiteralExpression(node)) {
      const fields = new Map(), fragments = [], overrides = [], blockers = [];
      function assign(key, value) {
        if (fields.has(key)) overrides.push({name:key, previous:fields.get(key).source, next:value.source});
        fields.set(key, value);
      }
      for (const item of node.properties) {
        if (ts.isSpreadAssignment(item)) {
          const spread = run(item.expression);
          fragments.push({source:location(item), expression:item.expression.getText()});
          if (spread.kind !== 'object') { blockers.push({...unknown(item, 'unknown-object-spread'), cause:spread.kind === 'unknown' ? spread : {kind:spread.kind}}); continue; }
          blockers.push(...spread.blockers); fragments.push(...spread.fragments); overrides.push(...spread.overrides);
          for (const [key, value] of spread.fields) assign(key, value);
        } else {
          if (!item.name || ts.isComputedPropertyName(item.name)) { blockers.push(unknown(item, 'computed-key')); continue; }
          let value;
          if (ts.isShorthandPropertyAssignment(item)) {
            const declaration = program.checker.getShorthandAssignmentValueSymbol(item)?.valueDeclaration;
            value = env.get(declaration) ?? (declaration?.initializer ? run(declaration.initializer) : unknown(item, 'unresolved-shorthand'));
          } else value = ts.isPropertyAssignment(item) ? run(item.initializer) : unknown(item, 'unsupported-property-member');
          assign(item.name.text, {value, source:location(item)});
        }
      }
      return {kind:'object', fields, fragments, overrides, blockers, complete:blockers.length === 0};
    }
    if (ts.isConditionalExpression(node)) {
      const condition = run(node.condition);
      return condition.kind === 'scalar' ? run(condition.value ? node.whenTrue : node.whenFalse) : unknown(node, 'dynamic-condition');
    }
    if (ts.isBinaryExpression(node)) {
      const left = run(node.left), right = run(node.right);
      const equality = node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken;
      const inequality = node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken;
      if (equality || inequality) {
        if (left.kind === 'scalar' && right.kind === 'scalar')
          return scalar(inequality ? left.value !== right.value : left.value === right.value);
        if ((left.kind === 'scalar') !== (right.kind === 'scalar')) return scalar(inequality);
        return unknown(node, 'dynamic-operation');
      }
      if (left.kind !== 'scalar' || right.kind !== 'scalar') return unknown(node, 'dynamic-operation');
      return unknown(node, 'unsupported-operation');
    }
    if (ts.isCallExpression(node)) {
      if(ts.isPropertyAccessExpression(node.expression) && node.expression.name.text==='replace' && node.arguments.length===2) {
        const receiver=run(node.expression.expression),replacement=run(node.arguments[1]),pattern=unwrap(node.arguments[0]);
        if(receiver.kind==='scalar' && typeof receiver.value==='string' && replacement.kind==='scalar' && typeof replacement.value==='string' && ts.isRegularExpressionLiteral(pattern)) {
          const end=pattern.text.lastIndexOf('/');
          try {return scalar(receiver.value.replace(new RegExp(pattern.text.slice(1,end),pattern.text.slice(end+1)),replacement.value));}
          catch {return unknown(node,'invalid-static-regexp');}
        }
      }
      // Only these pure builtins are recognized, and only when Object is not shadowed.
      if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === 'Object' && !program.target(node.expression.expression)) {
        const argument = run(node.arguments[0]);
        if (node.arguments.length === 1 && node.expression.name.text === 'freeze') return argument;
        if (node.arguments.length === 1 && node.expression.name.text === 'entries' && argument.kind === 'object' && argument.complete)
          return {kind:'array',values:[...argument.fields].map(([key,field])=>({kind:'array',values:[scalar(key),field.value],source:field.source}))};
        if (node.arguments.length === 1 && node.expression.name.text === 'fromEntries' && argument.kind === 'array') {
          const fields=new Map(),overrides=[];
          for(const pair of argument.values) {
            if(pair.kind!=='array' || pair.values.length!==2 || pair.values[0].kind!=='scalar' || typeof pair.values[0].value!=='string') return unknown(node,'unsupported-entry');
            const key=pair.values[0].value, source=pair.source??location(node);
            if(fields.has(key))overrides.push({name:key,previous:fields.get(key).source,next:source});
            fields.set(key,{value:pair.values[1],source});
          }
          return {kind:'object',fields,fragments:[],overrides,blockers:[],complete:true};
        }
        if (node.arguments.length === 1 && node.expression.name.text === 'keys' && argument.kind === 'object' && argument.complete)
          return {kind:'array', values:[...argument.fields.keys()].map(scalar)};
      }
      if(ts.isPropertyAccessExpression(node.expression) && ['slice','indexOf'].includes(node.expression.name.text)) {
        const receiver=run(node.expression.expression),args=node.arguments.map(run);
        if(receiver.kind==='array' && args.every(arg=>arg.kind==='scalar')) {
          if(node.expression.name.text==='slice' && args.length<=2 && args.every(arg=>arg.value===undefined || Number.isSafeInteger(arg.value)))
            return {kind:'array',values:receiver.values.slice(...args.map(arg=>arg.value))};
          if(node.expression.name.text==='indexOf' && args.length===1 && receiver.values.every(value=>value.kind==='scalar'))
            return scalar(receiver.values.findIndex(value=>value.value===args[0].value));
        }
        return unknown(node,'dynamic-array-operation');
      }
      function invoke(fn,args) {
      if (fn.kind !== 'function') return unknown(node, 'unknown-call');
      if (fn.node.asteriskToken || fn.node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword)) return unknown(node, 'non-synchronous-function');
      const unknownArgument = args.find(a => a.kind === 'unknown');
      if (unknownArgument) return {...unknown(node, 'unknown-call-argument'), cause:unknownArgument};
      const reviewed = reviewedHelper(fn.node, args);
      if (reviewed) return reviewed;
      const local = new Map(fn.env);
      for (let i = 0; i < fn.node.parameters.length; i++) {
        const parameter = fn.node.parameters[i];
        if (parameter.dotDotDotToken) return unknown(parameter, 'unsupported-parameter');
        const argument = args[i] ?? scalar(undefined);
        if (ts.isIdentifier(parameter.name)) {
          local.set(parameter, argument.kind === 'scalar' && argument.value === undefined ? evaluate(parameter.initializer, local, next) : argument);
        } else if (ts.isArrayBindingPattern(parameter.name) && argument.kind === 'array') {
          for (const [index,element] of parameter.name.elements.entries()) {
            if (!ts.isBindingElement(element) || !ts.isIdentifier(element.name) || element.dotDotDotToken || element.initializer) return unknown(element,'unsupported-binding');
            local.set(element,argument.values[index]??scalar(undefined));
          }
        } else return unknown(parameter,'unsupported-parameter');
      }
      const body = fn.node.body;
      if (!ts.isBlock(body)) return evaluate(body, local, next);
      for (const statement of body.statements) {
        if (ts.isReturnStatement(statement)) return evaluate(statement.expression, local, next);
        if (ts.isVariableStatement(statement) && (statement.declarationList.flags & ts.NodeFlags.Const)) {
          for (const declaration of statement.declarationList.declarations) {
            if (!ts.isIdentifier(declaration.name)) return unknown(statement, 'unsupported-binding');
            const initial = evaluate(declaration.initializer, local, next);
            if (initial.kind === 'unknown') return initial;
            local.set(declaration, initial);
          }
        } else return unknown(statement, 'unsupported-function-statement');
      }
      return scalar(undefined);
      }
      if(ts.isPropertyAccessExpression(node.expression) && node.expression.name.text==='map' && node.arguments.length===1) {
        const receiver=run(node.expression.expression), callback=run(node.arguments[0]);
        if(receiver.kind==='array') return {kind:'array',values:receiver.values.map((value,index)=>{
          const result=invoke(callback,[value,scalar(index),receiver]);
          return {...result,...(value.source?{source:value.source}:{})};
        })};
      }
      return invoke(run(node.expression),node.arguments.map(run));
    }
    return unknown(node, `unsupported-${ts.SyntaxKind[node.kind]}`);
  }
  return (node, env = new Map()) => { steps = 0; return evaluate(node, env); };
}

export function serialize(value, issues = []) {
  if (value.kind === 'scalar') return value.value === undefined ? {$undefined:true} : value.value;
  if (value.kind === 'array') return value.values.map(v => serialize(v, issues));
  if (value.kind === 'object') {
    issues.push(...value.blockers);
    return Object.fromEntries([...value.fields].map(([key, field]) => [key, serialize(field.value, issues)]));
  }
  const issue = value.kind === 'function' ? {
    kind:'expression',
    source:location(value.node),
    sourceHash:createHash('sha256').update(value.node.getSourceFile().text).digest('hex'),
    expression:value.node.getText(),
  } : value;
  issues.push(issue);
  return {$unresolved:issue};
}
