import { PropertyRuleType } from "./registry"
import type { CollectionItemRule, importExportFunction, TypeRulesOperations } from "./fn"
import type { PropertyTypeDefinition } from "../definition"
import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"

export { definePropertyTypeRule } from "./propertyRuleRegistrySet"

export interface RegisteredTypeRule {
  readonly type: PropertyRuleType
  readonly operation: TypeRulesOperations
  readonly handler: unknown
}

export const registerTypeRule = <O extends TypeRulesOperations>(
  type: PropertyRuleType,
  operation: O,
  ruleFunction: NonNullable<importExportFunction<O>>
) => {
  const registry = currentPropertyRuleRegistrySet<{
    registerTypeRule<Operation extends TypeRulesOperations>(
      propertyType: PropertyRuleType,
      operation: Operation,
      handler: NonNullable<importExportFunction<Operation>>,
    ): void
  }>()
  if (registry === undefined) throw new Error("Не задан execution context property rules")
  registry.registerTypeRule(type, operation, ruleFunction)
}

export const getRegisteredTypeRules = (): readonly RegisteredTypeRule[] => []

export function registerLegacyPropertyTypeDefinitions(
  definitions: Readonly<Record<string, PropertyTypeDefinition>>,
): void {
  for (const [type, definition] of Object.entries(definitions)) {
    for (const [operation, handler] of Object.entries(definition)) {
      registerTypeRule(
        type as PropertyRuleType,
        operation as TypeRulesOperations,
        handler as never,
      )
    }
  }
}

export const getTypeRule = <O extends TypeRulesOperations>(
  type: PropertyRuleType,
  operation: O
): importExportFunction<O> => {
  const contextual = currentPropertyRuleRegistrySet<{
    getTypeRule<Operation extends TypeRulesOperations>(
      propertyType: PropertyRuleType,
      operation: Operation,
    ): importExportFunction<Operation>
  }>()
  const result = contextual?.getTypeRule(type, operation)
  return result as importExportFunction<O>
}

type ResolvedPropertyItemRule = CollectionItemRule["itemRule"]

interface PropertyWithItemRule {
  type: PropertyRuleType
  itemRule?: ResolvedPropertyItemRule
}

export function resolvePropertyItemRule(
  propertyRule: PropertyWithItemRule,
  fallback?: ResolvedPropertyItemRule
): ResolvedPropertyItemRule | undefined {
  if ("itemRule" in propertyRule && propertyRule.itemRule !== undefined) {
    return propertyRule.itemRule
  }
  return (
    fallback ?? getTypeRule(propertyRule.type, "collectionItemRule")?.itemRule
  )
}

export const typeRulesRegistryRevision = (): number =>
  currentPropertyRuleRegistrySet<{ revision(): number }>()?.revision() ?? 0
