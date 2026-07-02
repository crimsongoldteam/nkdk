import "./types"
import { join } from "path"
import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import {
  registerProjectInlineObjectResolver,
  registerProjectReferenceObjectPathContributor,
} from "../../validation/projectMetadataResolverRegistry"
import { MetadataExternalDataSourceRules } from "./rules"

registerDataPathOwnerKind({
  kind: "ВнешнийИсточникДанных",
  projectDir: "ВнешнийИсточникДанных",
  rule: MetadataExternalDataSourceRules,
})

registerProjectReferenceObjectPathContributor("ExternalDataSource", ({ projectDir, target }) => {
  const parts = [projectDir, "ВнешнийИсточникДанных", target.objectName]
  for (const segment of target.segments ?? []) {
    if (segment.kind === "Table") parts.push("Таблицы", segment.objectName)
    else if (segment.kind === "Cube") parts.push("Кубы", segment.objectName)
    else if (segment.kind === "DimensionTable") parts.push("ТаблицыИзмерений", segment.objectName)
    else if (segment.kind === "Function") parts.push("Функции", segment.objectName)
    else return undefined
  }

  return { filePath: join(...parts, "Свойства.yaml") }
})

registerProjectInlineObjectResolver("ExternalDataSource", ({ target, yamlCache, ownerCache }) => {
  const [segment] = target.segments ?? []
  if (target.segments?.length !== 1 || segment?.kind !== "Function") return undefined

  const owner = ownerCache.get({ kind: "ВнешнийИсточникДанных", name: target.objectName })
  if (owner.status !== "ok") return { ok: false, diagnostics: owner.diagnostics }

  const rawYaml = ownerRawYaml({ filePath: owner.owner.filePath, yamlCache })
  const functions = metadataRecord(owner.owner.model).functions ?? metadataRecord(rawYaml).Функции
  if (!hasNamedItem(functions, segment.objectName)) return undefined

  return {
    ok: true,
    filePath: owner.owner.filePath,
    details: { kind: "Function", name: segment.objectName, item: segment.objectName },
  }
})

function ownerRawYaml(params: {
  filePath: string
  yamlCache: { get(filePath: string): unknown; release(filePath: string): void }
}): unknown {
  const entry = params.yamlCache.get(params.filePath)
  try {
    return typeof entry === "object" && entry !== null && "parsed" in entry
      ? (entry as { parsed: { data: unknown } }).parsed.data
      : undefined
  } finally {
    params.yamlCache.release(params.filePath)
  }
}

function hasNamedItem(value: unknown, name: string): boolean {
  if (Array.isArray(value)) return value.some((item) => hasNamedItem(item, name))
  if (typeof value !== "object" || value === null) return false

  const record = value as Record<string, unknown>
  if (record.name === name) return true
  if (Object.prototype.hasOwnProperty.call(record, name)) return true

  return (
    hasNamedItem(record.items, name) || hasNamedItem(record.childItems, name) || hasNamedItem(record.enumValues, name)
  )
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
