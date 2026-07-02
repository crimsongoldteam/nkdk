import { existsSync } from "fs"
import { dirname, join } from "path"
import {
  registerProjectMemberResolver,
  type ProjectMemberResolver,
} from "../../validation/projectMetadataResolverRegistry"

registerProjectMemberResolver("Form", ({ ownerFilePath, segment, target }) => {
  if (target.segments.length !== 1) return undefined

  const filePath = join(dirname(ownerFilePath), "Формы", segment.name, "Форма.yaml")
  return existsSync(filePath)
    ? { ok: true, filePath, details: { kind: "Form", name: segment.name, item: segment.name } }
    : undefined
})

registerProjectMemberResolver("Template", ({ ownerFilePath, segment, target }) => {
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

registerProjectMemberResolver("Form", createCollectionMemberResolver({ modelName: "forms", yamlName: "Формы" }))
registerProjectMemberResolver(
  "Template",
  createCollectionMemberResolver({ modelName: "templates", yamlName: "Макеты" })
)
registerProjectMemberResolver("Command", createCollectionMemberResolver({ modelName: "commands", yamlName: "Команды" }))
registerProjectMemberResolver(
  "AccountingFlag",
  createCollectionMemberResolver({ modelName: "accountingFlags", yamlName: "ПризнакиУчета" })
)
registerProjectMemberResolver(
  "ExtDimensionAccountingFlag",
  createCollectionMemberResolver({ modelName: "extDimensionAccountingFlags", yamlName: "ПризнакиУчетаСубконто" })
)
registerProjectMemberResolver("Field", createCollectionMemberResolver({ modelName: "fields", yamlName: "Поля" }))
registerProjectMemberResolver(
  "Dimension",
  createCollectionMemberResolver({ modelName: "dimensions", yamlName: "Измерения" })
)
registerProjectMemberResolver(
  "Resource",
  createCollectionMemberResolver({ modelName: "resources", yamlName: "Ресурсы" })
)

function createCollectionMemberResolver(params: { modelName: string; yamlName: string }): ProjectMemberResolver {
  return ({ owner, rawYaml, segment, target }) => {
    if (target.segments.length !== 1) return undefined

    const item = memberCollectionItem(
      (owner ? metadataRecord(owner.model)[params.modelName] : undefined) ?? metadataRecord(rawYaml)[params.yamlName],
      segment.name
    )
    return item === undefined
      ? undefined
      : { ok: true, filePath: owner?.filePath, details: { kind: segment.kind, name: segment.name, item } }
  }
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
