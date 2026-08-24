import type { XmlAnomalyAnnotations } from "@nkdk/runtime"
import type { ImportedIssueDecision } from "./classifyImportedIssues"

export function applyImportedIssueDecisions(params: {
  readonly data: unknown
  readonly annotations: XmlAnomalyAnnotations
  readonly decisions: readonly ImportedIssueDecision[]
}): void {
  for (const decision of params.decisions) {
    if (decision.target.kind === "occurrence") {
      throw new Error("Решение для повтора должно применяться к сохранённому ключу коллекции")
    }
    const parentPath = decision.target.path.slice(0, -1)
    const key = decision.target.path.at(-1)
    const parent = valueAtPath(params.data, parentPath)
    if (!isRecord(parent) || typeof key !== "string") {
      throw new Error(`Не найдена YAML-граница /${decision.target.path.join("/")} для ${decision.issueCodes.join(", ")}`)
    }
    if (decision.target.kind === "missing" && !Object.prototype.hasOwnProperty.call(parent, key)) {
      parent[key] = undefined
    }
    const current = params.annotations.at(parent, key)
    if (current?.kind === "raw") {
      if (current.hasSemanticValue !== true) {
        throw new Error(`Нельзя назначить ${decision.kind} raw без смыслового значения`)
      }
      params.annotations.set(parent, key, {
        ...current,
        semantic: { kind: decision.kind, occurrence: 1 },
      })
      continue
    }
    params.annotations.set(parent, key, {
      kind: decision.kind,
      occurrence: 1,
      target: "value",
    })
  }
}

function valueAtPath(root: unknown, path: readonly (string | number)[]): unknown {
  let value = root
  for (const segment of path) {
    if (typeof value !== "object" || value === null) return undefined
    value = (value as Record<string | number, unknown>)[segment]
  }
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
