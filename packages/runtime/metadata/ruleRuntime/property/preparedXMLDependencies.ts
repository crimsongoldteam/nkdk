import type { DependentImportFacts } from "./dependentItemRegistry"

const active = new WeakMap<object, DependentImportFacts>()

/** Факты зависимостей не подменяют значения или присутствие полей YAML. */
export function preparedXMLDependencyFacts(yaml: unknown): DependentImportFacts | undefined {
  return yaml !== null && typeof yaml === "object" ? active.get(yaml) : undefined
}

export function withPreparedXMLDependencyFacts<Result>(
  yaml: object,
  facts: DependentImportFacts | undefined,
  run: () => Result,
): Result {
  if (facts === undefined) return run()
  const previous = active.get(yaml)
  active.set(yaml, facts)
  try { return run() } finally {
    if (previous === undefined) active.delete(yaml)
    else active.set(yaml, previous)
  }
}
