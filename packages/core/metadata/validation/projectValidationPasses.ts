import { compileValidationSchema, type ValidationSchemaValidator } from "./compileValidationSchema"
import { type TSchema } from "typebox"
import fs from "fs"
import { performance } from "node:perf_hooks"
import { dirname, join, resolve } from "path"
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { MetadataFieldKind, ParsedMetadataTarget } from "../commonObjects/metadataTargets/types"
import type { ConfigurationContext } from "../context/types"
import { stripCollectedSchemaRefs } from "../orchestration/jsonSchemaRefs"
import { parseMetadataYaml, type ParsedYaml } from "../../yaml/parseMetadataYaml"
import { type OwnerMetadata, type OwnerMetadataCache } from "./dataPath/ownerCache"
import { createValidationOwnerFacts } from "./dataPath/ownerFacts"
import { type ObjectField, type ObjectFieldIndex, type ObjectFieldKind } from "./dataPath/objectFields"
import { validateExcludedEqualNameYAML } from "./excludeIfEqualNameYAML"
import { getProjectFileValidators, getProjectReferenceMemberIndexContributors } from "./projectReferenceIndexRegistry"
import {
  projectMemberIndexKey,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
  type ProjectReferenceIndex,
  type ProjectValueIndexEntry,
  validatePendingReferencesWithIndex,
} from "./projectReferenceIndex"
import { exportJSONSchemaGraph } from "./projectFileSchema"
import type { ValidationProjectFile } from "./projectFiles"
import type { ProjectYamlCache, ProjectYamlEntry } from "./projectYamlCache"
import { validatePendingChecks, type ValidationPendingCheck } from "./projectValidationPendingChecks"
import { configurationValidationProjectSpec, validationProjectSpecs, type ValidationProjectSpec } from "./projectSpecs"
import type { ValidationDependencyRequest, ValidationObjectRecord } from "./projectValidationTypes"
import type { ValidationRulesSnapshot } from "./rulesSnapshot"
import type { Diagnostic } from "./types"
import { validateParsedFile } from "./validateFile"
import { extractValidationYamlFacts } from "./yamlFactExtractor"

type CompiledSchema = ValidationSchemaValidator<TSchema>
const formSchemaCache = new Map<string, CompiledSchema>()
const propertiesSchemaCache = new Map<string, CompiledSchema>()

export interface ValidationSchemaCache {
  form: () => CompiledSchema
  properties: (spec: ValidationProjectSpec) => CompiledSchema
  compileAll: () => ValidationSchemaCacheCompileProfile
}

export interface ValidationSchemaCacheCompileProfile {
  formMs: number
  propertiesMs: number
  totalMs: number
}

export type ProjectValidationFileState =
  | {
      kind: "properties"
      file: ValidationProjectFile
      pendingReferences: PendingMetadataTargetReference[]
      firstPassDiagnostics: Diagnostic[]
    }
  | {
      kind: "form"
      file: ValidationProjectFile
      pendingChecks: ValidationPendingCheck[]
      firstPassDiagnostics: Diagnostic[]
    }
  | { kind: "failed"; file: ValidationProjectFile; diagnostics: Diagnostic[] }

export interface ProjectValidationFirstPassResult {
  state: ProjectValidationFileState
  objectRecords: ValidationObjectRecord[]
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  diagnostics: Diagnostic[]
  profile?: ProjectValidationFirstPassProfile
}

export interface ProjectValidationFirstPassProfile {
  key: string
  totalMs: number
  cacheMs: number
  schemaMs: number
  validatorsMs: number
  equalNameMs: number
  yamlFactsMs: number
  fieldIndexMs: number
  objectIndexMs: number
  memberIndexMs: number
  valueIndexMs: number
  diagnostics: number
}

export interface ProjectValidationSecondPassParams {
  state: ProjectValidationFileState
  projectDir: string
  context: ConfigurationContext
  cache: ProjectYamlCache
  ownerCache: OwnerMetadataCache
  referenceIndex: ProjectReferenceIndex
  skipMetadataTargetValidation?: boolean
}

export type ProjectValidationSecondPassResult =
  | { status: "ok"; diagnostics: Diagnostic[] }
  | { status: "needsDependency"; diagnostics: Diagnostic[]; dependency: ValidationDependencyRequest }

type ProjectValidationYamlReadResult = ProjectYamlEntry | { filePath: string; error: Error }

const readCountsForTests = new Map<string, number>()

