import { existsSync } from "fs"
import { resolve } from "path"
import {
  memberKindToYAML,
  objectPathKindToYAML,
  rootToYAML,
  standardAttributeToYAML,
  type MetadataMemberKind,
  type MetadataObjectPathKind,
  type MetadataFieldKind,
  type MetadataTargetFilter,
  type MetadataTypeFilterValue,
  type MetadataRootName,
  type ParsedMetadataTarget,
  type StyleItemTargetType,
} from "../commonObjects/metadataTargets"
import type { ConfigurationContext } from "../context/types"
import type { DataPathTypeInfo } from "./dataPath/types"
import {
  createOwnerMetadataCache,
  createOwnerMetadataCacheFromValidationTable,
  type OwnerMetadata,
  type OwnerMetadataCache,
} from "./dataPath/ownerCache"
import { getObjectField, type ObjectField, type ObjectFieldKind } from "./dataPath/objectFields"
import { typeDescriptionToDataPathTypeInfo } from "./dataPath/typeDescription"
import { resolveValidationProjectFile } from "./projectFiles"
import { createProjectYamlCache, type ProjectYamlCache } from "./projectYamlCache"
import {
  getProjectInlineObjectResolvers,
  getProjectMemberResolvers,
  getProjectNamedResourceResolver,
  getProjectObjectPathResolver,
  getProjectValueResolver,
} from "./projectMetadataResolverRegistry"
import type { ValidationObjectTable } from "./projectValidationObjectTable"
import type { ValidationDependencyRequest, ValidationMode } from "./projectValidationTypes"
import type { Diagnostic } from "./types"

export interface CreateProjectMetadataResolverParams {
  projectDir: string
  yamlCache: ProjectYamlCache
  context: ConfigurationContext
  ownerCache?: OwnerMetadataCache
}

export type MetadataResolveResult =
  | { ok: true; filePath?: string; details?: unknown }
  | { ok: false; diagnostics: Diagnostic[]; dependency?: ValidationDependencyRequest }

export interface ProjectMetadataResolver {
  resolveObject(params: {
    target: Extract<ParsedMetadataTarget, { kind: "object" }>
    filters?: readonly MetadataTargetFilter[]
  }): MetadataResolveResult
  resolveMember(params: {
    target: Extract<ParsedMetadataTarget, { kind: "member" }>
    filters?: readonly MetadataTargetFilter[]
  }): MetadataResolveResult
  resolveValue(params: { target: Extract<ParsedMetadataTarget, { kind: "value" }> }): MetadataResolveResult
  resolveStyleItem(params: { name: string; expectedTypes: readonly StyleItemTargetType[] }): MetadataResolveResult
  resolveCommonPicture(params: { name: string }): MetadataResolveResult
}

interface ResolverCacheCounter {
  hits: number
  misses: number
}

export interface ProjectMetadataResolverCacheStatsForTests {
  object: ResolverCacheCounter
  member: ResolverCacheCounter
  value: ResolverCacheCounter
}

const resolverCacheStatsForTests = new WeakMap<ProjectMetadataResolver, ProjectMetadataResolverCacheStatsForTests>()

function createResolverCacheStatsForTests(): ProjectMetadataResolverCacheStatsForTests {
  return {
    object: { hits: 0, misses: 0 },
    member: { hits: 0, misses: 0 },
    value: { hits: 0, misses: 0 },
  }
}

export function getProjectMetadataResolverCacheStatsForTests(
  resolver: ProjectMetadataResolver
): ProjectMetadataResolverCacheStatsForTests {
  return resolverCacheStatsForTests.get(resolver) ?? createResolverCacheStatsForTests()
}

const objectFieldKindByTargetKind = {
  Attribute: "attribute",
  StandardAttribute: "standardAttribute",
  TabularSection: "tabularSection",
  Dimension: "dimension",
  Resource: "resource",
  AddressingAttribute: "addressingAttribute",
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

  return createProjectMetadataResolverCore({
    projectDir,
    yamlCache: params.yamlCache,
    ownerCache,
    hasFile: existsSync,
    missingObject: (target, filePath) => referenceError(filePath, `Не найден объект "${formatObjectTarget(target)}"`),
  })
}

