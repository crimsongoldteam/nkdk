import { existsSync } from "fs"
import { join, resolve } from "path"
import {
  fieldKindToYAML,
  rootToYAML,
  standardAttributeToYAML,
  type MetadataFieldKind,
  type MetadataRootName,
  type ParsedMetadataTarget,
  type StyleItemTargetType,
} from "~/metadata/commonObjects/metadataTargets"
import type { ConfigurationContext } from "~/metadata/context/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { createOwnerMetadataCache, type OwnerMetadataCache } from "./dataPath/ownerCache"
import { getObjectField, type ObjectField, type ObjectFieldKind } from "./dataPath/objectFields"
import type { ProjectYamlCache } from "./projectYamlCache"
import type { Diagnostic } from "./types"

export interface CreateProjectMetadataResolverParams {
  projectDir: string
  yamlCache: ProjectYamlCache
  context: ConfigurationContext
  ownerCache?: OwnerMetadataCache
}

export type MetadataResolveResult =
  | { ok: true; filePath?: string; details?: unknown }
  | { ok: false; diagnostics: Diagnostic[] }

export interface ProjectMetadataResolver {
  resolveObject(params: { target: Extract<ParsedMetadataTarget, { kind: "object" }> }): MetadataResolveResult
  resolveField(params: { target: Extract<ParsedMetadataTarget, { kind: "field" }> }): MetadataResolveResult
  resolveValue(params: { target: Extract<ParsedMetadataTarget, { kind: "value" }> }): MetadataResolveResult
  resolveStyleItem(params: { name: string; expectedTypes: readonly StyleItemTargetType[] }): MetadataResolveResult
  resolveCommonPicture(params: { name: string }): MetadataResolveResult
}

const objectFieldKindByTargetKind = {
  Attribute: "attribute",
  StandardAttribute: "standardAttribute",
  TabularSection: "tabularSection",
  Dimension: "dimension",
  Resource: "resource",
} as const satisfies Record<MetadataFieldKind, ObjectFieldKind>

export function createProjectMetadataResolver(params: CreateProjectMetadataResolverParams): ProjectMetadataResolver {
  const projectDir = resolve(params.projectDir)
  const ownerCache =
    params.ownerCache ??
    createOwnerMetadataCache({
      projectDir,
      yamlCache: params.yamlCache,
      context: params.context,
    })

  return {
    resolveObject({ target }) {
      const filePath = objectFilePath(projectDir, target.root, target.objectName)
      if (!existsSync(filePath)) {
        return referenceError(filePath, `Не найден объект "${formatObjectTarget(target)}"`)
      }

      if (target.segments && target.segments.length > 0) {
        const nestedFilePath = nestedObjectFilePath(projectDir, target)
        if (existsSync(nestedFilePath)) return { ok: true, filePath: nestedFilePath }

        return referenceError(nestedFilePath, `Не найден объект "${formatObjectTarget(target)}"`)
      }

      return { ok: true, filePath }
    },

    resolveField({ target }) {
      const object = this.resolveObject({ target: { kind: "object", root: target.root, objectName: target.objectName } })
      if (!object.ok) return object

      const owner = ownerCache.get({ kind: rootToYAML[target.root], name: target.objectName })
      if (owner.status !== "ok") return { ok: false, diagnostics: owner.diagnostics }

      const resolved = resolveFieldSegments(owner.owner.fieldIndex.fields, target.segments)
      if (resolved.ok) return { ok: true, filePath: owner.owner.filePath, details: resolved.field }

      return referenceError(owner.owner.filePath, `Не найдено поле "${formatFieldTarget(target)}": ${resolved.message}`)
    },

    resolveValue({ target }) {
      const object = this.resolveObject({ target: { kind: "object", root: target.root, objectName: target.objectName } })
      if (!object.ok) return object
      if (target.valueKind === "emptyRef") return object

      const owner = ownerCache.get({ kind: rootToYAML[target.root], name: target.objectName })
      if (owner.status !== "ok") return { ok: false, diagnostics: owner.diagnostics }

      const values = target.root === "Enum" ? metadataRecord(owner.owner.model).enumValues : metadataRecord(owner.owner.model).predefined
      if (hasNamedItem(values, target.valueName)) return { ok: true, filePath: owner.owner.filePath }

      return referenceError(owner.owner.filePath, `Не найдено значение "${formatValueTarget(target)}"`)
    },

    resolveStyleItem({ name, expectedTypes }) {
      const filePath = join(projectDir, rootToYAML.StyleItem, name, "Свойства.yaml")
      if (!existsSync(filePath)) return referenceError(filePath, `Не найден элемент стиля "ЭлементСтиля.${name}"`)

      const styleItemType = readStyleItemType({ filePath, yamlCache: params.yamlCache })
      if (styleItemType && expectedTypes.length > 0 && !expectedTypes.includes(styleItemType)) {
        return referenceError(
          filePath,
          `Элемент стиля "ЭлементСтиля.${name}" имеет тип "${styleItemType}", ожидался: ${expectedTypes.join(", ")}`,
        )
      }

      return { ok: true, filePath }
    },

    resolveCommonPicture({ name }) {
      const filePath = join(projectDir, rootToYAML.CommonPicture, name, "Свойства.yaml")
      return existsSync(filePath) ? { ok: true, filePath } : referenceError(filePath, `Не найдена общая картинка "ОбщаяКартинка.${name}"`)
    },
  }
}

