import type { ImportDiagnostic } from "../workerPool/importContracts"
import { validationIssueTargetKey } from "@nkdk/runtime"
import type { ImportedIssueDecision } from "./classifyImportedIssues"
import { importedYamlValueAtPath } from "./yamlPathValue"

export interface BoundaryIssueDecision {
  readonly source: ImportedIssueDecision
  readonly local: ImportedIssueDecision
}

/** Первый проход переносит только решения, зависящие от общего индекса проекта. */
export function portableFirstPassIssueDecision(
  decision: ImportedIssueDecision,
): ImportedIssueDecision | undefined {
  const issueCodes = decision.issueCodes.filter((code) =>
    !code.startsWith("schema.")
    && !code.startsWith("rules.")
    && !code.startsWith("xml/")
    && code !== "diagnostic.structure",
  )
  return issueCodes.length === 0 ? undefined : { ...decision, issueCodes }
}

/** Заменяет временные числовые адреса именованных коллекций их окончательными ключами. */
export function normalizeImportedIssueDecisionPath(
  data: unknown,
  decision: ImportedIssueDecision,
): ImportedIssueDecision {
  const path: Array<string | number> = []
  let current = data
  for (const segment of decision.target.path) {
    const resolved = typeof segment === "number" && isRecord(current)
      ? Object.keys(current)[segment] ?? segment
      : segment
    path.push(resolved)
    current = childAt(current, resolved)
  }
  return { ...decision, target: { ...decision.target, path } }
}

/** Выбирает решения, принадлежащие уже готовой YAML-границе, и делает их пути локальными. */
export function selectImportedIssueDecisionsForBoundary(params: {
  readonly data: unknown
  readonly yamlPath: readonly (string | number)[]
  readonly decisions: readonly ImportedIssueDecision[]
}): readonly BoundaryIssueDecision[] {
  return params.decisions.flatMap((decision) => {
    if (
      params.yamlPath.length > decision.target.path.length
      || !params.yamlPath.every((segment, index) => decision.target.path[index] === segment)
    ) return []
    const target = { ...decision.target, path: decision.target.path.slice(params.yamlPath.length) }
    if (!hasDecisionBoundary(params.data, target)) return []
    return [{ source: decision, local: { ...decision, target } }]
  })
}

/** Отбрасывает решения первого прохода, которые готовые зависимости уже разрешили. */
export function selectReadyImportedIssueDecisions(params: {
  readonly data: unknown
  readonly decisions: readonly ImportedIssueDecision[]
  readonly diagnostics: readonly ImportDiagnostic[]
  readonly confirmedDecisions?: readonly ImportedIssueDecision[]
}): readonly ImportedIssueDecision[] {
  const confirmedReferenceTargets = new Set((params.confirmedDecisions ?? [])
    .filter(({ issueCodes }) => issueCodes.includes("diagnostic.reference"))
    .map(({ target }) => validationIssueTargetKey(target)))
  return params.decisions.filter((decision) => {
    if (decision.issueCodes.includes("diagnostic.reference")) {
      return confirmedReferenceTargets.has(validationIssueTargetKey(decision.target))
    }
    if (!decision.issueCodes.includes("data-path.unresolved")) return true
    const value = importedYamlValueAtPath(params.data, decision.target.path)
    return typeof value === "string" && params.diagnostics.some((diagnostic) =>
      diagnostic.code === "unresolved_data_path" && diagnostic.value === value,
    )
  })
}

function hasDecisionBoundary(
  data: unknown,
  target: ImportedIssueDecision["target"],
): boolean {
  if (target.path.length === 0) return true
  const parent = importedYamlValueAtPath(data, target.path.slice(0, -1))
  if (parent === null || typeof parent !== "object") return false
  const key = target.path.at(-1)!
  if (target.kind === "missing") return true
  return Object.prototype.hasOwnProperty.call(parent, key)
}

function childAt(value: unknown, key: string | number): unknown {
  if (value === null || typeof value !== "object") return undefined
  return (value as Record<string | number, unknown>)[key]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
