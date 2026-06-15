import { existsSync } from "fs"
import { join, resolve } from "path"
import {
  fieldKindToYAML,
  memberKindToYAML,
  rootToYAML,
  standardAttributeToYAML,
  type MetadataMemberKind,
  type MetadataFieldKind,
  type MetadataTargetFilter,
  type MetadataTypeFilterValue,
  type MetadataRootName,
  type ParsedMetadataTarget,
  type StyleItemTargetType,
} from "~/metadata/commonObjects/metadataTargets"
import type { ConfigurationContext } from "~/metadata/context/types"
import * as SE from "~/metadata/systemEnumerations/types"
import type { DataPathTypeInfo } from "./dataPath/types"
import { createOwnerMetadataCache, type OwnerMetadata, type OwnerMetadataCache } from "./dataPath/ownerCache"
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
  resolveMember(params: {
    target: Extract<ParsedMetadataTarget, { kind: "member" }>
    filters?: readonly MetadataTargetFilter[]
  }): MetadataResolveResult
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

    resolveMember({ target, filters }) {
      const object = this.resolveObject({ target: { kind: "object", root: target.root, objectName: target.objectName } })
      if (!object.ok) return object

      const owner = ownerCache.get({ kind: rootToYAML[target.root], name: target.objectName })
      if (owner.status !== "ok") return { ok: false, diagnostics: owner.diagnostics }

      const resolved = resolveMemberSegments({
        owner: owner.owner,
        rawYaml: ownerRawYaml({ filePath: owner.owner.filePath, yamlCache: params.yamlCache }),
        segments: target.segments,
      })
      if (!resolved.ok) {
        return referenceError(owner.owner.filePath, `Не найден член "${formatMemberTarget(target)}": ${resolved.message}`)
      }

      const filterResult = applyMetadataTargetFilters({
        filePath: owner.owner.filePath,
        displayName: formatMemberTarget(target),
        details: resolved.details,
        filters,
      })
      if (!filterResult.ok) return filterResult

      return { ok: true, filePath: owner.owner.filePath, details: resolved.details }
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

type ResolvedMemberDetails =
  | ObjectField
  | {
      kind: Extract<MetadataMemberKind, "Form" | "Template" | "Command">
      name: string
      item: unknown
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

function resolveMemberSegments(params: {
  owner: OwnerMetadata
  rawYaml: unknown
  segments: Extract<ParsedMetadataTarget, { kind: "member" }>["segments"]
}): { ok: true; details: ResolvedMemberDetails } | { ok: false; message: string } {
  const { owner, segments } = params
  const firstSegment = segments[0]
  if (!firstSegment) return { ok: false, message: "пустой путь" }

  if (isFieldMemberKind(firstSegment.kind)) {
    const resolved = resolveMemberFieldSegments(owner.fieldIndex.fields, segments)
    return resolved.ok ? { ok: true, details: resolved.field } : resolved
  }

  if (segments.length > 1) return { ok: false, message: `"${firstSegment.name}" не содержит вложенных членов` }

  const item = memberCollectionItem(
    metadataRecord(owner.model)[memberCollectionName(firstSegment.kind)] ??
      metadataRecord(params.rawYaml)[memberCollectionYamlName(firstSegment.kind)],
    firstSegment.name,
  )
  if (item === undefined) return { ok: false, message: `нет сегмента "${firstSegment.name}"` }

  return { ok: true, details: { kind: firstSegment.kind, name: firstSegment.name, item } }
}

function ownerRawYaml(params: { filePath: string; yamlCache: ProjectYamlCache }): unknown {
  const entry = params.yamlCache.get(params.filePath)
  try {
    return "error" in entry ? undefined : entry.parsed.data
  } finally {
    params.yamlCache.release(params.filePath)
  }
}

function applyMetadataTargetFilters(params: {
  filePath: string
  displayName: string
  details: ResolvedMemberDetails
  filters: readonly MetadataTargetFilter[] | undefined
}): MetadataResolveResult {
  for (const filter of params.filters ?? []) {
    switch (filter.kind) {
      case "hasType":
        if (!matchesHasTypeFilter(params.details, filter.type)) {
          return referenceError(
            params.filePath,
            `Член "${params.displayName}" не подходит: ожидаются члены, тип которых содержит ${formatTypeFilter(filter.type)}`,
          )
        }
        break
      case "stringIndexedAttribute":
        if (!matchesStringIndexedAttributeFilter(params.details)) {
          return referenceError(
            params.filePath,
            `Член "${params.displayName}" не подходит: ожидаются реквизиты, пригодные для ввода по строке`,
          )
        }
        break
      case "styleItemType":
        break
    }
  }

  return { ok: true, filePath: params.filePath, details: params.details }
}

function resolveMemberFieldSegments(
  fields: Map<string, ObjectField>,
  segments: Extract<ParsedMetadataTarget, { kind: "member" }>["segments"],
): { ok: true; field: ObjectField } | { ok: false; message: string } {
  let currentFields = fields
  let currentField: ObjectField | undefined

  for (const [index, segment] of segments.entries()) {
    if (!isFieldMemberKind(segment.kind)) return { ok: false, message: `"${segment.name}" имеет другой вид` }

    currentField = getObjectField({ index: { fields: currentFields, diagnostics: [] }, name: memberLookupName(segment) })
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

function matchesHasTypeFilter(details: ResolvedMemberDetails, type: MetadataTypeFilterValue): boolean {
  if (!isObjectField(details)) return false
  if (type === "boolean") return details.typeInfo.kinds.includes("boolean")

  return typeInfoSourceContains(details.typeInfo, type)
}

function matchesStringIndexedAttributeFilter(details: ResolvedMemberDetails): boolean {
  if (!isObjectField(details)) return false
  if (details.kind !== "attribute" && details.kind !== "standardAttribute") return false
  if (details.typeInfo.kinds.includes("unknown")) return true
  if (details.typeInfo.kinds.includes("boolean")) return true

  return ["string", "decimal", "dateTime", "UUID"].some((type) => typeInfoSourceContains(details.typeInfo, type))
}

function typeInfoSourceContains(typeInfo: DataPathTypeInfo, type: string): boolean {
  return typeInfo.sourceText?.split(" | ").includes(type) === true
}

function formatTypeFilter(type: MetadataTypeFilterValue): string {
  if (type === "boolean") return "Булево"
  return type
}

function isObjectField(details: ResolvedMemberDetails): details is ObjectField {
  return Object.prototype.hasOwnProperty.call(details, "typeInfo")
}

function isFieldMemberKind(kind: MetadataMemberKind): kind is MetadataFieldKind {
  return Object.prototype.hasOwnProperty.call(objectFieldKindByTargetKind, kind)
}

function memberCollectionName(kind: Extract<MetadataMemberKind, "Form" | "Template" | "Command">): string {
  switch (kind) {
    case "Form":
      return "forms"
    case "Template":
      return "templates"
    case "Command":
      return "commands"
  }
}

function memberCollectionYamlName(kind: Extract<MetadataMemberKind, "Form" | "Template" | "Command">): string {
  switch (kind) {
    case "Form":
      return "Формы"
    case "Template":
      return "Макеты"
    case "Command":
      return "Команды"
  }
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

function memberLookupName(segment: Extract<ParsedMetadataTarget, { kind: "member" }>["segments"][number]): string {
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

function formatMemberTarget(target: Extract<ParsedMetadataTarget, { kind: "member" }>): string {
  return [
    rootToYAML[target.root],
    target.objectName,
    ...target.segments.flatMap((segment) => [memberKindToYAML[segment.kind], memberLookupName(segment)]),
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
