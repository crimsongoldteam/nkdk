import { Type } from "typebox"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import {
  getRegisteredProjectSpecByDir,
  getRegisteredProjectSpecs,
  assertCoreMetadataRegistered,
} from "./projectSpecRegistry"
import type { RegisteredProjectSpec } from "./projectSpecContracts"
import { createMetadataItemProjectSchemaExporter, createProjectSchemaExporter } from "./projectSpecHelpers"

assertCoreMetadataRegistered("projectDefinition/specs")

export { createMetadataItemProjectSchemaExporter, createProjectSchemaExporter }

export type MetadataProjectSpec = RegisteredProjectSpec

export const metadataProjectSpecs: readonly MetadataProjectSpec[] = getRegisteredProjectSpecs().filter(
  (spec) => spec.dir !== ""
)

export const configurationMetadataProjectSpec: MetadataProjectSpec = getRegisteredProjectSpecByDir("") ?? {
  kind: "configuration",
  dir: "",
  rule: { itemType: "MetadataConfiguration", properties: {} } as MetadataItemRule,
  exportSchema: () => Type.Object({}),
}

export const metadataProjectSpecByDir = new Map(metadataProjectSpecs.map((spec) => [spec.dir, spec]))

export function getMetadataProjectSpecByDir(dir: string): MetadataProjectSpec | undefined {
  return getRegisteredProjectSpecByDir(dir)
}
