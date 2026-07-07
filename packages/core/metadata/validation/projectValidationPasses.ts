import { compileValidationSchema, type ValidationSchemaValidator } from "./compileValidationSchema"
import { Type, type TSchema } from "typebox"
import fs from "fs"
import { performance } from "node:perf_hooks"
import { dirname, join, resolve } from "path"
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { MetadataFieldKind, ParsedMetadataTarget } from "../commonObjects/metadataTargets/types"
import type { ConfigurationContext } from "../context/types"
import { collectSchemaRefs, stripCollectedSchemaRefs } from "../orchestration/jsonSchemaRefs"
import { metadataTargetOwnerFromRule } from "../orchestration/property/metadataTargetString"
import type { ExternalValidationProperty, MetadataItem } from "../orchestration/property/types"
import { parseMetadataYaml, type ParsedYaml } from "../../yaml/parseMetadataYaml"
import { type OwnerMetadata, type OwnerMetadataCache } from "./dataPath/ownerCache"
import { createValidationOwnerFacts } from "./dataPath/ownerFacts"
import { buildObjectFieldIndex, type ObjectField, type ObjectFieldKind } from "./dataPath/objectFields"
import { validateExcludedEqualNameYAML } from "./excludeIfEqualNameYAML"
import { getRegisteredFormValidationPasses } from "./formValidationRegistry"
import { collectMetadataTargetReferencesInModel } from "./metadataTargetTraversal"
import { getProjectFileValidators, getProjectReferenceMemberIndexContributors } from "./projectReferenceIndexRegistry"
import {
  projectMemberIndexKey,
  projectObjectIndexKey,
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
import {
  configurationValidationProjectSpec,
  validationProjectSpecs,
  type ValidationProjectSpec,
} from "./projectSpecs"
import type { ValidationDependencyRequest, ValidationObjectRecord } from "./projectValidationTypes"
import type { Diagnostic } from "./types"
import { typeboxErrorsToDiagnostics } from "./typeboxErrorsToDiagnostics"
import { validateParsedFile } from "./validateFile"
import { validateUniqueNameScopes } from "./uniqueNameScopes"
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
  importMs: number
  equalNameMs: number
  uniqueScopesMs: number
  referencesMs: number
  fieldIndexMs: number
  objectIndexMs: number
  memberIndexMs: number
  valueIndexMs: number
  formImportMs: number
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

      const schemaMode = spec.validationSchemaMode ?? "externalRefs"
      const globalKey = `${context.version}:${context.defaultLanguage}:${spec.dir}:${schemaMode}`
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
  const schemaMode = spec.validationSchemaMode ?? "externalRefs"
  if (schemaMode !== "externalRefs") {
    return compileValidationSchema(spec.exportSchema({ context, mode: "inline" }))
  }

  const graph = exportJSONSchemaGraph({
    context,
    roots: [{ key: "properties", name: spec.rule.itemType }],
  })
  const rootSchema = replaceExternalValidationProperties(
    stripCollectedSchemaRefs(graph.roots["properties"]!),
    spec.externalValidationProperties
  )
  const schemas = reachableSchemas(rootSchema, graph.schemas)

  return compileValidationSchema(schemas, rootSchema, { inlineRefs: false })
}

function replaceExternalValidationProperties(
  schema: TSchema,
  properties: readonly ExternalValidationProperty[] | undefined
): TSchema {
  if (properties === undefined || properties.length === 0) return schema

  const schemaProperties = (schema as { properties?: Record<string, TSchema> }).properties
  if (schemaProperties === undefined) return schema

  const nextProperties = { ...schemaProperties }
  for (const property of properties) {
    if (nextProperties[property.yaml] !== undefined) {
      nextProperties[property.yaml] = Type.Unknown()
    }
  }

  return { ...schema, properties: nextProperties } as TSchema
}

