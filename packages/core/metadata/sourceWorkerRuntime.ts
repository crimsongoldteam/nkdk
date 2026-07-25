export function sourceWorkerExecArgv(additionalImports: readonly string[] = []): string[] {
  const imports = [import.meta.resolve("tsx"), ...additionalImports]
  return imports.flatMap((specifier) => ["--import", specifier])
}
