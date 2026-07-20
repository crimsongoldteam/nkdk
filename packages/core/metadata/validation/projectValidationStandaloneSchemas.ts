import { type TSchema } from "typebox"
import type { ConfigurationContext } from "../context/types"
import { stripCollectedSchemaRefs } from "../orchestration/jsonSchemaRefs"
import { exportJSONSchemaGraph, type JSONSchemaGraphRoot } from "./projectFileSchema"
import { configurationValidationProjectSpec, validationProjectSpecs } from "./projectSpecs"

export interface ProjectValidationStandaloneSchemaSet {
  context: ConfigurationContext
  form: TSchema
  refs: Record<string, TSchema>
  byProjectDir: Record<string, TSchema>
}

export const defaultStandaloneValidationContext: ConfigurationContext = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
}

export function createProjectValidationStandaloneSchemaSet(
  context: ConfigurationContext = defaultStandaloneValidationContext
): ProjectValidationStandaloneSchemaSet {
  const specs = [configurationValidationProjectSpec, ...validationProjectSpecs]
  const formRootKey = "__form"
  const roots: JSONSchemaGraphRoot[] = [
    { key: formRootKey, name: "ClientApplicationForm", includeNestedChildItems: true },
    ...specs.map((spec) => ({ key: spec.dir, name: spec.rule.itemType })),
  ]
  const graph = exportJSONSchemaGraph({
    context,
    excludeImplicitValueYAML: true,
    validationPropertyRefs: true,
    roots,
  })
  const byProjectDir = Object.fromEntries(specs.map((spec) => [spec.dir, stripCollectedSchemaRefs(graph.roots[spec.dir]!)]))
  const form = stripCollectedSchemaRefs(graph.roots[formRootKey]!)

  return {
    context,
    form,
    refs: graph.schemas,
    byProjectDir,
  }
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
