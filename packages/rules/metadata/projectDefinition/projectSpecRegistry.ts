import { resolvePropertyItemRule } from "../ruleRuntime/property/typeRuleRegistry"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import type { RegisteredProjectSpec } from "./projectSpecContracts"
import { defineMetadataRules } from "../ruleRuntime/definition"
import type { MetadataRulesDefinition } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"

export type {
  ProjectSpecNesting,
  RegisteredProjectSpec,
} from "./projectSpecContracts"

export function defineProjectSpec(
  spec: RegisteredProjectSpec,
): MetadataRulesDefinition<never> {
  return defineMetadataRules({
    ...emptyMetadataRules,
    projectSpecs: { [spec.dir]: spec },
    schemas: {
      [spec.rule.itemType]: {
        source: spec.rule,
        export: ({ context, execution }) =>
          spec.exportSchema({
            context,
            execution,
            mode: context.exportToJSONSchema?.mode ?? "externalRefs",
          }),
      },
    },
  })
}

export function getRegisteredProjectSpecs(): readonly RegisteredProjectSpec[] {
  const contextual = currentRuleRegistrySet<{
    projectSpecs: ReadonlyMap<string, RegisteredProjectSpec>
  }>()
  return [...(contextual?.projectSpecs.values() ?? [])]
    .sort((left, right) => left.dir.localeCompare(right.dir, "ru"))
}

export function assertCoreMetadataRegistered(operation: string): void {
  if (getRegisteredProjectSpecs().length === 0) {
    throw new Error(`Metadata не зарегистрирована перед операцией ${operation}`)
  }
}

export function getRegisteredProjectSpecByDir(dir: string): RegisteredProjectSpec | undefined {
  return currentRuleRegistrySet<{
    projectSpecs: ReadonlyMap<string, RegisteredProjectSpec>
  }>()?.projectSpecs.get(dir)
}

export function findRegisteredProjectRule(itemType: string): MetadataItemRule | undefined {
  for (const spec of getRegisteredProjectSpecs()) {
    const rule = findProjectRule(spec.rule, itemType, new Set())
    if (rule !== undefined) return rule
  }
  return undefined
}

function findProjectRule(
  rule: MetadataItemRule,
  itemType: string,
  seen: Set<MetadataItemRule>
): MetadataItemRule | undefined {
  if (seen.has(rule)) return undefined
  seen.add(rule)
  if (rule.itemType === itemType) return rule
  for (const child of rule.childCollections ?? []) {
    for (const candidate of [child.fileItemRule, child.itemRule]) {
      if (candidate === undefined) continue
      const result = findProjectRule(candidate, itemType, seen)
      if (result !== undefined) return result
    }
  }
  for (const propertyRule of Object.values(rule.properties)) {
    const itemRule = resolvePropertyItemRule(propertyRule)
    if (itemRule === undefined) continue
    const result = findProjectRule(itemRule, itemType, seen)
    if (result !== undefined) return result
  }
  return undefined
}