export function resetProjectValidationReadCountForTests(): void {
  readCountsForTests.clear()
}

export function getProjectValidationReadCountForTests(filePath: string): number {
  return readCountsForTests.get(resolve(filePath)) ?? 0
}

export function readProjectYamlEntryForValidation(filePath: string): ProjectValidationYamlReadResult {
  const absolutePath = resolve(filePath)
  readCountsForTests.set(absolutePath, (readCountsForTests.get(absolutePath) ?? 0) + 1)
  try {
    const text = fs.readFileSync(absolutePath, "utf8")
    return { filePath: absolutePath, text, parsed: parseMetadataYaml(text) }
  } catch (caught) {
    return { filePath: absolutePath, error: caught instanceof Error ? caught : new Error(String(caught)) }
  }
}

export function readProjectYamlDiagnostic(entry: { filePath: string; error: Error }): Diagnostic {
  return {
    filePath: entry.filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "external-file",
    message: `Не удалось прочитать YAML-файл: ${entry.error.message}`,
  }
}

export function createValidationSchemaCache(context: ConfigurationContext): ValidationSchemaCache {
  const propertiesSchemas = new Map<string, CompiledSchema>()
  let formSchema: CompiledSchema | undefined

  return {
    form() {
      formSchema ??= compileRegisteredFormSchema(context)

      return formSchema
    },
    properties(spec) {
      const key = spec.dir
      const existing = propertiesSchemas.get(key)
      if (existing) return existing

      const globalKey = `${context.version}:${context.defaultLanguage}:${spec.dir}`
      const compiled = propertiesSchemaCache.get(globalKey) ?? compileProjectPropertiesSchema(context, spec)
      propertiesSchemaCache.set(globalKey, compiled)
      propertiesSchemas.set(key, compiled)

      return compiled
    },
    compileAll() {
      const startedAt = performance.now()
      const formStartedAt = performance.now()
      this.form()
      const formMs = performance.now() - formStartedAt

      const propertiesStartedAt = performance.now()
      for (const spec of validationProjectSpecs) {
        this.properties(spec)
      }
      this.properties(configurationValidationProjectSpec)
      const propertiesMs = performance.now() - propertiesStartedAt

      return {
        formMs,
        propertiesMs,
        totalMs: performance.now() - startedAt,
      }
    },
  }
}

function compileProjectPropertiesSchema(context: ConfigurationContext, spec: ValidationProjectSpec): CompiledSchema {
  const graph = exportJSONSchemaGraph({
    context,
    excludeImplicitValueYAML: true,
    validationPropertyRefs: true,
    roots: [{ key: "properties", name: spec.rule.itemType }],
  })
  const rootSchema = stripCollectedSchemaRefs(graph.roots["properties"]!)
  return compileValidationSchema(graph.schemas, rootSchema, { inlineRefs: false })
}

function compileRegisteredFormSchema(context: ConfigurationContext): CompiledSchema {
  const cacheKey = `${context.version}:${context.defaultLanguage}`
  const cached = formSchemaCache.get(cacheKey)
  if (cached !== undefined) return cached

  const graph = exportJSONSchemaGraph({
    context,
    validationPropertyRefs: true,
    roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
  })
  const compiled = compileValidationSchema(graph.schemas, graph.roots["form"]!, {
    inlineRefs: false,
    eagerFallback: true,
  })
  formSchemaCache.set(cacheKey, compiled)
  return compiled
}

export function validateProjectFileFirstPass(params: {
  projectDir: string
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  schemaCache: ValidationSchemaCache
  rulesSnapshot?: ValidationRulesSnapshot
}): ProjectValidationFirstPassResult {
  if (params.file.kind === "form") return validateProjectFormFirstPass(params)
  return validateProjectPropertiesFirstPass(params)
}

export function validateProjectFileSecondPass(
  params: ProjectValidationSecondPassParams
): ProjectValidationSecondPassResult {
  if (params.state.kind === "failed") return { status: "ok", diagnostics: [] }

  if (params.state.kind === "form") {
    return {
      status: "ok",
      ...validatePendingChecks({ ownerCache: params.ownerCache, checks: params.state.pendingChecks }),
    }
  }

  const collected = params.skipMetadataTargetValidation
    ? { references: [], diagnostics: [] }
    : { references: params.state.pendingReferences, diagnostics: [] }
  const resolved = validatePendingReferencesWithIndex({
    index: params.referenceIndex,
    references: collected.references,
  })
  const diagnostics = [...collected.diagnostics, ...resolved.diagnostics]
  if (resolved.firstDependency !== undefined) {
    return { status: "needsDependency", diagnostics, dependency: resolved.firstDependency }
  }
  return { status: "ok", diagnostics }
}