function readStyleItemType(params: { filePath: string; yamlCache: ProjectYamlCache }): StyleItemTargetType | undefined {
  const entry = params.yamlCache.get(params.filePath)
  if ("error" in entry || entry.parsed.doc.errors.length > 0) return undefined

  const typeValue = styleItemTypeValue(entry.parsed.data)
  if (typeof typeValue !== "string") return undefined

  return SE.StyleElementTypeFromYAML[typeValue as SE.StyleElementTypeYAML] ?? styleItemTypeFromModelValue(typeValue)
}

function styleItemTypeValue(data: unknown): unknown {
  return typeof data === "object" && data !== null ? (data as Record<string, unknown>).Тип : undefined
}

function styleItemTypeFromModelValue(value: string): StyleItemTargetType | undefined {
  return Object.prototype.hasOwnProperty.call(SE.StyleElementTypeToYAML, value) ? (value as StyleItemTargetType) : undefined
}

function resolveFieldSegments(
  fields: Map<string, ObjectField>,
  segments: Extract<ParsedMetadataTarget, { kind: "field" }>["segments"],
): { ok: true; field: ObjectField } | { ok: false; message: string } {
  let currentFields = fields
  let currentField: ObjectField | undefined

  for (const [index, segment] of segments.entries()) {
    currentField = getObjectField({ index: { fields: currentFields, diagnostics: [] }, name: fieldLookupName(segment) })
    if (!currentField) return { ok: false, message: `нет сегмента "${segment.name}"` }
    if (currentField.kind !== objectFieldKindByTargetKind[segment.kind]) {
      return { ok: false, message: `"${segment.name}" имеет другой вид` }
    }

    if (index < segments.length - 1) {
      if (!currentField.tableSource) return { ok: false, message: `"${segment.name}" не содержит вложенных полей` }
      currentFields = currentField.tableSource.columns
    }
  }

  return currentField ? { ok: true, field: currentField } : { ok: false, message: "пустой путь" }
}

function objectFilePath(projectDir: string, root: MetadataRootName, name: string): string {
  return join(projectDir, rootToYAML[root], name, "Свойства.yaml")
}

function nestedObjectFilePath(
  projectDir: string,
  target: Extract<ParsedMetadataTarget, { kind: "object" }>,
): string {
  const parts = [projectDir, rootToYAML[target.root], target.objectName]
  for (const segment of target.segments ?? []) {
    parts.push(nestedObjectFolderName(segment.root), segment.objectName)
  }

  return join(...parts, "Свойства.yaml")
}

function nestedObjectFolderName(root: MetadataRootName): string {
  if (root === "Subsystem") return "Подсистемы"
  return rootToYAML[root]
}

function fieldLookupName(segment: Extract<ParsedMetadataTarget, { kind: "field" }>["segments"][number]): string {
  return segment.kind === "StandardAttribute" ? (standardAttributeToYAML[segment.name] ?? segment.name) : segment.name
}

function hasNamedItem(value: unknown, name: string): boolean {
  if (Array.isArray(value)) return value.some((item) => hasNamedItem(item, name))
  if (typeof value !== "object" || value === null) return false

  const record = value as Record<string, unknown>
  if (record.name === name) return true
  if (Object.prototype.hasOwnProperty.call(record, name)) return true

  return hasNamedItem(record.items, name) || hasNamedItem(record.childItems, name) || hasNamedItem(record.enumValues, name)
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

function formatFieldTarget(target: Extract<ParsedMetadataTarget, { kind: "field" }>): string {
  return [
    rootToYAML[target.root],
    target.objectName,
    ...target.segments.flatMap((segment) => [fieldKindToYAML[segment.kind], fieldLookupName(segment)]),
  ].join(".")
}

function formatObjectTarget(target: Extract<ParsedMetadataTarget, { kind: "object" }>): string {
  return [
    rootToYAML[target.root],
    target.objectName,
    ...(target.segments ?? []).flatMap((segment) => [rootToYAML[segment.root], segment.objectName]),
  ].join(".")
}

function formatValueTarget(target: Extract<ParsedMetadataTarget, { kind: "value" }>): string {
  return target.valueKind === "emptyRef"
    ? `${rootToYAML[target.root]}.${target.objectName}.ПустаяСсылка`
    : `${rootToYAML[target.root]}.${target.objectName}.${target.valueName}`
}

function referenceError(filePath: string, message: string): MetadataResolveResult {
  return {
    ok: false,
    diagnostics: [{ filePath, line: 1, col: 1, source: "reference", severity: "error", message }],
  }
}