export function createProjectMetadataResolverFromValidationTable(params: {
  projectDir: string
  table: ValidationObjectTable
  mode: ValidationMode
  ownerCache?: OwnerMetadataCache
  yamlCache?: ProjectYamlCache
}): ProjectMetadataResolver {
  const projectDir = resolve(params.projectDir)
  const yamlCache = params.yamlCache ?? createProjectYamlCache()
  const ownerCache =
    params.ownerCache ?? createOwnerMetadataCacheFromValidationTable({ projectDir, table: params.table })

  return createProjectMetadataResolverCore({
    projectDir,
    yamlCache,
    ownerCache,
    hasFile: (filePath) => params.table.hasFile(filePath),
    missingObject: (target, filePath) => {
      if (params.mode === "partial") {
        const dependency = dependencyRequest({ projectDir, filePath, requestedBy: filePath })
        if (dependency !== undefined) return { ok: false, diagnostics: [], dependency }
      }

      return referenceError(filePath, `Не найден объект "${formatObjectTarget(target)}"`)
    },
  })
}

function objectResolveCacheKey(params: {
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
  filters?: readonly MetadataTargetFilter[]
}): string {
  return ["object", formatObjectTarget(params.target), metadataTargetFiltersCacheKey(params.filters)].join("|")
}

function memberResolveCacheKey(params: {
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  filters?: readonly MetadataTargetFilter[]
}): string {
  return ["member", formatMemberTarget(params.target), metadataTargetFiltersCacheKey(params.filters)].join("|")
}

function valueResolveCacheKey(params: { target: Extract<ParsedMetadataTarget, { kind: "value" }> }): string {
  return ["value", formatValueTarget(params.target)].join("|")
}

function metadataTargetFiltersCacheKey(filters: readonly MetadataTargetFilter[] | undefined): string {
  return filters === undefined || filters.length === 0 ? "-" : JSON.stringify(filters)
}

