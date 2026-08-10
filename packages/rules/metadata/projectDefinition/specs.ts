import { Type } from "typebox"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { RegisteredProjectSpec } from "./projectSpecContracts"
import { createMetadataItemProjectSchemaExporter, createProjectSchemaExporter } from "./projectSpecHelpers"

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
  return dir === "" ? configurationMetadataProjectSpec : metadataProjectSpecByDir.get(dir)
}
