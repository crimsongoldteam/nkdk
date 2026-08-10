const runtimePublicEntries = new Set([
  "packages/runtime/index.ts",
  "packages/runtime/rule-kit.ts",
  "packages/runtime/worker.ts",
])

export function findRuntimeInternalImports(result) {
  return result.modules.flatMap((module) => {
    if (!module.source.startsWith("packages/rules/")) return []
    return module.dependencies.flatMap((dependency) =>
      dependency.resolved.startsWith("packages/runtime/") &&
      !runtimePublicEntries.has(dependency.resolved)
        ? [{ from: module.source, to: dependency.resolved }]
        : [],
    )
  })
}

export function reportRuntimeInternalImports(result) {
  const imports = findRuntimeInternalImports(result)
  if (imports.length === 0) return
  console.warn(
    `Уведомление: rules напрямую импортирует внутренние файлы runtime (${imports.length}):\n${imports
      .map(({ from, to }) => `- ${from} -> ${to}`)
      .join("\n")}`,
  )
}