function createProjectMetadataResolverCore(params: {
  projectDir: string
  yamlCache: ProjectYamlCache
  ownerCache: OwnerMetadataCache
  hasFile: (filePath: string) => boolean
  missingObject: (target: Extract<ParsedMetadataTarget, { kind: "object" }>, filePath: string) => MetadataResolveResult
}): ProjectMetadataResolver {
  const { projectDir, yamlCache, ownerCache, hasFile, missingObject } = params
  const objectResolveCache = new Map<string, MetadataResolveResult>()
  const memberResolveCache = new Map<string, MetadataResolveResult>()
  const valueResolveCache = new Map<string, MetadataResolveResult>()
  const cacheStats = createResolverCacheStatsForTests()

  function resolveObjectUncached(params: {
    target: Extract<ParsedMetadataTarget, { kind: "object" }>
    filters?: readonly MetadataTargetFilter[]
  }): MetadataResolveResult {
    const { target, filters } = params
    const rootResolver = getProjectObjectPathResolver(target.root)
    const rootPath = rootResolver?.({
      projectDir,
      target: { kind: "object", root: target.root, objectName: target.objectName },
    })
    const filePath = rootPath?.filePath
    if (!filePath || !hasFile(filePath)) return missingObject(target, filePath ?? projectDir)

    const filterResult = resolveObjectFilters({
      target,
      filters,
      resolveStyleItemByName: (name, expectedTypes) => resolver.resolveStyleItem({ name, expectedTypes }),
    })
    if (!filterResult.ok) return filterResult

    if (target.segments && target.segments.length > 0) {
      const nestedPath = rootResolver?.({ projectDir, target })
      if (nestedPath?.filePath && hasFile(nestedPath.filePath)) return { ok: true, filePath: nestedPath.filePath }

      for (const resolver of getProjectInlineObjectResolvers(target.root)) {
        const inlineObject = resolver({ projectDir, target, yamlCache, ownerCache })
        if (inlineObject) return inlineObject
      }

      return missingObject(target, nestedPath?.filePath ?? filePath)
    }

    return { ok: true, filePath }
  }

  function resolveMemberUncached(params: {
    target: Extract<ParsedMetadataTarget, { kind: "member" }>
    filters?: readonly MetadataTargetFilter[]
  }): MetadataResolveResult {
    const { target, filters } = params
    const object = resolver.resolveObject({
      target: { kind: "object", root: target.root, objectName: target.objectName },
    })
    if (!object.ok) return object

    if (target.objectSegments) {
      const nestedObject = resolver.resolveObject({
        target: {
          kind: "object",
          root: target.root,
          objectName: target.objectName,
          segments: target.objectSegments,
        },
      })
      if (!nestedObject.ok) return nestedObject
      if (!nestedObject.filePath)
        return referenceError(projectDir, `Не найден объект "${formatMemberTarget(target)}"`)

      const rawYaml = ownerRawYaml({ filePath: nestedObject.filePath, yamlCache })
      const resolved = resolveRegisteredMember({
        projectDir,
        ownerFilePath: nestedObject.filePath,
        rawYaml,
        target,
        yamlCache,
        ownerCache,
      })
      if (resolved) {
        return resolved.ok
          ? { ok: true, filePath: resolved.filePath ?? nestedObject.filePath, details: resolved.details }
          : resolved
      }

      return referenceError(
        nestedObject.filePath,
        `Не найден член "${formatMemberTarget(target)}": нет сегмента "${target.segments[0]?.name ?? ""}"`
      )
    }

    const owner = ownerCache.get({ kind: rootToYAML[target.root], name: target.objectName })
    if (owner.status !== "ok") return { ok: false, diagnostics: owner.diagnostics }

    const resolved = resolveMemberSegments({
      projectDir,
      owner: owner.owner,
      ownerFilePath: owner.owner.filePath,
      rawYaml: ownerRawYaml({ filePath: owner.owner.filePath, yamlCache }),
      target,
      segments: target.segments,
      yamlCache,
      ownerCache,
    })
    if (!resolved.ok) {
      return referenceError(
        owner.owner.filePath,
        `Не найден член "${formatMemberTarget(target)}": ${resolved.message}`
      )
    }

    const filterResult = applyMetadataTargetFilters({
      filePath: resolved.filePath ?? owner.owner.filePath,
      displayName: formatMemberTarget(target),
      target,
      details: resolved.details,
      filters,
      ownerCache,
    })
    if (!filterResult.ok) return filterResult

    return { ok: true, filePath: resolved.filePath ?? owner.owner.filePath, details: resolved.details }
  }

  function resolveValueUncached(params: {
    target: Extract<ParsedMetadataTarget, { kind: "value" }>
  }): MetadataResolveResult {
    const { target } = params
    const object = resolver.resolveObject({
      target: { kind: "object", root: target.root, objectName: target.objectName },
    })
    if (!object.ok) return object
    if (target.valueKind === "emptyRef") return object

    const owner = ownerCache.get({ kind: rootToYAML[target.root], name: target.objectName })
    if (owner.status !== "ok") return { ok: false, diagnostics: owner.diagnostics }

    const valueResolver = getProjectValueResolver(target.root)
    const resolved = valueResolver?.({ owner: owner.owner, target })
    if (resolved) return resolved

    return referenceError(owner.owner.filePath, `Не найдено значение "${formatValueTarget(target)}"`)
  }

  const resolver: ProjectMetadataResolver = {
    resolveObject(params) {
      const key = objectResolveCacheKey(params)
      const cached = objectResolveCache.get(key)
      if (cached !== undefined) {
        if (cached.ok || !cached.diagnostics.some((diagnostic) => hasFile(diagnostic.filePath))) {
          cacheStats.object.hits += 1
          return cached
        }

        objectResolveCache.delete(key)
      }

      cacheStats.object.misses += 1
      const result = resolveObjectUncached(params)
      objectResolveCache.set(key, result)
      return result
    },

    resolveMember(params) {
      const key = memberResolveCacheKey(params)
      const cached = memberResolveCache.get(key)
      if (cached !== undefined) {
        cacheStats.member.hits += 1
        return cached
      }

      cacheStats.member.misses += 1
      const result = resolveMemberUncached(params)
      memberResolveCache.set(key, result)
      return result
    },

    resolveValue(params) {
      const key = valueResolveCacheKey(params)
      const cached = valueResolveCache.get(key)
      if (cached !== undefined) {
        cacheStats.value.hits += 1
        return cached
      }

      cacheStats.value.misses += 1
      const result = resolveValueUncached(params)
      valueResolveCache.set(key, result)
      return result
    },

    resolveStyleItem({ name, expectedTypes }) {
      const resolver = getProjectNamedResourceResolver("StyleItem")
      return resolver
        ? resolver({ projectDir, name, expectedTypes, yamlCache })
        : referenceError(projectDir, `Не найден элемент стиля "ЭлементСтиля.${name}"`)
    },

    resolveCommonPicture({ name }) {
      const resolver = getProjectNamedResourceResolver("CommonPicture")
      return resolver
        ? resolver({ projectDir, name, yamlCache })
        : referenceError(projectDir, `Не найдена общая картинка "ОбщаяКартинка.${name}"`)
    },
  }

  resolverCacheStatsForTests.set(resolver, cacheStats)
  return resolver
}