function validateProjectFormFirstPass(params: {
  projectDir: string
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  schemaCache: ValidationSchemaCache
  rulesSnapshot?: ValidationRulesSnapshot
}): ProjectValidationFirstPassResult {
  const totalStartedAt = performance.now()
  const schemaStartedAt = performance.now()
  const schemaDiagnostics = validateProjectFileSchema({
    file: params.file,
    cache: params.cache,
    schema: params.schemaCache.form(),
  })
  const schemaMs = performance.now() - schemaStartedAt
  if (schemaDiagnostics.some((diagnostic) => diagnostic.source === "syntax")) {
    return failedFirstPass(params.file, schemaDiagnostics, {
      ...emptyFirstPassProfile("form"),
      totalMs: performance.now() - totalStartedAt,
      schemaMs,
      diagnostics: schemaDiagnostics.length,
    })
  }

  const entry = params.cache.get(params.file.absolutePath)
  if ("error" in entry) {
    return failedFirstPass(params.file, schemaDiagnostics, {
      ...emptyFirstPassProfile("form"),
      totalMs: performance.now() - totalStartedAt,
      schemaMs,
      diagnostics: schemaDiagnostics.length,
    })
  }

  const rulesSnapshot = requireRulesSnapshot(params.rulesSnapshot)
  const measuredYamlFacts = measureValidationPhase(() =>
    extractValidationYamlFacts({ file: params.file, parsed: entry.parsed, rulesSnapshot })
  )
  const yamlFacts = measuredYamlFacts.value
  const yamlFactsMs = measuredYamlFacts.timeMs
  const diagnostics = [...schemaDiagnostics, ...yamlFacts.diagnostics]

  const memberIndexStartedAt = performance.now()
  const memberIndexEntries = buildFormFileMemberIndexEntries(params.file)
  const memberIndexMs = performance.now() - memberIndexStartedAt

  return {
    state: {
      kind: "form",
      file: params.file,
      pendingChecks: yamlFacts.pendingChecks,
      firstPassDiagnostics: diagnostics,
    },
    diagnostics,
    objectRecords: [],
    objectIndexEntries: [],
    memberIndexEntries,
    valueIndexEntries: [],
    pendingReferences: [],
    profile: {
      ...emptyFirstPassProfile("form"),
      totalMs: performance.now() - totalStartedAt,
      schemaMs,
      memberIndexMs,
      yamlFactsMs,
      diagnostics: diagnostics.length,
    },
  }
}