function reachableSchemas(root: TSchema, schemas: Record<string, TSchema>): Record<string, TSchema> {
  const result: Record<string, TSchema> = {}
  const pendingRefs = collectSchemaRefs(root)

  for (let index = 0; index < pendingRefs.length; index += 1) {
    const ref = pendingRefs[index]
    if (result[ref] !== undefined) continue

    const schema = schemas[ref]
    if (schema === undefined) continue

    result[ref] = schema
    pendingRefs.push(...collectSchemaRefs(schema))
  }

  return result
}

function compileRegisteredFormSchema(context: ConfigurationContext): CompiledSchema {
  const cacheKey = `${context.version}:${context.defaultLanguage}`
  const cached = formSchemaCache.get(cacheKey)
  if (cached !== undefined) return cached

  const graph = exportJSONSchemaGraph({
    context,
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
  rulesSnapshot?: import("./rulesSnapshot").ValidationRulesSnapshot
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
  rulesSnapshot?: import("./rulesSnapshot").ValidationRulesSnapshot
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
  const yamlFacts =
    "error" in entry || params.rulesSnapshot === undefined
      ? undefined
      : extractValidationYamlFacts({ file: params.file, parsed: entry.parsed, rulesSnapshot: params.rulesSnapshot })

  const passes = getRegisteredFormValidationPasses()
  if (passes === undefined) {
    const profile = {
      ...emptyFirstPassProfile("form"),
      totalMs: performance.now() - totalStartedAt,
      schemaMs,
      diagnostics: schemaDiagnostics.length,
    }
    return {
      state: { kind: "failed", file: params.file, diagnostics: schemaDiagnostics },
      diagnostics: schemaDiagnostics,
      objectRecords: [],
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
      profile,
    }
  }

  const formImportStartedAt = performance.now()
  const first = passes.firstPass({
    projectDir: params.projectDir,
    formDir: join(
      params.projectDir,
      params.file.owner.dir,
      params.file.owner.name,
      "Формы",
      params.file.formName ?? ""
    ),
    formName: params.file.formName ?? "",
    owner: { dir: params.file.owner.dir, name: params.file.owner.name },
    cache: params.cache,
    context: params.context,
    suppressFormImportDiagnostics: schemaDiagnostics.length > 0,
  })
  const formImportMs = performance.now() - formImportStartedAt
  const diagnostics = [...schemaDiagnostics, ...first.diagnostics, ...(yamlFacts?.diagnostics ?? [])]
  if (first.status === "failed") {
    return failedFirstPass(params.file, diagnostics, {
      ...emptyFirstPassProfile("form"),
      totalMs: performance.now() - totalStartedAt,
      schemaMs,
      formImportMs,
      diagnostics: diagnostics.length,
    })
  }

  const memberIndexStartedAt = performance.now()
  const memberIndexEntries = buildFormFileMemberIndexEntries(params.file)
  const memberIndexMs = performance.now() - memberIndexStartedAt

  return {
    state: {
      kind: "form",
      file: params.file,
      pendingChecks: yamlFacts?.pendingChecks ?? [],
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
      formImportMs,
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
  rulesSnapshot?: import("./rulesSnapshot").ValidationRulesSnapshot
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
  const externalSchemaDiagnostics =
    entry.parsed.syntaxErrors.length > 0
      ? []
      : validateExternalValidationProperties({
          file: params.file,
          parsed,
          schemaCache: params.schemaCache,
        })
  const schemaDiagnostics = [...baseSchemaDiagnostics, ...externalSchemaDiagnostics]
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

  if (params.rulesSnapshot !== undefined) {
    const equalNameValidationName = params.file.kind === "properties" ? params.file.owner.name : undefined
    const equalNameStartedAt = performance.now()
    const equalNameDiagnostics = validateExcludedEqualNameYAML({
      filePath: params.file.absolutePath,
      parsed,
      rule: params.file.owner.spec.rule,
      context: params.context,
      name: equalNameValidationName,
    })
    const equalNameMs = performance.now() - equalNameStartedAt
    const yamlFacts = extractValidationYamlFacts({ file: params.file, parsed, rulesSnapshot: params.rulesSnapshot })
    const ownerRef = { kind: params.file.owner.dir, name: params.file.owner.name }
    const ownerModel = (yamlFacts.ownerModelStub ?? {
      itemType: params.file.owner.spec.rule.itemType,
      name: params.file.owner.name,
    }) as unknown as MetadataItem
    const fieldIndexStartedAt = performance.now()
    const fieldIndex = buildObjectFieldIndex({
      ref: ownerRef,
      model: ownerModel,
      rule: params.file.owner.spec.rule,
    })
    const fieldIndexMs = performance.now() - fieldIndexStartedAt
    const owner: OwnerMetadata = {
      ref: ownerRef,
      filePath: params.file.absolutePath,
      model: ownerModel,
      rule: params.file.owner.spec.rule,
      spec: params.file.owner.spec,
      fieldIndex,
    }
    const ownerFacts = createValidationOwnerFacts({
      ref: ownerRef,
      filePath: params.file.absolutePath,
      fieldIndex,
      model: ownerModel,
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
        importMs: 0,
        equalNameMs,
        uniqueScopesMs: 0,
        referencesMs: 0,
        fieldIndexMs,
        objectIndexMs: 0,
        memberIndexMs,
        valueIndexMs: 0,
        formImportMs: 0,
        diagnostics: diagnostics.length,
      },
    }
  }

  const importStartedAt = performance.now()
  const imported = importPropertiesModel({
    spec: params.file.owner.spec,
    context: params.context,
    parsed,
    name: params.file.owner.name,
    filePath: params.file.absolutePath,
  })
  const importMs = performance.now() - importStartedAt
  if ("diagnostic" in imported) {
    const diagnostics = [...schemaDiagnostics, imported.diagnostic]
    return failedFirstPass(params.file, diagnostics, {
      ...emptyFirstPassProfile(validationFirstPassProfileKey(params.file)),
      totalMs: performance.now() - totalStartedAt,
      cacheMs,
      schemaMs,
      validatorsMs,
      importMs,
      diagnostics: diagnostics.length,
    })
  }

  const equalNameValidationName =
    params.file.kind === "configuration"
      ? metadataModelName(imported.model)
      : params.file.kind === "properties"
        ? params.file.owner.name
        : undefined
  const equalNameStartedAt = performance.now()
  const equalNameDiagnostics = validateExcludedEqualNameYAML({
    filePath: params.file.absolutePath,
    parsed,
    rule: params.file.owner.spec.rule,
    context: params.context,
    name: equalNameValidationName,
  })
  const equalNameMs = performance.now() - equalNameStartedAt
  const metadataTargetOwner = metadataTargetOwnerFromRule({
    itemRule: params.file.owner.spec.rule,
    name: params.file.owner.name,
    context: params.context,
  })
  const referencesStartedAt = performance.now()
  const pendingReferences = collectMetadataTargetReferencesInModel({
    filePath: params.file.absolutePath,
    parsed,
    model: imported.model,
    rule: params.file.owner.spec.rule,
    owner: metadataTargetOwner,
  })
  const referencesMs = performance.now() - referencesStartedAt

  const uniqueScopesStartedAt = performance.now()
  const uniqueScopeDiagnostics = validateUniqueNameScopes({
    filePath: params.file.absolutePath,
    parsed,
    model: imported.model,
    rule: params.file.owner.spec.rule,
  })
  const uniqueScopesMs = performance.now() - uniqueScopesStartedAt

  const diagnostics = [
    ...suppressEqualNameSchemaDiagnostics(schemaDiagnostics, equalNameDiagnostics),
    ...equalNameDiagnostics,
    ...uniqueScopeDiagnostics,
    ...(params.rulesSnapshot === undefined ? pendingReferences.diagnostics : []),
  ]
  const ownerRef = { kind: params.file.owner.dir, name: params.file.owner.name }
  const ownerWithoutIndex = {
    ref: ownerRef,
    filePath: params.file.absolutePath,
    model: imported.model,
    rule: params.file.owner.spec.rule,
    spec: params.file.owner.spec,
  }
  const fieldIndexStartedAt = performance.now()
  const fieldIndex = buildObjectFieldIndex(ownerWithoutIndex)
  const fieldIndexMs = performance.now() - fieldIndexStartedAt
  const owner: OwnerMetadata = {
    ...ownerWithoutIndex,
    fieldIndex,
  }
  const ownerFacts = createValidationOwnerFacts({
    ref: ownerRef,
    filePath: params.file.absolutePath,
    fieldIndex,
    model: imported.model,
  })
  const memberIndexStartedAt = performance.now()
  const yamlFacts =
    params.rulesSnapshot === undefined
      ? undefined
      : extractValidationYamlFacts({ file: params.file, parsed, rulesSnapshot: params.rulesSnapshot })
  const memberIndexEntries = buildMemberIndexEntries({
    projectDir: params.projectDir,
    owner,
    hasFile: fs.existsSync,
  })
  const memberIndexMs = performance.now() - memberIndexStartedAt
  const objectIndexStartedAt = performance.now()
  const modelObjectIndexEntry = buildObjectIndexEntry({ owner, file: params.file })
  const objectIndexEntries = yamlFacts?.objectIndexEntries ?? (modelObjectIndexEntry ? [modelObjectIndexEntry] : [])
  const objectIndexMs = performance.now() - objectIndexStartedAt
  const valueIndexStartedAt = performance.now()
  const valueIndexEntries = buildValueIndexEntries({ owner })
  const valueIndexMs = performance.now() - valueIndexStartedAt

  return {
    state: {
      kind: "properties",
      file: params.file,
      pendingReferences: yamlFacts?.pendingReferences ?? pendingReferences.references,
      firstPassDiagnostics: diagnostics,
    },
    diagnostics,
    objectIndexEntries,
    memberIndexEntries,
    valueIndexEntries,
    pendingReferences: yamlFacts?.pendingReferences ?? pendingReferences.references,
    objectRecords: [
      {
        filePath: params.file.absolutePath,
        projectPath: params.file.projectPath,
        kind: params.file.kind,
        owner: { dir: params.file.owner.dir, name: params.file.owner.name },
        ownerRef,
        ownerFacts,
        fieldIndex,
        objectIndexEntries,
        memberIndexEntries,
        valueIndexEntries,
        pendingReferences: yamlFacts?.pendingReferences ?? pendingReferences.references,
        importDiagnostics: [],
      },
    ],
    profile: {
      key: validationFirstPassProfileKey(params.file),
      totalMs: performance.now() - totalStartedAt,
      cacheMs,
      schemaMs,
      validatorsMs,
      importMs,
      equalNameMs,
      uniqueScopesMs,
      referencesMs,
      fieldIndexMs,
      objectIndexMs,
      memberIndexMs,
      valueIndexMs,
      formImportMs: 0,
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
    importMs: 0,
    equalNameMs: 0,
    uniqueScopesMs: 0,
    referencesMs: 0,
    fieldIndexMs: 0,
    objectIndexMs: 0,
    memberIndexMs: 0,
    valueIndexMs: 0,
    formImportMs: 0,
    diagnostics: 0,
  }
}

function validationFirstPassProfileKey(file: ValidationProjectFile): string {
  if (file.kind === "form") return "form"
  return `properties:${file.owner.dir}`
}

function buildObjectIndexEntry(params: {
  owner: OwnerMetadata
  file: ValidationProjectFile
}): ProjectObjectIndexEntry | undefined {
  const target = objectTargetForProjectFile({ file: params.file, owner: params.owner })
  if (target === undefined) return undefined
  return {
    canonical: projectObjectIndexKey(target),
    target,
    result: { ok: true, filePath: params.owner.filePath, details: objectIndexDetails(params.owner) },
  }
}

function objectIndexDetails(owner: OwnerMetadata): { type?: string } {
  const type = metadataRecord(owner.model)["type"]
  return typeof type === "string" ? { type } : {}
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

function objectTargetForProjectFile(params: {
  file: ValidationProjectFile
  owner: OwnerMetadata
}): Extract<ParsedMetadataTarget, { kind: "object" }> | undefined {
  const { file, owner } = params
  const root =
    metadataTargetOwnerFromRule({ itemRule: owner.rule, name: file.owner.name })?.root ?? rootFromYAML[file.owner.dir]
  if (!root || file.owner.name.length === 0) return undefined
  const nesting = file.owner.spec.nesting
  if (nesting?.kind !== "recursiveChildDir") {
    return {
      kind: "object",
      root: root as never,
      objectName: file.owner.name,
    }
  }

  const parts = file.projectPath.split("/")
  if (parts[0] !== file.owner.dir || parts[parts.length - 1] !== "Свойства.yaml") return undefined
  const rootObjectName = parts[1]
  if (rootObjectName === undefined || rootObjectName.length === 0) return undefined
  const nestedNames: string[] = []
  for (let index = 2; index < parts.length - 2; index += 2) {
    if (parts[index] !== nesting.childDir) return undefined
    const objectName = parts[index + 1]
    if (objectName === undefined || objectName.length === 0) return undefined
    nestedNames.push(objectName)
  }

  return {
    kind: "object",
    root: root as never,
    objectName: rootObjectName,
    segments: nestedNames.map((objectName) => ({ kind: root as never, objectName })),
  }
}

function buildValueIndexEntries(_params: { owner: OwnerMetadata }): ProjectValueIndexEntry[] {
  return []
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

function validateExternalValidationProperties(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  schemaCache: ValidationSchemaCache
}): Diagnostic[] {
  const properties = params.file.owner.spec.externalValidationProperties
  if (properties === undefined || properties.length === 0) return []
  if (params.parsed.data === null || typeof params.parsed.data !== "object" || Array.isArray(params.parsed.data)) {
    return []
  }

  const data = params.parsed.data as Record<string, unknown>
  const diagnostics: Diagnostic[] = []

  for (const property of properties) {
    if (!Object.prototype.hasOwnProperty.call(data, property.yaml)) continue

    const schema = externalValidationSchema(params.schemaCache, property)
    const value = data[property.yaml]
    const [valid, errors] = schema.Errors(value)
    if (valid) continue

    diagnostics.push(
      ...typeboxErrorsToDiagnostics(
        errors.map((error) => ({
          ...error,
          instancePath: prefixJsonPointer(jsonPointer(property.yaml), error.instancePath),
          value: params.parsed.data,
        })),
        params.parsed,
        params.file.absolutePath,
        schema
      )
    )
  }

  return diagnostics
}

function externalValidationSchema(
  schemaCache: ValidationSchemaCache,
  property: ExternalValidationProperty
): CompiledSchema {
  switch (property.validator) {
    case "form":
      return schemaCache.form()
  }
}

function jsonPointer(segment: string): string {
  return `/${segment.replace(/~/g, "~0").replace(/\//g, "~1")}`
}

function prefixJsonPointer(parentPath: string, childPath: string): string {
  if (childPath === "") return parentPath
  return `${parentPath}${childPath}`
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

function importPropertiesModel(params: {
  spec: ValidationProjectSpec
  context: ConfigurationContext
  parsed: ParsedYaml
  name: string
  filePath: string
}): { model: MetadataItem } | { diagnostic: Diagnostic } {
  try {
    const model = params.spec.importModel({
      context: params.context,
      parsed: params.parsed,
      name: params.name,
    })
    if (model !== undefined) return { model }

    return {
      diagnostic: importDiagnostic(params.filePath, "Не удалось импортировать свойства"),
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught)
    return {
      diagnostic: importDiagnostic(params.filePath, `Не удалось импортировать свойства: ${message}`),
    }
  }
}

function metadataModelName(model: MetadataItem): string | undefined {
  const record = model as { name?: unknown }
  return typeof record.name === "string" ? record.name : undefined
}

function importDiagnostic(filePath: string, message: string): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "structure",
    message,
  }
}
