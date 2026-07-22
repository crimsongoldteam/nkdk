import { existsSync } from "fs"
import { dirname, join } from "path"
import { rootFromYAML } from "../metadataTargets/roots"
import type { ParsedMetadataTarget } from "../metadataTargets/types"
import {
  registerProjectReferenceMemberIndexContributor,
  registerProjectReferenceMemberContributor,
  type ProjectReferenceMemberIndexContributor,
  type ProjectReferenceMemberContributor,
} from "../../validation/projectReferenceIndexRegistry"
import { projectMemberIndexKey, type ProjectMemberIndexEntry } from "../../validation/projectMetadataReferences"

registerProjectReferenceMemberContributor("Form", ({ ownerFilePath, segment, target }) => {
  if (target.segments.length !== 1) return undefined

  const filePath = join(dirname(ownerFilePath), "Формы", segment.name, "Форма.yaml")
  return existsSync(filePath)
    ? { ok: true, filePath, details: { kind: "Form", name: segment.name, item: segment.name } }
    : undefined
})

registerProjectReferenceMemberContributor("Template", ({ ownerFilePath, segment, target }) => {
  if (target.segments.length !== 1) return undefined

  const templateDir = join(dirname(ownerFilePath), "Шаблоны", segment.name)
  for (const fileName of ["Template.xml", "Template.txt", "Template.bin"]) {
    const filePath = join(templateDir, fileName)
    if (existsSync(filePath)) {
      return { ok: true, filePath, details: { kind: "Template", name: segment.name, item: segment.name } }
    }
  }

  return undefined
})

registerProjectReferenceMemberContributor("Form", createCollectionMemberResolver({ modelName: "forms", yamlName: "Формы" }))
registerProjectReferenceMemberContributor(
  "Template",
  createCollectionMemberResolver({ modelName: "templates", yamlName: "Макеты" })
)
registerProjectReferenceMemberContributor("Command", createCollectionMemberResolver({ modelName: "commands", yamlName: "Команды" }))
registerProjectReferenceMemberContributor(
  "AccountingFlag",
  createCollectionMemberResolver({ modelName: "accountingFlags", yamlName: "ПризнакиУчета" })
)
registerProjectReferenceMemberContributor(
  "ExtDimensionAccountingFlag",
  createCollectionMemberResolver({ modelName: "extDimensionAccountingFlags", yamlName: "ПризнакиУчетаСубконто" })
)
registerProjectReferenceMemberContributor("Field", createCollectionMemberResolver({ modelName: "fields", yamlName: "Поля" }))
registerProjectReferenceMemberContributor(
  "Dimension",
  createCollectionMemberResolver({ modelName: "dimensions", yamlName: "Измерения" })
)
registerProjectReferenceMemberContributor(
  "Resource",
  createCollectionMemberResolver({ modelName: "resources", yamlName: "Ресурсы" })
)
registerProjectReferenceMemberIndexContributor(collectionMemberIndexContributor({ modelName: "forms", kind: "Form" }))
registerProjectReferenceMemberIndexContributor(collectionMemberIndexContributor({ modelName: "templates", kind: "Template" }))
registerProjectReferenceMemberIndexContributor(collectionMemberIndexContributor({ modelName: "commands", kind: "Command" }))
registerProjectReferenceMemberIndexContributor(
  collectionMemberIndexContributor({ modelName: "accountingFlags", kind: "AccountingFlag" })
)
registerProjectReferenceMemberIndexContributor(
  collectionMemberIndexContributor({ modelName: "extDimensionAccountingFlags", kind: "ExtDimensionAccountingFlag" })
)
registerProjectReferenceMemberIndexContributor(collectionMemberIndexContributor({ modelName: "fields", kind: "Field" }))
registerProjectReferenceMemberIndexContributor(collectionMemberIndexContributor({ modelName: "dimensions", kind: "Dimension" }))
registerProjectReferenceMemberIndexContributor(collectionMemberIndexContributor({ modelName: "resources", kind: "Resource" }))

function createCollectionMemberResolver(params: { modelName: string; yamlName: string }): ProjectReferenceMemberContributor {
  return ({ owner, rawYaml, segment, target }) => {
    if (target.segments.length !== 1) return undefined

    const item = memberCollectionItem(
      (owner ? metadataRecord(owner.facts)[params.modelName] : undefined) ?? metadataRecord(rawYaml)[params.yamlName],
      segment.name
    )
    return item === undefined
      ? undefined
      : { ok: true, filePath: owner?.filePath, details: { kind: segment.kind, name: segment.name, item } }
  }
}

function collectionMemberIndexContributor(params: {
  modelName: string
  kind: ProjectMemberIndexEntry["target"]["segments"][number]["kind"]
}): ProjectReferenceMemberIndexContributor {
  return ({ owner }) => {
    const root = rootFromYAML[owner.ref.kind]
    if (!root || !owner.ref.name) return []
    const collection = metadataRecord(owner.facts)[params.modelName]
    const entries: ProjectMemberIndexEntry[] = []

    for (const item of collectionItems(collection)) {
      const target: Extract<ParsedMetadataTarget, { kind: "member" }> = {
        kind: "member",
        root,
        objectName: owner.ref.name,
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
      if (typeof item === "object" && item !== null && typeof (item as Record<string, unknown>)["name"] === "string") {
        return [{ name: (item as Record<string, unknown>)["name"] as string, item }]
      }
      return []
    })
  }
  if (typeof collection === "object" && collection !== null) {
    return Object.entries(collection).map(([name, item]) => ({ name, item }))
  }
  return []
}

function memberCollectionItem(collection: unknown, name: string): unknown {
  if (typeof collection === "string") return collection === name ? collection : undefined

  if (Array.isArray(collection)) {
    return collection.find(
      (item) =>
        item === name || (typeof item === "object" && item !== null && (item as Record<string, unknown>).name === name)
    )
  }

  if (typeof collection === "object" && collection !== null && Object.prototype.hasOwnProperty.call(collection, name)) {
    return (collection as Record<string, unknown>)[name]
  }

  return undefined
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