function validateProjectPropertiesFirstPass(params: {
  projectDir: string
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  schemaCache: ValidationSchemaCache
  rulesSnapshot?: ValidationRulesSnapshot
}): ProjectValidationFirstPassResult {
  const totalStartedAt = performance.now()
  const cacheStartedAt = performance.now()
  const entry = params.cache.get(params.file.absolutePath)
  const cacheMs = performance.now() - cacheStartedAt
  if ("error" in entry) {
    const schemaStartedAt = performance.now()
    const diagnostics = validateProjectFileSchema({
      file: params.file,
      cache: params.cache,
      schema: params.schemaCache.properties(params.file.owner.spec),
    })
    const schemaMs = performance.now() - schemaStartedAt
    return failedFirstPass(params.file, diagnostics, {
      ...emptyFirstPassProfile(validationFirstPassProfileKey(params.file)),
      totalMs: performance.now() - totalStartedAt,
      cacheMs,
      schemaMs,
      diagnostics: diagnostics.length,
    })
  }

  const parsed = parsedForProjectFile(params.file, entry.parsed)
  const schemaStartedAt = performance.now()
  const baseSchemaDiagnostics = validateProjectFileSchema({
    file: params.file,
    cache: params.cache,
    schema: params.schemaCache.properties(params.file.owner.spec),
    parsed,
  })
  const schemaDiagnostics = baseSchemaDiagnostics
  const schemaMs = performance.now() - schemaStartedAt
  if (entry.parsed.syntaxErrors.length > 0) {
    return failedFirstPass(params.file, schemaDiagnostics, {
      ...emptyFirstPassProfile(validationFirstPassProfileKey(params.file)),
      totalMs: performance.now() - totalStartedAt,
      cacheMs,
      schemaMs,
      diagnostics: schemaDiagnostics.length,
    })
  }

  const validatorsStartedAt = performance.now()
  const requiredDiagnostics = validateRegisteredProjectFileValidators({
    file: params.file,
    parsed,
  })
  const validatorsMs = performance.now() - validatorsStartedAt
  if (requiredDiagnostics.length > 0) {
    const diagnostics = [...schemaDiagnostics, ...requiredDiagnostics]
    return failedFirstPass(params.file, diagnostics, {
      ...emptyFirstPassProfile(validationFirstPassProfileKey(params.file)),
      totalMs: performance.now() - totalStartedAt,
      cacheMs,
      schemaMs,
      validatorsMs,
      diagnostics: diagnostics.length,
    })
  }

  const rulesSnapshot = requireRulesSnapshot(params.rulesSnapshot)
  const equalNameValidationName =
    params.file.kind === "configuration" ? rootStringProperty(parsed.data, "Имя") : params.file.owner.name
  const equalNameStartedAt = performance.now()
  const equalNameDiagnostics = validateExcludedEqualNameYAML({
    filePath: params.file.absolutePath,
    parsed,
    rule: params.file.owner.spec.rule,
    context: params.context,
    name: equalNameValidationName,
  })
  const equalNameMs = performance.now() - equalNameStartedAt
  const measuredYamlFacts = measureValidationPhase(() => extractValidationYamlFacts({ file: params.file, parsed, rulesSnapshot }))
  const yamlFacts = measuredYamlFacts.value
  const yamlFactsMs = measuredYamlFacts.timeMs
  const ownerRef = { kind: params.file.owner.dir, name: params.file.owner.name }
  const fieldIndexStartedAt = performance.now()
  const fieldIndex = yamlFacts.fieldIndex ?? emptyObjectFieldIndex()
  const fieldIndexMs = performance.now() - fieldIndexStartedAt
  const ownerModelStub = (yamlFacts.ownerModelStub ?? {
    itemType: params.file.owner.spec.rule.itemType,
    name: params.file.owner.name,
  }) as never
  const owner: OwnerMetadata = {
    ref: ownerRef,
    filePath: params.file.absolutePath,
    model: ownerModelStub,
    rule: params.file.owner.spec.rule,
    spec: params.file.owner.spec,
    fieldIndex,
  }
  const ownerFacts = createValidationOwnerFacts({
    ref: ownerRef,
    filePath: params.file.absolutePath,
    fieldIndex,
    model: ownerModelStub,
  })
  const memberIndexStartedAt = performance.now()
  const memberIndexEntries = buildMemberIndexEntries({
    projectDir: params.projectDir,
    owner,
    hasFile: fs.existsSync,
  })
  const memberIndexMs = performance.now() - memberIndexStartedAt
  const diagnostics = [
    ...suppressEqualNameSchemaDiagnostics(schemaDiagnostics, equalNameDiagnostics),
    ...equalNameDiagnostics,
    ...yamlFacts.diagnostics,
    ...fieldIndex.diagnostics,
  ]

  return {
    state: {
      kind: "properties",
      file: params.file,
      pendingReferences: yamlFacts.pendingReferences,
      firstPassDiagnostics: diagnostics,
    },
    diagnostics,
    objectIndexEntries: yamlFacts.objectIndexEntries,
    memberIndexEntries,
    valueIndexEntries: yamlFacts.valueIndexEntries,
    pendingReferences: yamlFacts.pendingReferences,
    objectRecords: [
      {
        filePath: params.file.absolutePath,
        projectPath: params.file.projectPath,
        kind: params.file.kind,
        owner: { dir: params.file.owner.dir, name: params.file.owner.name },
        ownerRef,
        ownerFacts,
        fieldIndex,
        objectIndexEntries: yamlFacts.objectIndexEntries,
        memberIndexEntries,
        valueIndexEntries: yamlFacts.valueIndexEntries,
        pendingReferences: yamlFacts.pendingReferences,
        importDiagnostics: [],
      },
    ],
    profile: {
      key: validationFirstPassProfileKey(params.file),
      totalMs: performance.now() - totalStartedAt,
      cacheMs,
      schemaMs,
      validatorsMs,
      equalNameMs,
      yamlFactsMs,
      fieldIndexMs,
      objectIndexMs: 0,
      memberIndexMs,
      valueIndexMs: 0,
      diagnostics: diagnostics.length,
    },
  }
}

