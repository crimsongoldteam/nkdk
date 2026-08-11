import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { compileMetadataResourceTopologyForProjectSpecs } from "../resourceTopology/adapters/ruleTopology"
import { getConfigurationValidationProjectSpec, getValidationProjectSpecs } from "./projectSpecs"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"

export interface ProjectValidationFormRule {
  readonly key: string
  readonly rule: MetadataItemRule
}

export function registeredProjectValidationFormRules(): ProjectValidationFormRule[] {
  const rules = currentRuleRegistrySet<RuleRegistrySet>()
  if (rules !== undefined) {
    const byRule = new Map<MetadataItemRule, ProjectValidationFormRule>()
    for (const assignment of compileMetadataResourceTopologyForProjectSpecs(
      [...rules.projectSpecs.values()],
      rules.property,
    ).assignments) {
      if (assignment.role !== "fileItem" || byRule.has(assignment.itemRule)) continue
      byRule.set(assignment.itemRule, { key: assignment.id, rule: assignment.itemRule })
    }
    return [...byRule.values()]
  }
  const byRule = new Map<MetadataItemRule, ProjectValidationFormRule>()
  const configuration = getConfigurationValidationProjectSpec()
  for (const assignment of compileMetadataResourceTopologyForProjectSpecs([
    ...(configuration === undefined ? [] : [configuration]),
    ...getValidationProjectSpecs(),
  ])
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