function dependencyRequest(params: {
  projectDir: string
  filePath: string
  requestedBy: string
}): ValidationDependencyRequest | undefined {
  const file = resolveValidationProjectFile(params.projectDir, params.filePath)
  if (file === undefined) return undefined
  if (!existsSync(file.absolutePath)) return undefined
  return { kind: "needsDependency", file, requestedBy: params.requestedBy }
}

type ResolvedMemberDetails =
  | ObjectField
  | {
      kind: MetadataMemberKind
      name: string
      item: unknown
    }

function resolveObjectFilters(params: {
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
  filters: readonly MetadataTargetFilter[] | undefined
  resolveStyleItemByName: (name: string, expectedTypes: readonly StyleItemTargetType[]) => MetadataResolveResult
}): MetadataResolveResult {
  for (const filter of params.filters ?? []) {
    if (filter.kind === "styleItemType" && params.target.root === "StyleItem") {
      return params.resolveStyleItemByName(params.target.objectName, filter.values)
    }
  }

  return { ok: true }
}

function resolveMemberSegments(params: {
  projectDir: string
  owner: OwnerMetadata
  ownerFilePath: string
  rawYaml: unknown
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  segments: Extract<ParsedMetadataTarget, { kind: "member" }>["segments"]
  yamlCache: ProjectYamlCache
  ownerCache: OwnerMetadataCache
}): { ok: true; filePath?: string; details: ResolvedMemberDetails } | { ok: false; message: string } {
  const { owner, segments } = params
  const firstSegment = segments[0]
  if (!firstSegment) return { ok: false, message: "пустой путь" }

  if (isFieldMemberKind(firstSegment.kind)) {
    const resolved = resolveMemberFieldSegments(owner.fieldIndex.fields, segments)
    return resolved.ok ? { ok: true, details: resolved.field } : resolved
  }

  if (segments.length > 1) return { ok: false, message: `"${firstSegment.name}" не содержит вложенных членов` }

  const registered = resolveRegisteredMember({
    projectDir: params.projectDir,
    ownerFilePath: params.ownerFilePath,
    owner,
    rawYaml: params.rawYaml,
    target: params.target,
    yamlCache: params.yamlCache,
    ownerCache: params.ownerCache,
  })
  if (registered?.ok)
    return { ok: true, filePath: registered.filePath, details: registered.details as ResolvedMemberDetails }
  if (registered && !registered.ok) return { ok: false, message: registered.diagnostics[0]?.message ?? "не найдено" }

  return { ok: false, message: `нет сегмента "${firstSegment.name}"` }
}

function resolveRegisteredMember(params: {
  projectDir: string
  ownerFilePath: string
  owner?: OwnerMetadata
  rawYaml: unknown
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  yamlCache: ProjectYamlCache
  ownerCache: OwnerMetadataCache
}): MetadataResolveResult | undefined {
  const firstSegment = params.target.segments[0]
  if (!firstSegment) return undefined

  for (const resolver of getProjectMemberResolvers(firstSegment.kind)) {
    const resolved = resolver({
      projectDir: params.projectDir,
      ownerFilePath: params.ownerFilePath,
      owner: params.owner,
      rawYaml: params.rawYaml,
      segment: firstSegment,
      target: params.target,
      yamlCache: params.yamlCache,
      ownerCache: params.ownerCache,
    })
    if (resolved !== undefined) return resolved
  }

  return undefined
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
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  details: ResolvedMemberDetails
  filters: readonly MetadataTargetFilter[] | undefined
  ownerCache: OwnerMetadataCache
}): MetadataResolveResult {
  for (const filter of params.filters ?? []) {
    switch (filter.kind) {
      case "directMember":
        if (params.target.segments.length !== 1) {
          return referenceError(
            params.filePath,
            `Член "${params.displayName}" не подходит: ожидаются прямые члены текущего объекта`
          )
        }
        break
      case "hasType":
        if (!matchesHasTypeFilter(params.details, filter.type)) {
          return referenceError(
            params.filePath,
            `Член "${params.displayName}" не подходит: ожидаются члены, тип которых содержит ${formatTypeFilter(filter.type)}`
          )
        }
        break
      case "stringIndexedAttribute":
        {
          const filterResult = resolveStringIndexedAttributeFilter(params.details, params.ownerCache)
          if (!filterResult.ok) return filterResult
          if (filterResult.matches) break
        }
        return referenceError(
          params.filePath,
          `Член "${params.displayName}" не подходит: ожидаются реквизиты, пригодные для ввода по строке`
        )
      case "styleItemType":
        break
    }
  }

  return { ok: true, filePath: params.filePath, details: params.details }
}

