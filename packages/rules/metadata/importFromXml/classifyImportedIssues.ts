import {
  validationIssueTargetKey,
  type ValidationIssue,
  type ValidationIssueTarget,
} from "@nkdk/runtime"
import type { ImportIssueDecision } from "../workerPool/importContracts"

export type ImportedIssueDecision = ImportIssueDecision

export function classifyImportedIssues(params: {
  readonly issues: readonly ValidationIssue[]
  readonly requiresImportant: (target: ValidationIssueTarget) => boolean
}): {
  readonly decisions: readonly ImportedIssueDecision[]
  readonly fatal: readonly ValidationIssue[]
} {
  const fatal = params.issues.filter(({ kind }) => kind === "infrastructure")
  const grouped = new Map<string, { target: ValidationIssueTarget; codes: Set<string> }>()
  for (const issue of params.issues) {
    if (issue.kind !== "semantic") continue
    const key = validationIssueTargetKey(issue.target)
    const group = grouped.get(key) ?? { target: issue.target, codes: new Set<string>() }
    group.codes.add(issue.code)
    grouped.set(key, group)
  }
  return {
    decisions: [...grouped.values()].map(({ target, codes }) => ({
      kind: params.requiresImportant(target) ? "important" : "invalid",
      target,
      issueCodes: [...codes].sort(),
    })),
    fatal,
  }
}
