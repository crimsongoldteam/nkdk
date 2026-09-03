import type { ImportDiagnostic } from "../workerPool/importContracts"
import type { ImportedIssueDecision } from "./classifyImportedIssues"
import { importedYamlValueAtPath } from "./yamlPathValue"

/** Отбрасывает решения первого прохода, которые готовые зависимости уже разрешили. */
export function selectReadyImportedIssueDecisions(params: {
  readonly data: unknown
  readonly decisions: readonly ImportedIssueDecision[]
  readonly diagnostics: readonly ImportDiagnostic[]
}): readonly ImportedIssueDecision[] {
  return params.decisions.filter((decision) => {
    if (!decision.issueCodes.includes("data-path.unresolved")) return true
    const value = importedYamlValueAtPath(params.data, decision.target.path)
    return typeof value === "string" && params.diagnostics.some((diagnostic) =>
      diagnostic.code === "unresolved_data_path" && diagnostic.value === value,
    )
  })
}
