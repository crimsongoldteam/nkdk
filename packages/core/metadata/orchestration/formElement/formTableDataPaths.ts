export function collectFormTableDataPathsFromYAML(
  yaml: unknown
): ReadonlyMap<string, string> {
  const result = new Map<string, string>()
  collectTableDataPaths(asRecord(yaml)?.["Элементы"], result)
  return result
}

function collectTableDataPaths(
  value: unknown,
  result: Map<string, string>
): void {
  for (const [name, rawElement] of Object.entries(asRecord(value) ?? {})) {
    const element = asRecord(rawElement)
    if (element?.["Вид"] === "ТаблицаФормы") {
      const dataPath = element["ПутьКДанным"]
      if (
        typeof dataPath === "string" &&
        dataPath.trim().length > 0 &&
        !result.has(name)
      ) {
        result.set(name, dataPath)
      }
    }
    collectTableDataPaths(element?.["Элементы"], result)
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
