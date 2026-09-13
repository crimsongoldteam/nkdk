import { ts } from './syntax.mjs';

export function sourceProgram(sources) {
  const parsed = new Map(Object.entries(sources).sort(([a], [b]) => a.localeCompare(b, 'en')).map(([name, text]) =>
    [`/${name}`, ts.createSourceFile(`/${name}`, text, ts.ScriptTarget.Latest, true)]));
  const options = { paths: {'@nkdk/runtime/rule-kit':['/packages/runtime/rule-kit.ts']}, noLib: true, noResolve: false, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext };
  const host = { getSourceFile: name => parsed.get(name), getDefaultLibFileName: () => '', writeFile: () => {},
    getCurrentDirectory: () => '/', getDirectories: () => [], fileExists: name => parsed.has(name),
    readFile: name => parsed.get(name)?.text, getCanonicalFileName: name => name, useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n', directoryExists: dir => [...parsed.keys()].some(name => name.startsWith(dir.endsWith('/') ? dir : `${dir}/`)) };
  const program = ts.createProgram([...parsed.keys()], options, host);
  const checker = program.getTypeChecker();
  function target(node) {
    let symbol = checker.getSymbolAtLocation(node);
    if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    return symbol?.valueDeclaration;
  }
  function namespaceMember(node) {
    let symbol=checker.getSymbolAtLocation(node.expression);
    if(symbol?.flags & ts.SymbolFlags.Alias)symbol=checker.getAliasedSymbol(symbol);
    return symbol?.flags & ts.SymbolFlags.Module ? target(node.name) : undefined;
  }
  return {parsed, options, host, checker, target, namespaceMember};
}
