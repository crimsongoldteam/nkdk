import { type TSchema } from "typebox"
import type { ConfigurationContext } from "../context/types"
import { getMetadataComponentDescriptor } from "../components/descriptor"
import type { MetadataItemRule } from "../orchestration/property/types"
import { stripCollectedSchemaRefs } from "../orchestration/jsonSchemaRefs"
import { exportJSONSchemaGraph, type JSONSchemaGraphRoot } from "./projectFileSchema"
import { configurationValidationProjectSpec, validationProjectSpecs } from "./projectSpecs"
import { registeredProjectValidationFormRules } from "./projectValidationFormRules"

export interface ProjectValidationStandaloneSchemaSet {
  context: ConfigurationContext
  forms: Record<string, TSchema>
  refs: Record<string, TSchema>
  byItemType: Record<string, TSchema>
}

export const defaultStandaloneValidationContext: ConfigurationContext = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
}

export function createProjectValidationStandaloneSchemaSet(
  context: ConfigurationContext = defaultStandaloneValidationContext
): ProjectValidationStandaloneSchemaSet {
  const propertyRules = uniqueRulesByItemType([
    configurationValidationProjectSpec.rule,
    getMetadataComponentDescriptor("configurationExtension").rootRule,
    ...validationProjectSpecs.map((spec) => spec.rule),
  ])
  const formRootKey = "__form"
  const formRules = registeredProjectValidationFormRules()
  const roots: JSONSchemaGraphRoot[] = [
    ...formRules.map(({ key, rule }) => ({
      key: `${formRootKey}:${key}`,
      rule,
      includeNestedChildItems: true,
    })),
    ...propertyRules.map((rule) => ({ key: rule.itemType, name: rule.itemType })),
  ]
  const graph = exportJSONSchemaGraph({
    context,
    excludeImplicitValueYAML: true,
    validationPropertyRefs: true,
    roots,
  })
  const byItemType = Object.fromEntries(
    propertyRules.map((rule) => [rule.itemType, stripCollectedSchemaRefs(graph.roots[rule.itemType]!)]))
  const forms = Object.fromEntries(
    formRules.map(({ key }) => [
      key,
      stripCollectedSchemaRefs(graph.roots[`${formRootKey}:${key}`]!),
    ])
  )

  return {
    context,
    forms,
    refs: graph.schemas,
    byItemType,
  }
}

function uniqueRulesByItemType(rules: readonly MetadataItemRule[]): MetadataItemRule[] {
  return [...new Map(rules.map((rule) => [rule.itemType, rule])).values()]
}

export function assertStandaloneValidationContext(
  actual: ConfigurationContext,
  expected: ConfigurationContext = defaultStandaloneValidationContext
): void {
  if (JSON.stringify(actual) === JSON.stringify(expected)) return

  throw new Error(
    `Standalone validation schemas were built for context ${JSON.stringify(
      actual
    )}, but validation requested ${JSON.stringify(expected)}`
  )
}
