import type { ParsedMetadataTarget } from "../metadataTargets/types"
import type {
  ProjectReferenceContribution,
  ProjectReferenceMemberIndexContributor,
  ProjectReferenceMemberContributor,
} from "../../validation/projectReferenceIndexRegistry"
import { projectMemberIndexKey, type ProjectMemberIndexEntry } from "../../validation/projectMetadataReferences"

const collections = [
  { modelName: "commands", yamlName: "Команды", kind: "Command" },
  { modelName: "accountingFlags", yamlName: "ПризнакиУчета", kind: "AccountingFlag" },
  { modelName: "extDimensionAccountingFlags", yamlName: "ПризнакиУчетаСубконто", kind: "ExtDimensionAccountingFlag" },
  { modelName: "fields", yamlName: "Поля", kind: "Field" },
  { modelName: "dimensions", yamlName: "Измерения", kind: "Dimension" },
  { modelName: "resources", yamlName: "Ресурсы", kind: "Resource" },
] as const

export const metadataTargetProjectReferenceRules: readonly ProjectReferenceContribution[] = collections.flatMap(
  ({ modelName, yamlName, kind }) => [
    { kind: "member" as const, memberKind: kind, contributor: createCollectionMemberResolver({ modelName, yamlName }) },
    { kind: "memberIndex" as const, contributor: collectionMemberIndexContributor({ modelName, yamlName, kind }) },
  ],
)

function createCollectionMemberResolver(params: { modelName: string; yamlName: string }): ProjectReferenceMemberContributor {
  return ({ owner, rawYaml, segment, target }) => {
    if (target.segments.length !== 1) return undefined
    const item = memberCollectionItem(
      (owner ? metadataRecord(owner.facts)[params.modelName] : undefined) ?? metadataRecord(rawYaml)[params.yamlName],
      segment.name,
    )
    return item === undefined
      ? undefined
      : { ok: true, filePath: owner?.filePath, details: { kind: segment.kind, name: segment.name, item } }
  }
}

function collectionMemberIndexContributor(params: {
  modelName: string
  yamlName: string
  kind: ProjectMemberIndexEntry["target"]["segments"][number]["kind"]
}): ProjectReferenceMemberIndexContributor {
  return ({ owner, objectTarget, rawYaml }) => {
    const collection = metadataRecord(owner.facts)[params.modelName] ?? metadataRecord(rawYaml)[params.yamlName]
    const entries: ProjectMemberIndexEntry[] = []
    for (const item of collectionItems(collection)) {
      const target: Extract<ParsedMetadataTarget, { kind: "member" }> = {
        kind: "member",
        root: objectTarget.root,
        objectName: objectTarget.objectName,
        ...(objectTarget.segments === undefined ? {} : { objectSegments: objectTarget.segments }),
        segments: [{ kind: params.kind, name: item.name }],
      }
      entries.push({
        canonical: projectMemberIndexKey(target),
        target,
        result: { ok: true, filePath: owner.filePath, details: { kind: params.kind, name: item.name, item: item.item } },
      })
    }
    return entries
  }
}

function collectionItems(collection: unknown): Array<{ name: string; item: unknown }> {
  if (typeof collection === "string") return [{ name: collection, item: collection }]
  if (Array.isArray(collection)) {
    return collection.flatMap((item) => {
      if (typeof item === "string") return [{ name: item, item }]
      if (typeof item === "object" && item !== null && typeof (item as Record<string, unknown>).name === "string") {
        return [{ name: (item as Record<string, unknown>).name as string, item }]
      }
      return []
    })
  }
  if (typeof collection === "object" && collection !== null) return Object.entries(collection).map(([name, item]) => ({ name, item }))
  return []
}

function memberCollectionItem(collection: unknown, name: string): unknown {
  if (typeof collection === "string") return collection === name ? collection : undefined
  if (Array.isArray(collection)) {
    return collection.find((item) => item === name || (typeof item === "object" && item !== null && (item as Record<string, unknown>).name === name))
  }
  if (typeof collection === "object" && collection !== null && Object.prototype.hasOwnProperty.call(collection, name)) {
    return (collection as Record<string, unknown>)[name]
  }
  return undefined
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
