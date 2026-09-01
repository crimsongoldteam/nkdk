import type { XmlAnomalyAnnotations } from "@nkdk/runtime"
import type { ImportedIssueDecision } from "./classifyImportedIssues"

export function applyImportedIssueDecisions(params: {
  readonly data: unknown
  readonly annotations: XmlAnomalyAnnotations
  readonly decisions: readonly ImportedIssueDecision[]
}): void {
  for (const decision of params.decisions) {
    if (decision.target.path.length === 0) {
      const current = params.annotations.root()
      if (current?.kind === "raw") {
        if (current.hasSemanticValue !== true) {
          throw new Error(`Нельзя назначить ${decision.kind} корневому raw без смыслового значения`)
        }
        params.annotations.setRoot({
          ...current,
          semantic: { kind: decision.kind, occurrence: 1 },
        })
      } else {
        params.annotations.setRoot({ kind: decision.kind, occurrence: 1, target: "root" })
      }
      continue
    }
    if (decision.target.kind === "occurrence") {
      applyOccurrenceDecision(
        params.data,
        params.annotations,
        decision.kind,
        decision.target,
        decision.issueCodes,
      )
      continue
    }
    const parentPath = decision.target.path.slice(0, -1)
    const key = decision.target.path.at(-1)
    const parent = valueAtPath(params.data, parentPath)
    if (!isObject(parent) || (typeof key !== "string" && typeof key !== "number")) {
      throw new Error(`Не найдена YAML-граница /${decision.target.path.join("/")} для ${decision.issueCodes.join(", ")}`)
    }
    if (decision.target.kind === "missing" && typeof key === "string" && !Object.prototype.hasOwnProperty.call(parent, key)) {
      const mapping = parent as Record<string, unknown>
      mapping[key] = undefined
    }
    if (typeof key === "string" && params.annotations.keyAt(parent, key)?.kind === decision.kind) continue
    const current = params.annotations.at(parent, key)
    if (current?.kind === "raw") {
      if (current.hasSemanticValue !== true) continue
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

function applyOccurrenceDecision(
  data: unknown,
  annotations: XmlAnomalyAnnotations,
  kind: ImportedIssueDecision["kind"],
  target: Extract<ImportedIssueDecision["target"], { readonly kind: "occurrence" }>,
  issueCodes: readonly string[],
): void {
  const parent = valueAtPath(data, target.path.slice(0, -1))
  const logicalKey = target.path.at(-1)
  if (!isRecord(parent) || typeof logicalKey !== "string") {
    throw new Error(`Не найдена YAML-коллекция повтора /${target.path.join("/")}`)
  }
  const runtimeKey = Object.keys(parent).find((key) => {
    const annotation = annotations.keyAt(parent, key)
    return annotation?.logicalKey === logicalKey
      && annotation.occurrence === target.occurrence
  })
  if (runtimeKey === undefined) {
    throw new Error(`Не найден повтор ${target.occurrence} ключа /${target.path.join("/")} для ${issueCodes.join(", ")}`)
  }
  const current = annotations.keyAt(parent, runtimeKey)
  annotations.setKey(parent, runtimeKey, {
    kind: kind === "important" ? "important" : current?.kind ?? "invalid",
    occurrence: target.occurrence,
    target: "key",
    logicalKey,
  })
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

function isObject(value: unknown): value is Record<string, unknown> | unknown[] {
  return typeof value === "object" && value !== null
}