function resolveStringIndexedAttributeFilter(
  details: ResolvedMemberDetails,
  ownerCache: OwnerMetadataCache
): { ok: true; matches: boolean } | { ok: false; diagnostics: Diagnostic[] } {
  if (matchesStringIndexedAttributeFilter(details)) return { ok: true, matches: true }
  if (!isObjectField(details)) return { ok: true, matches: false }

  const definedTypes = details.typeInfo.definedTypes ?? []
  if (definedTypes.length === 0) return { ok: true, matches: false }

  for (const definedType of definedTypes) {
    const ownerResult = ownerCache.get({ kind: "ОпределяемыйТип", name: definedType })
    if (ownerResult.status !== "ok") return { ok: false, diagnostics: ownerResult.diagnostics }

    const typeInfo = typeDescriptionToDataPathTypeInfo(definedTypeType(ownerResult.owner.model))
    if (matchesStringIndexedAttributeFilter({ ...details, typeInfo })) return { ok: true, matches: true }
  }

  return { ok: true, matches: false }
}

function definedTypeType(model: unknown): Parameters<typeof typeDescriptionToDataPathTypeInfo>[0] {
  return metadataRecord(model).type as Parameters<typeof typeDescriptionToDataPathTypeInfo>[0]
}

function resolveMemberFieldSegments(
  fields: Map<string, ObjectField>,
  segments: Extract<ParsedMetadataTarget, { kind: "member" }>["segments"]
): { ok: true; field: ObjectField } | { ok: false; message: string } {
  let currentFields = fields
  let currentField: ObjectField | undefined

  for (const [index, segment] of segments.entries()) {
    if (!isFieldMemberKind(segment.kind)) return { ok: false, message: `"${segment.name}" имеет другой вид` }

    currentField = getObjectField({
      index: { fields: currentFields, standardAttributeAliases: new Map(), diagnostics: [] },
      name: memberLookupName(segment),
    })
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

function objectSegmentKindToYAML(kind: MetadataRootName | MetadataObjectPathKind): string {
  if (isMetadataRootName(kind)) return rootToYAML[kind]
  return objectPathKindToYAML[kind]
}

function isMetadataRootName(kind: MetadataRootName | MetadataObjectPathKind): kind is MetadataRootName {
  return Object.prototype.hasOwnProperty.call(rootToYAML, kind)
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

function memberLookupName(segment: Extract<ParsedMetadataTarget, { kind: "member" }>["segments"][number]): string {
  return segment.kind === "StandardAttribute" ? (standardAttributeToYAML[segment.name] ?? segment.name) : segment.name
}

function formatMemberTarget(target: Extract<ParsedMetadataTarget, { kind: "member" }>): string {
  return [
    rootToYAML[target.root],
    target.objectName,
    ...(target.objectSegments ?? []).flatMap((segment) => [objectSegmentKindToYAML(segment.kind), segment.objectName]),
    ...target.segments.flatMap((segment) => [memberKindToYAML[segment.kind], memberLookupName(segment)]),
  ].join(".")
}

function formatObjectTarget(target: Extract<ParsedMetadataTarget, { kind: "object" }>): string {
  return [
    rootToYAML[target.root],
    target.objectName,
    ...(target.segments ?? []).flatMap((segment) => [objectSegmentKindToYAML(segment.kind), segment.objectName]),
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
