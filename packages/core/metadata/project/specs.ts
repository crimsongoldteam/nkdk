import { Type } from "@sinclair/typebox"
import { registerCoreMetadata } from "../register"
import type { MetadataItemRule } from "../orchestration/property/types"
import {
  getRegisteredProjectSpecByDir,
  getRegisteredProjectSpecs,
  type RegisteredProjectSpec,
} from "./projectSpecRegistry"
import {
  createGenericProjectImportModel,
  createMetadataItemProjectSchemaExporter,
  createProjectSchemaExporter,
} from "./projectSpecHelpers"

registerCoreMetadata()

export { createGenericProjectImportModel, createMetadataItemProjectSchemaExporter, createProjectSchemaExporter }

export type MetadataProjectSpec = RegisteredProjectSpec

export const metadataProjectSpecs: readonly MetadataProjectSpec[] = getRegisteredProjectSpecs().filter(
  (spec) => spec.dir !== ""
)

export const configurationMetadataProjectSpec: MetadataProjectSpec = getRegisteredProjectSpecByDir("") ?? {
  kind: "configuration",
  dir: "",
  rule: { itemType: "MetadataConfiguration", properties: {} } as MetadataItemRule,
  exportSchema: () => Type.Object({}),
  importModel: () => undefined,
}

export const metadataProjectSpecByDir = new Map(metadataProjectSpecs.map((spec) => [spec.dir, spec]))

export function getMetadataProjectSpecByDir(dir: string): MetadataProjectSpec | undefined {
  return getRegisteredProjectSpecByDir(dir)
}
