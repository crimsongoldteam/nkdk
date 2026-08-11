import { Type } from "typebox"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { RegisteredProjectSpec } from "./projectSpecContracts"
import { createMetadataItemProjectSchemaExporter, createProjectSchemaExporter } from "./projectSpecHelpers"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"

export { createMetadataItemProjectSchemaExporter, createProjectSchemaExporter }

export type MetadataProjectSpec = RegisteredProjectSpec

export const metadataProjectSpecs: MetadataProjectSpec[] = []

export let configurationMetadataProjectSpec: MetadataProjectSpec = {
  kind: "configuration",
  dir: "",
  rule: { itemType: "MetadataConfiguration", properties: {} } as MetadataItemRule,
  exportSchema: () => Type.Object({}),
}

export const metadataProjectSpecByDir = new Map(metadataProjectSpecs.map((spec) => [spec.dir, spec]))

export function registerMetadataProjectSpecs(projectSpecs: readonly RegisteredProjectSpec[]): void {
  metadataProjectSpecs.splice(0, metadataProjectSpecs.length, ...projectSpecs.filter((spec) => spec.dir !== ""))
  metadataProjectSpecByDir.clear()
  for (const spec of metadataProjectSpecs) metadataProjectSpecByDir.set(spec.dir, spec)
  configurationMetadataProjectSpec = projectSpecs.find((spec) => spec.dir === "")
    ?? configurationMetadataProjectSpec
}

export function getMetadataProjectSpecByDir(dir: string): MetadataProjectSpec | undefined {
  const contextual = currentRuleRegistrySet<{
    projectSpecs: ReadonlyMap<string, MetadataProjectSpec>
  }>()?.projectSpecs.get(dir)
  if (contextual !== undefined) return contextual
  return dir === "" ? configurationMetadataProjectSpec : metadataProjectSpecByDir.get(dir)
}

export function getMetadataProjectSpecs(): readonly MetadataProjectSpec[] {
  const contextual = currentRuleRegistrySet<{
    projectSpecs: ReadonlyMap<string, MetadataProjectSpec>
  }>()
  return contextual === undefined
    ? metadataProjectSpecs
    : [...contextual.projectSpecs.values()].filter((spec) => spec.dir !== "")
}

export function getConfigurationMetadataProjectSpec(): MetadataProjectSpec {
  return currentRuleRegistrySet<{
    projectSpecs: ReadonlyMap<string, MetadataProjectSpec>
  }>()?.projectSpecs.get("") ?? configurationMetadataProjectSpec
}