function failedFirstPass(
  file: ValidationProjectFile,
  diagnostics: Diagnostic[],
  profile?: ProjectValidationFirstPassProfile
): ProjectValidationFirstPassResult {
  return {
    state: { kind: "failed", file, diagnostics },
    diagnostics,
    objectRecords: [],
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
    ...(profile === undefined ? {} : { profile }),
  }
}

function emptyFirstPassProfile(key: string): ProjectValidationFirstPassProfile {
  return {
    key,
    totalMs: 0,
    cacheMs: 0,
    schemaMs: 0,
    validatorsMs: 0,
    equalNameMs: 0,
    yamlFactsMs: 0,
    fieldIndexMs: 0,
    objectIndexMs: 0,
    memberIndexMs: 0,
    valueIndexMs: 0,
    diagnostics: 0,
  }
}

function measureValidationPhase<T>(fn: () => T): { value: T; timeMs: number } {
  const startedAt = performance.now()
  const value = fn()
  return { value, timeMs: performance.now() - startedAt }
}

function emptyObjectFieldIndex(): ObjectFieldIndex {
  return { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
}

function rootStringProperty(data: unknown, key: string): string | undefined {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return undefined
  const value = (data as Record<string, unknown>)[key]
  return typeof value === "string" ? value : undefined
}

function requireRulesSnapshot(rulesSnapshot: ValidationRulesSnapshot | undefined): ValidationRulesSnapshot {
  if (rulesSnapshot === undefined) throw new Error("Worker validation requires ValidationRulesSnapshot")
  return rulesSnapshot
}

function validationFirstPassProfileKey(file: ValidationProjectFile): string {
  if (file.kind === "form") return "form"
  return `properties:${file.owner.dir}`
}

function buildFormFileMemberIndexEntries(file: ValidationProjectFile): ProjectMemberIndexEntry[] {
  if (file.kind !== "form" || !file.formName) return []

  const root = rootFromYAML[file.owner.dir]
  if (!root) return []

  const target: Extract<ParsedMetadataTarget, { kind: "member" }> = {
    kind: "member",
    root: root as never,
    objectName: file.owner.name,
    segments: [{ kind: "Form", name: file.formName }],
  }

  return [
    {
      canonical: projectMemberIndexKey(target),
      target,
      result: { ok: true, filePath: file.absolutePath, details: { kind: "Form", name: file.formName } },
    },
  ]
}

function buildMemberIndexEntries(params: {
  projectDir: string
  owner: OwnerMetadata
  hasFile: (filePath: string) => boolean
}): ProjectMemberIndexEntry[] {
  const entries: ProjectMemberIndexEntry[] = []
  const seen = new Set<string>()

  for (const field of params.owner.fieldIndex.fields.values()) {
    const target = fieldTarget(params.owner, field)
    addMemberIndexEntry(entries, seen, {
      canonical: projectMemberIndexKey(target),
      target,
      result: { ok: true, filePath: params.owner.filePath, details: field },
    })

    if (field.kind === "tabularSection" && field.tableSource) {
      for (const column of field.tableSource.columns.values()) {
        const nestedTarget = nestedFieldTarget(params.owner, field.name, column)
        addMemberIndexEntry(entries, seen, {
          canonical: projectMemberIndexKey(nestedTarget),
          target: nestedTarget,
          result: { ok: true, filePath: params.owner.filePath, details: column },
        })
      }
    }
  }

  for (const contributor of getProjectReferenceMemberIndexContributors()) {
    for (const entry of contributor(params)) addMemberIndexEntry(entries, seen, entry)
  }

  for (const entry of buildTemplateFileMemberIndexEntries(params.owner)) addMemberIndexEntry(entries, seen, entry)

  return entries
}

function addMemberIndexEntry(
  entries: ProjectMemberIndexEntry[],
  seen: Set<string>,
  entry: ProjectMemberIndexEntry
): void {
  if (seen.has(entry.canonical)) return
  seen.add(entry.canonical)
  entries.push(entry)
}

function buildTemplateFileMemberIndexEntries(owner: OwnerMetadata): ProjectMemberIndexEntry[] {
  const root = rootFromYAML[owner.ref.kind]
  if (!root || !owner.ref.name) return []

  const entries: ProjectMemberIndexEntry[] = []
  for (const folderName of ["Шаблоны", "Макеты"]) {
    const templatesDir = join(dirname(owner.filePath), folderName)
    if (!isDirectory(templatesDir)) continue

    for (const entry of fs.readdirSync(templatesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const templateDir = join(templatesDir, entry.name)
      if (!hasTemplateContent(templateDir)) continue

      const target: Extract<ParsedMetadataTarget, { kind: "member" }> = {
        kind: "member",
        root: root as never,
        objectName: owner.ref.name,
        segments: [{ kind: "Template", name: entry.name }],
      }
      entries.push({
        canonical: projectMemberIndexKey(target),
        target,
        result: { ok: true, filePath: templateDir, details: { kind: "Template", name: entry.name } },
      })
    }
  }
  return entries
}

function hasTemplateContent(templateDir: string): boolean {
  if (["Template.xml", "Template.txt", "Template.bin"].some((fileName) => fs.existsSync(join(templateDir, fileName)))) {
    return true
  }
  const extDir = join(templateDir, "Ext")
  return isDirectory(extDir) && fs.readdirSync(extDir).length > 0
}

function isDirectory(path: string): boolean {
  try {
    return fs.statSync(path).isDirectory()
  } catch {
    return false
  }
}

function fieldTarget(owner: OwnerMetadata, field: ObjectField): Extract<ParsedMetadataTarget, { kind: "member" }> {
  return {
    kind: "member",
    root: rootFromYAML[owner.ref.kind] as never,
    objectName: owner.ref.name ?? "",
    segments: [{ kind: metadataFieldKindFromObjectFieldKind(field.kind), name: metadataFieldTargetName(field) }],
  }
}

function nestedFieldTarget(
  owner: OwnerMetadata,
  tabularSectionName: string,
  field: ObjectField
): Extract<ParsedMetadataTarget, { kind: "member" }> {
  return {
    kind: "member",
    root: rootFromYAML[owner.ref.kind] as never,
    objectName: owner.ref.name ?? "",
    segments: [
      { kind: "TabularSection", name: tabularSectionName },
      { kind: metadataFieldKindFromObjectFieldKind(field.kind), name: metadataFieldTargetName(field) },
    ],
  }
}

function metadataFieldTargetName(field: ObjectField): string {
  return field.targetName ?? field.name
}

function metadataFieldKindFromObjectFieldKind(kind: ObjectFieldKind): MetadataFieldKind {
  switch (kind) {
    case "attribute":
      return "Attribute"
    case "standardAttribute":
      return "StandardAttribute"
    case "tabularSection":
      return "TabularSection"
    case "dimension":
      return "Dimension"
    case "resource":
      return "Resource"
    case "addressingAttribute":
      return "AddressingAttribute"
  }
}

function validateRegisteredProjectFileValidators(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
}): Diagnostic[] {
  return getProjectFileValidators(params.file.owner.spec.kind).flatMap((validator) =>
    validator({ filePath: params.file.absolutePath, parsed: params.parsed })
  )
}

function validateProjectFileSchema(params: {
  file: ValidationProjectFile
  cache: ProjectYamlCache
  schema: CompiledSchema
  parsed?: ParsedYaml
}): Diagnostic[] {
  const entry = params.cache.get(params.file.absolutePath)
  if ("error" in entry) {
    return [
      {
        filePath: entry.filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "external-file",
        message: `Не удалось прочитать YAML-файл: ${entry.error.message}`,
      },
    ]
  }

  return validateParsedFile({
    filePath: entry.filePath,
    parsed: params.parsed ?? entry.parsed,
    schema: params.schema,
  })
}

function parsedForProjectFile(file: ValidationProjectFile, parsed: ParsedYaml): ParsedYaml {
  if (file.kind === "properties" && parsed.syntaxErrors.length === 0 && parsed.data === undefined) {
    return { ...parsed, data: {} }
  }

  return parsed
}

function suppressEqualNameSchemaDiagnostics(
  schemaDiagnostics: Diagnostic[],
  equalNameDiagnostics: Diagnostic[]
): Diagnostic[] {
  if (equalNameDiagnostics.length === 0) return schemaDiagnostics

  return schemaDiagnostics.filter((diagnostic) => !isCoveredByEqualNameDiagnostic(diagnostic, equalNameDiagnostics))
}

function isCoveredByEqualNameDiagnostic(diagnostic: Diagnostic, equalNameDiagnostics: Diagnostic[]): boolean {
  if (diagnostic.source !== "structure" || diagnostic.path === undefined) return false

  return equalNameDiagnostics.some((equalNameDiagnostic) => {
    const equalNamePath = equalNameDiagnostic.path
    return equalNamePath === diagnostic.path || equalNamePath?.startsWith(`${diagnostic.path}/`) === true
  })
}
