import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"

export interface ProjectValidationFormRule {
  readonly key: string
  readonly rule: MetadataItemRule
}

export function registeredProjectValidationFormRules(): ProjectValidationFormRule[] {
  const byRule = new Map<MetadataItemRule, ProjectValidationFormRule>()
  for (const assignment of compileRegisteredMetadataResourceTopology()
    .assignments) {
    if (
      assignment.role !== "fileItem" ||
      byRule.has(assignment.itemRule)
    ) {
      continue
    }
    byRule.set(assignment.itemRule, {
      key: assignment.id,
      rule: assignment.itemRule,
    })
  }
  return [...byRule.values()]
}

export function projectValidationFormRuleKey(
  rule: MetadataItemRule
): string {
  const registered = registeredProjectValidationFormRules().find(
    (entry) => entry.rule === rule
  )
  if (registered === undefined) {
    throw new Error(
      `Не зарегистрирован вариант правила формы: ${rule.itemType}`
    )
  }
  return registered.key
}
