import type { FormDataPathTabularElementDeclaration } from "../dataPath/formIndex"

export function collectFormTabularElementsFromYAML(
  yaml: unknown
): ReadonlyMap<string, FormDataPathTabularElementDeclaration> {
  const result = new Map<string, FormDataPathTabularElementDeclaration>()
  collectTabularElements(asRecord(yaml)?.["Элементы"], result)
  return result
}

function collectTabularElements(
  value: unknown,
  result: Map<string, FormDataPathTabularElementDeclaration>
): void {
  for (const [name, rawElement] of Object.entries(asRecord(value) ?? {})) {
    const element = asRecord(rawElement)
    if (element?.["Вид"] === "ТаблицаФормы" || element?.["Вид"] === "ДеревоФормы") {
      const dataPath = element["ПутьКДанным"]
      if (!result.has(name)) {
        result.set(name, {
          kind: "tabularFormElement",
          ...(typeof dataPath === "string" && dataPath.trim().length > 0 ? { dataPath } : {}),
        })
      }
    }
    collectTabularElements(element?.["Элементы"], result)
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
