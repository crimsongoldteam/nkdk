import type { TSchema } from "@sinclair/typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"

export interface RegisteredProjectSpec {
  dir: string
  kind: string
  rule: MetadataItemRule
  exportSchema: (params: { context: ConfigurationContext; mode?: JSONSchemaExportMode }) => TSchema
  importModel: (params: { context: ConfigurationContext; parsed: ParsedYaml; name: string }) => MetadataItem | undefined
  nesting?: ProjectSpecNesting
}

export type ProjectSpecNesting = {
  kind: "recursiveChildDir"
  childDir: string
  itemRole: string
  collectionRole: string
}

const specsByDir = new Map<string, RegisteredProjectSpec>()

export function registerProjectSpec(spec: RegisteredProjectSpec): void {
  specsByDir.set(spec.dir, spec)
}

export function getRegisteredProjectSpecs(): readonly RegisteredProjectSpec[] {
  return [...specsByDir.values()].sort((left, right) => left.dir.localeCompare(right.dir, "ru"))
}

export function getRegisteredProjectSpecByDir(dir: string): RegisteredProjectSpec | undefined {
  return specsByDir.get(dir)
}

export function clearProjectSpecRegistryForTests(): void {
  specsByDir.clear()
}

export function unregisterProjectSpecForTests(dir: string): void {
  specsByDir.delete(dir)
}
