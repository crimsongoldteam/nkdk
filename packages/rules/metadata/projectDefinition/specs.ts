import type { RegisteredProjectSpec } from "./projectSpecContracts"
import { createMetadataItemProjectSchemaExporter, createProjectSchemaExporter } from "./projectSpecHelpers"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"

export { createMetadataItemProjectSchemaExporter, createProjectSchemaExporter }

export type MetadataProjectSpec = RegisteredProjectSpec

export function getMetadataProjectSpecByDir(dir: string): MetadataProjectSpec | undefined {
  const contextual = currentRuleRegistrySet<{
    projectSpecs: ReadonlyMap<string, MetadataProjectSpec>
  }>()?.projectSpecs.get(dir)
  return contextual
}

export function getMetadataProjectSpecs(): readonly MetadataProjectSpec[] {
  const contextual = currentRuleRegistrySet<{
    projectSpecs: ReadonlyMap<string, MetadataProjectSpec>
  }>()
  return [...(contextual?.projectSpecs.values() ?? [])].filter((spec) => spec.dir !== "")
}

export function getConfigurationMetadataProjectSpec(): MetadataProjectSpec {
  const spec = currentRuleRegistrySet<{
    projectSpecs: ReadonlyMap<string, MetadataProjectSpec>
  }>()?.projectSpecs.get("")
  if (spec === undefined) throw new Error("Не задан execution context project specs")
  return spec
}
