import { sourceProgram } from './source-program.mjs';
import { createHash } from 'node:crypto';
import { ts, unwrap, walk, location } from './syntax.mjs';
import { testContracts } from './test-contracts.mjs';

export function inventory(sources) {
  const {parsed, options, host, target} = sourceProgram(sources);
  const files = [];
  for (const [name, file] of parsed) {
    const result = { path: name.slice(1), sha256: createHash('sha256').update(file.text).digest('hex'),
      imports: [], definitions: [], objects: [], calls: [], expressions: [], blockers: [], tests: testContracts(file),
      parseErrors: (file.parseDiagnostics ?? []).map(d => ({start: d.start, message: ts.flattenDiagnosticMessageText(d.messageText, '\n')})) };
    function propertyValue(owner, key, stack) {
      if (stack.has(owner)) return {known: false};
      const next = new Set([...stack, owner]);
      for (const property of [...owner.properties].reverse()) {
        if (ts.isSpreadAssignment(property)) {
          const spread = resolve(property.expression, next);
          if (!spread || !ts.isObjectLiteralExpression(spread)) return {known: false};
          const found = propertyValue(spread, key, next);
          if (!found.known || found.value) return found;
        } else if (property.name && ts.isComputedPropertyName(property.name)) return {known: false};
        else if (property.name?.text === key) return {known: true, value: property.initializer ?? property.name};
      }
      return {known: true};
    }
    function resolve(node, stack = new Set()) {
      node = unwrap(node);
      if (!node) return undefined;
      if (stack.has(node)) { result.blockers.push({reason: 'cyclic-reference', source: location(node)}); return undefined; }
      const next = new Set([...stack, node]);
      if (ts.isPropertyAccessExpression(node)) {
        const owner = resolve(node.expression, next);
        if (owner && ts.isObjectLiteralExpression(owner)) {
          const property = propertyValue(owner, node.name.text, next);
          if (!property.known) return node;
          if (property.value) return resolve(property.value, next);
        }
      }
      if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) {
        const declaration = target(node);
        if (declaration?.initializer) return resolve(declaration.initializer, next);
      }
      return node;
    }
    function fields(node, active = new Set()) {
      node = resolve(node);
      if (!node || !ts.isObjectLiteralExpression(node)) return undefined;
      if (active.has(node)) { result.blockers.push({reason: 'cyclic-spread', source: location(node)}); return undefined; }
      const next = new Set([...active, node]), values = new Map(), overrides = [];
      for (const property of node.properties) {
        let entries;
        if (ts.isSpreadAssignment(property)) {
          const inherited = fields(property.expression, next);
          if (!inherited) result.blockers.push({reason: 'unresolved-spread', expression: property.expression.getText(), source: location(property)});
          entries = inherited?.fields ?? [];
          overrides.push(...(inherited?.overrides ?? []));
        } else if (property.name && !ts.isComputedPropertyName(property.name)) {
          entries = [{name: property.name.text ?? property.name.getText(), source: location(property),
            expression: (property.initializer ?? property.name).getText(),
            kind: ts.SyntaxKind[unwrap(property.initializer ?? property).kind]}];
        } else {
          result.blockers.push({reason: 'computed-property', source: location(property)});
          entries = [];
        }
        for (const entry of entries) {
          if (values.has(entry.name)) overrides.push({name: entry.name, previous: values.get(entry.name).source, next: entry.source});
          values.set(entry.name, entry);
        }
      }
      return {fields: [...values.values()], overrides};
    }
    walk(file, node => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        const resolved = ts.resolveModuleName(specifier, name, options, host).resolvedModule?.resolvedFileName;
        const clause = node.importClause, bindings = [];
        if (clause?.name) bindings.push({local: clause.name.text, imported: 'default'});
        if (clause?.namedBindings) {
          if (ts.isNamedImports(clause.namedBindings)) for (const b of clause.namedBindings.elements) bindings.push({local: b.name.text, imported: b.propertyName?.text ?? b.name.text});
          else bindings.push({local: clause.namedBindings.name.text, imported: '*'});
        }
        const allTypeBindings = clause?.namedBindings && ts.isNamedImports(clause.namedBindings) &&
          !clause.name && clause.namedBindings.elements.length > 0 && clause.namedBindings.elements.every(b => b.isTypeOnly);
        result.imports.push({specifier, resolved: resolved?.slice(1) ?? null, bindings, typeOnly: Boolean(clause?.isTypeOnly || node.isTypeOnly || allTypeBindings)});
        if (!resolved && specifier.startsWith('.')) result.blockers.push({reason: 'unresolved-relative-import', specifier, source: location(node)});
      }
      if ((ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) && node.name) {
        const topLevel = ts.isVariableDeclaration(node) ? ts.isSourceFile(node.parent.parent.parent) : ts.isSourceFile(node.parent);
        result.definitions.push({name: node.name.getText(), kind: ts.SyntaxKind[node.kind], source: location(node), topLevel});
        // Resolve aliases independently too, so cycles are reported without needing a spread consumer.
        if (node.initializer) resolve(node.initializer);
      }
      if (ts.isObjectLiteralExpression(node)) {
        const parent = node.parent;
        const objectName = parent.name?.getText() ?? `@${location(node).line}:${location(node).column}`;
        result.objects.push({name: objectName, source: location(node), ...fields(node)});
      }
      if (ts.isPropertyAssignment(node) && node.name.getText() === 'properties' && !ts.isObjectLiteralExpression(unwrap(node.initializer))) {
        const inherited = fields(node.initializer);
        if (inherited) result.objects.push({name: 'properties', source: location(node), ...inherited});
        else result.blockers.push({reason: 'unresolved-properties', source: location(node), expression: node.initializer.getText()});
      }
      if (ts.isCallExpression(node)) {
        const declaration = target(node.expression);
        result.calls.push({callee: node.expression.getText(), target: declaration ? location(declaration) : null,
          source: location(node), arguments: node.arguments.map(a => ({kind: ts.SyntaxKind[unwrap(a).kind], text: a.getText()}))});
      }
      if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isConditionalExpression(node) || ts.isTemplateExpression(node) || ts.isSpreadAssignment(node))
        result.expressions.push({kind: ts.SyntaxKind[node.kind], source: location(node), text: node.getText()});
    });
    result.blockers = [...new Map(result.blockers.map(b => [JSON.stringify(b), b])).values()];
    files.push(result);
  }
  return {version: 1, parser: `typescript@${ts.version}`, scope: 'static inventory; no runtime execution or migration readiness inferred', files};
}
