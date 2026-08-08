import type { TSchema } from "typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "../context/types"
import { registerJSONSchemaIdentity } from "../orchestration/jsonSchemaRefs"
import { resolvePropertyItemRule } from "../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { MetadataResourceDeclaration } from "../resourceTopology/types"

export interface RegisteredProjectSpec {
  dir: string
  kind: string
  rule: MetadataItemRule
  exportSchema: (params: { context: ConfigurationContext; mode?: JSONSchemaExportMode; name?: string }) => TSchema
  nesting?: ProjectSpecNesting
  /** Нейтральное описание файлов Проекта и связанных с ними XML-ресурсов. */
  resources?: readonly MetadataResourceDeclaration[]
}

export type ProjectSpecNesting = {
  kind: "recursiveChildDir"
  childDir: string
  itemRole: string
  collectionRole: string
  logicalAddressSegment: string
}

const specsByDir = new Map<string, RegisteredProjectSpec>()
let registryRevision = 0

export function registerProjectSpec(spec: RegisteredProjectSpec): void {
  specsByDir.set(spec.dir, spec)
  registryRevision += 1
  registerJSONSchemaIdentity({
    name: spec.rule.itemType,
    source: spec.rule,
    exporter: ({ context }) =>
      spec.exportSchema({
        context,
        mode: context.exportToJSONSchema?.mode ?? "externalRefs",
      }),
  })
}

export function getRegisteredProjectSpecs(): readonly RegisteredProjectSpec[] {
  return [...specsByDir.values()].sort((left, right) => left.dir.localeCompare(right.dir, "ru"))
}

export function assertCoreMetadataRegistered(operation: string): void {
  if (specsByDir.size === 0) {
    throw new Error(`Metadata не зарегистрирована перед операцией ${operation}`)
  }
}

export function getRegisteredProjectSpecByDir(dir: string): RegisteredProjectSpec | undefined {
  return specsByDir.get(dir)
}

export function findRegisteredProjectRule(itemType: string): MetadataItemRule | undefined {
  for (const spec of getRegisteredProjectSpecs()) {
    const rule = findProjectRule(spec.rule, itemType, new Set())
    if (rule !== undefined) return rule
  }
  return undefined
}

export function clearProjectSpecRegistryForTests(): void {
  specsByDir.clear()
  registryRevision += 1
}

export function unregisterProjectSpecForTests(dir: string): void {
  specsByDir.delete(dir)
  registryRevision += 1
}

export function projectSpecRegistryRevision(): number {
  return registryRevision
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
