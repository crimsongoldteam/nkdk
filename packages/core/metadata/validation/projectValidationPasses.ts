import { compileValidationSchema, type ValidationSchemaValidator } from "./compileValidationSchema"
import fs from "fs"
import { performance } from "node:perf_hooks"
import { resolve } from "path"
import { rootFromYAML } from "../ruleRuntime/metadataTarget/roots"
import type { MetadataFieldKind, ParsedMetadataTarget } from "../ruleRuntime/metadataTarget/types"
import type { ConfigurationContext } from "../context/types"
import { getMetadataComponentDescriptor } from "../components/descriptor"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { stripCollectedSchemaRefs } from "../ruleRuntime/jsonSchemaRefs"
import { parseMetadataYaml, type ParsedYaml } from "../../yaml/parseMetadataYaml"
import { type OwnerMetadata, type OwnerMetadataCache } from "./dataPath/ownerCache"
import type { ValidationOwnerFacts } from "./dataPath/ownerFacts"
import { buildObjectFieldIndex, type ObjectField, type ObjectFieldIndex, type ObjectFieldKind } from "./dataPath/objectFields"
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
import { configurationValidationProjectSpec, validationProjectSpecs } from "./projectSpecs"
import type { ValidationFormIndexContribution, ValidationObjectRecord } from "./projectValidationTypes"
import type { ValidationRulesSnapshot } from "./rulesSnapshot"
import type { Diagnostic } from "./types"
import { projectLocalDependenciesFromFacts } from "./projectLocalDependencies"
import { validateParsedFile } from "./validateFile"
import {
  extractValidationYamlFacts,
  type LocalValueValidationProfile,
} from "./yamlFactExtractor"
import { registeredProjectValidationFormRules } from "./projectValidationFormRules"
import type { FormStructuredComponent } from "./formContracts"
import { collectAddressableRequiredChecks } from "./addressableRequired"

type CompiledSchema = ValidationSchemaValidator
type ValidationSchemaVariant = "full" | "extension-overlay"
const formSchemaCache = new WeakMap<
  MetadataItemRule,
  Map<string, CompiledSchema>
>()
const propertiesSchemaCache = new Map<string, CompiledSchema>()

export interface ValidationSchemaCache {
  form: (rule: MetadataItemRule, variant?: ValidationSchemaVariant) => CompiledSchema
  properties: (rule: MetadataItemRule, variant?: ValidationSchemaVariant) => CompiledSchema
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
      pendingChecks: ValidationPendingCheck[]
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
  schemaDiagnostics: Diagnostic[]
  contributedFacts: boolean
  objectRecords: ValidationObjectRecord[]
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  dependencies: string[]
  form?: ValidationFormIndexContribution
  structuredComponents?: readonly FormStructuredComponent[]
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
  localValueValidationProfile: LocalValueValidationProfile
  yamlFactsMs: number
  fieldIndexMs: number
  objectIndexMs: number
  memberIndexMs: number
  valueIndexMs: number
  diagnostics: number
  propertyEvents: number
}

export interface ProjectValidationFileFacts {
  objectRecords: ValidationObjectRecord[]
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  pendingChecks: ValidationPendingCheck[]
  diagnostics: Diagnostic[]
  localDependencies: import("../projectDefinition/componentIndexFacts").ProjectLocalDependency[]
  form?: ValidationFormIndexContribution
  structuredComponents?: readonly FormStructuredComponent[]
  profile: {
    yamlFactsMs: number
    localValueValidationProfile: LocalValueValidationProfile
    fieldIndexMs: number
    memberIndexMs: number
    propertyEvents: number
  }
}

export interface ProjectValidationSecondPassParams {
  state: ProjectValidationFileState
  projectDir: string
  context: ConfigurationContext
  ownerCache: OwnerMetadataCache
  referenceIndex: ProjectReferenceIndex
  skipMetadataTargetValidation?: boolean
}

export type ProjectValidationSecondPassResult = { status: "ok"; diagnostics: Diagnostic[] }

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
  const formSchemas = new WeakMap<MetadataItemRule, Partial<Record<ValidationSchemaVariant, CompiledSchema>>>()

  return {
    form(rule, variant = "full") {
      const existing = formSchemas.get(rule)?.[variant]
      if (existing !== undefined) return existing
      const compiled = compileRegisteredFormSchema(context, rule, variant)
      formSchemas.set(rule, { ...formSchemas.get(rule), [variant]: compiled })
      return compiled
    },
    properties(rule, variant = "full") {
      const key = `${variant}:${rule.itemType}`
      const existing = propertiesSchemas.get(key)
      if (existing) return existing

      const globalKey = [context.version, context.defaultLanguage, variant, rule.itemType].join(":")
      const compiled = propertiesSchemaCache.get(globalKey) ?? compileProjectPropertiesSchema(context, rule, variant)
      propertiesSchemaCache.set(globalKey, compiled)
      propertiesSchemas.set(key, compiled)

      return compiled
    },
    compileAll() {
      const startedAt = performance.now()
      const formStartedAt = performance.now()
      for (const rule of validationProjectFormRules()) {
        this.form(rule)
      }
      const formMs = performance.now() - formStartedAt

      const propertiesStartedAt = performance.now()
      for (const rule of validationProjectPropertyRules()) {
        this.properties(rule)
      }
      const propertiesMs = performance.now() - propertiesStartedAt

      return {
        formMs,
        propertiesMs,
        totalMs: performance.now() - startedAt,
      }
    },
  }
}

function compileProjectPropertiesSchema(
  context: ConfigurationContext,
  rule: MetadataItemRule,
  variant: ValidationSchemaVariant,
): CompiledSchema {
  const graph = exportJSONSchemaGraph({
    context,
    excludeImplicitValueYAML: true,
    validationPropertyRefs: true,
    roots: [{ key: "properties", name: rule.itemType }],
    requiredPolicy: requiredPolicy(variant),
  })
  const rootSchema = stripCollectedSchemaRefs(graph.roots["properties"]!)
  return compileValidationSchema(graph.schemas, rootSchema)
}

function validationProjectPropertyRules(): MetadataItemRule[] {
  return uniqueRulesByItemType([
    configurationValidationProjectSpec.rule,
    getMetadataComponentDescriptor("configurationExtension").rootRule,
    ...validationProjectSpecs.map((spec) => spec.rule),
  ])
}

function validationProjectFormRules(): MetadataItemRule[] {
  return registeredProjectValidationFormRules().map(({ rule }) => rule)
}

function uniqueRulesByItemType(rules: readonly MetadataItemRule[]): MetadataItemRule[] {
  return [...new Map(rules.map((rule) => [rule.itemType, rule])).values()]
}

function compileRegisteredFormSchema(
  context: ConfigurationContext,
  rule: MetadataItemRule,
  variant: ValidationSchemaVariant,
): CompiledSchema {
  const cacheKey = `${context.version}:${context.defaultLanguage}:${variant}`
  let schemasByContext = formSchemaCache.get(rule)
  const cached = schemasByContext?.get(cacheKey)
  if (cached !== undefined) return cached

  const graph = exportJSONSchemaGraph({
    context,
    validationPropertyRefs: true,
    roots: [{ key: "form", rule, includeNestedChildItems: true }],
    requiredPolicy: requiredPolicy(variant),
  })
  const compiled = compileValidationSchema(graph.schemas, graph.roots["form"]!)
  schemasByContext ??= new Map()
  schemasByContext.set(cacheKey, compiled)
  formSchemaCache.set(rule, schemasByContext)
  return compiled
}

function requiredPolicy(variant: ValidationSchemaVariant) {
  return variant === "extension-overlay"
    ? { currentBoundary: "defer" as const, cacheVariant: variant }
    : undefined
}

function validationSchemaVariant(file: ValidationProjectFile): ValidationSchemaVariant {
  return file.componentPath.startsWith("cfe/") && file.metadataTarget !== undefined
    ? "extension-overlay"
    : "full"
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

export function extractProjectValidationFileFacts(params: {
  projectDir: string
  file: ValidationProjectFile
  entry: ProjectYamlEntry
  rulesSnapshot: ValidationRulesSnapshot
  validationDiagnostics?: boolean
}): ProjectValidationFileFacts {
  const parsed = parsedForProjectFile(params.file, params.entry.parsed)
  const measuredYamlFacts = measureValidationPhase(() =>
    extractValidationYamlFacts({
      file: params.file,
      parsed,
      rulesSnapshot: params.rulesSnapshot,
      ...(params.validationDiagnostics === undefined
        ? {}
        : { validationDiagnostics: params.validationDiagnostics }),
    })
  )
  const yamlFacts = measuredYamlFacts.value
  const pendingChecks = [
    ...yamlFacts.pendingChecks,
    ...(isExtensionOverlayFile(params.file)
      ? collectAddressableRequiredChecks({
          filePath: params.file.absolutePath,
          parsed,
          yaml: parsed.data,
          rule: params.file.itemRule,
          canonicalTarget: params.file.metadataTarget.canonical,
        })
      : []),
  ]

  if (params.file.kind === "form") {
    return {
      objectRecords: [],
      objectIndexEntries: yamlFacts.objectIndexEntries,
      memberIndexEntries: [],
      valueIndexEntries: yamlFacts.valueIndexEntries,
      pendingReferences: yamlFacts.pendingReferences,
      pendingChecks,
      diagnostics: yamlFacts.diagnostics,
      localDependencies: [],
      ...(yamlFacts.formDataPathIndex === undefined
        ? {}
        : {
            form: {
              owner: { kind: params.file.owner.dir, name: params.file.owner.name },
              index: yamlFacts.formDataPathIndex,
            },
          }),
      ...(yamlFacts.structuredComponents === undefined
        ? {}
        : { structuredComponents: yamlFacts.structuredComponents }),
      profile: {
        yamlFactsMs: measuredYamlFacts.timeMs,
        localValueValidationProfile: yamlFacts.localValueValidationProfile,
        fieldIndexMs: 0,
        memberIndexMs: 0,
        propertyEvents: yamlFacts.localIndexes?.metadata.events.filter(({ kind }) => kind === "property").length ?? 0,
      },
    }
  }

  const ownerRef = { kind: params.file.owner.dir, name: params.file.owner.name }
  const measuredOwner = measureValidationPhase(() => {
    const compactOwnerFacts = yamlFacts.localIndexes?.metadata.ownerFacts ?? {}
    const ownerFactsWithoutIndex = {
      ref: ownerRef,
      filePath: params.file.absolutePath,
      fieldIndex: emptyObjectFieldIndex(),
      ...compactOwnerFacts,
    } as ValidationOwnerFacts
    const ownerWithoutIndex = {
      ref: ownerRef,
      filePath: params.file.absolutePath,
      facts: ownerFactsWithoutIndex,
      rule: params.file.itemRule,
      spec: params.file.owner.spec,
    }
    const fieldIndex = buildObjectFieldIndex(ownerWithoutIndex)
    const ownerFacts: ValidationOwnerFacts = { ...ownerFactsWithoutIndex, fieldIndex }
    const owner: OwnerMetadata = { ...ownerWithoutIndex, facts: ownerFacts, fieldIndex }
    return { fieldIndex, ownerFacts, owner }
  })
  const measuredMemberIndex = measureValidationPhase(() =>
    buildMemberIndexEntries({
      projectDir: params.projectDir,
      owner: measuredOwner.value.owner,
      objectTarget: yamlFacts.objectIndexEntries[0]?.target,
      rawYaml: parsed.data,
    })
  )
  const memberIndexEntries = measuredMemberIndex.value

  return {
    objectIndexEntries: yamlFacts.objectIndexEntries,
    memberIndexEntries,
    valueIndexEntries: yamlFacts.valueIndexEntries,
    pendingReferences: yamlFacts.pendingReferences,
    pendingChecks,
    diagnostics: [...yamlFacts.diagnostics, ...measuredOwner.value.fieldIndex.diagnostics],
    localDependencies: projectLocalDependenciesFromFacts(
      params.file.projectPath,
      yamlFacts.localIndexes?.metadata.metadataTargets ?? []
    ),
    objectRecords: [
      {
        filePath: params.file.absolutePath,
        projectPath: params.file.projectPath,
        kind: params.file.kind,
        owner: { dir: params.file.owner.dir, name: params.file.owner.name },
        ownerRef,
        ownerFacts: measuredOwner.value.ownerFacts,
        fieldIndex: measuredOwner.value.fieldIndex,
        objectIndexEntries: yamlFacts.objectIndexEntries,
        memberIndexEntries,
        valueIndexEntries: yamlFacts.valueIndexEntries,
        pendingReferences: yamlFacts.pendingReferences,
        importDiagnostics: [],
      },
    ],
    profile: {
      yamlFactsMs: measuredYamlFacts.timeMs,
      localValueValidationProfile: yamlFacts.localValueValidationProfile,
      fieldIndexMs: measuredOwner.timeMs,
      memberIndexMs: measuredMemberIndex.timeMs,
      propertyEvents: yamlFacts.localIndexes?.metadata.events.filter(({ kind }) => kind === "property").length ?? 0,
    },
  }
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
    schema: params.schemaCache.form(requireFormRule(params.file), validationSchemaVariant(params.file)),
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
    return failedFirstPass(
      params.file,
      schemaDiagnostics,
      {
        ...emptyFirstPassProfile("form"),
        totalMs: performance.now() - totalStartedAt,
        schemaMs,
        diagnostics: schemaDiagnostics.length,
      },
      []
    )
  }

  const facts = extractProjectValidationFileFacts({
    projectDir: params.projectDir,
    file: params.file,
    entry,
    rulesSnapshot: requireRulesSnapshot(params.rulesSnapshot),
  })
  const diagnostics = [...schemaDiagnostics, ...facts.diagnostics]

  return {
    state: {
      kind: "form",
      file: params.file,
      pendingChecks: facts.pendingChecks,
      firstPassDiagnostics: diagnostics,
    },
    schemaDiagnostics,
    contributedFacts: true,
    diagnostics,
    objectRecords: facts.objectRecords,
    objectIndexEntries: facts.objectIndexEntries,
    memberIndexEntries: facts.memberIndexEntries,
    valueIndexEntries: facts.valueIndexEntries,
    pendingReferences: facts.pendingReferences,
    dependencies: [
      ...new Set([
        ...facts.localDependencies.map(({ canonical }) => canonical),
        ...facts.pendingReferences.map(({ canonical }) => canonical),
      ]),
    ],
    ...(facts.form === undefined ? {} : { form: facts.form }),
    ...(facts.structuredComponents === undefined
      ? {}
      : { structuredComponents: facts.structuredComponents }),
    profile: {
      ...emptyFirstPassProfile("form"),
      totalMs: performance.now() - totalStartedAt,
      schemaMs,
      memberIndexMs: facts.profile.memberIndexMs,
      yamlFactsMs: facts.profile.yamlFactsMs,
      localValueValidationProfile: facts.profile.localValueValidationProfile,
      diagnostics: diagnostics.length,
      propertyEvents: facts.profile.propertyEvents,
    },
  }
}

function requireFormRule(file: ValidationProjectFile): MetadataItemRule {
  if (file.kind !== "form" || file.itemRule === undefined) {
    throw new Error(
      `Для проверки формы не передано правило: ${file.projectPath}`
    )
  }
  return file.itemRule
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
      schema: params.schemaCache.properties(params.file.itemRule, validationSchemaVariant(params.file)),
    })
    const schemaMs = performance.now() - schemaStartedAt
    return failedFirstPass(
      params.file,
      diagnostics,
      {
        ...emptyFirstPassProfile(validationFirstPassProfileKey(params.file)),
        totalMs: performance.now() - totalStartedAt,
        cacheMs,
        schemaMs,
        diagnostics: diagnostics.length,
      },
      []
    )
  }

  const parsed = parsedForProjectFile(params.file, entry.parsed)
  const schemaStartedAt = performance.now()
  const baseSchemaDiagnostics = validateProjectFileSchema({
    file: params.file,
    cache: params.cache,
    schema: params.schemaCache.properties(params.file.itemRule, validationSchemaVariant(params.file)),
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
    return failedFirstPass(
      params.file,
      diagnostics,
      {
        ...emptyFirstPassProfile(validationFirstPassProfileKey(params.file)),
        totalMs: performance.now() - totalStartedAt,
        cacheMs,
        schemaMs,
        validatorsMs,
        diagnostics: diagnostics.length,
      },
      schemaDiagnostics
    )
  }

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
  const facts = extractProjectValidationFileFacts({
    projectDir: params.projectDir,
    file: params.file,
    entry: { ...entry, parsed },
    rulesSnapshot: requireRulesSnapshot(params.rulesSnapshot),
  })
  const publishedSchemaDiagnostics = suppressEqualNameSchemaDiagnostics(schemaDiagnostics, equalNameDiagnostics)
  const diagnostics = [
    ...publishedSchemaDiagnostics,
    ...equalNameDiagnostics,
    ...facts.diagnostics,
  ]

  return {
    state: {
      kind: "properties",
      file: params.file,
      pendingReferences: facts.pendingReferences,
      pendingChecks: facts.pendingChecks,
      firstPassDiagnostics: diagnostics,
    },
    schemaDiagnostics: publishedSchemaDiagnostics,
    contributedFacts: true,
    diagnostics,
    objectIndexEntries: facts.objectIndexEntries,
    memberIndexEntries: facts.memberIndexEntries,
    valueIndexEntries: facts.valueIndexEntries,
    pendingReferences: facts.pendingReferences,
    dependencies: facts.localDependencies.map(({ canonical }) => canonical),
    objectRecords: facts.objectRecords,
    profile: {
      key: validationFirstPassProfileKey(params.file),
      totalMs: performance.now() - totalStartedAt,
      cacheMs,
      schemaMs,
      validatorsMs,
      equalNameMs,
      localValueValidationProfile: facts.profile.localValueValidationProfile,
      yamlFactsMs: facts.profile.yamlFactsMs,
      fieldIndexMs: facts.profile.fieldIndexMs,
      objectIndexMs: 0,
      memberIndexMs: facts.profile.memberIndexMs,
      valueIndexMs: 0,
      diagnostics: diagnostics.length,
      propertyEvents: facts.profile.propertyEvents,
    },
  }
}

function isExtensionOverlayFile(file: ValidationProjectFile): file is ValidationProjectFile & {
  metadataTarget: NonNullable<ValidationProjectFile["metadataTarget"]>
} {
  return file.componentPath.startsWith("cfe/") && file.metadataTarget !== undefined
}

function failedFirstPass(
  file: ValidationProjectFile,
  diagnostics: Diagnostic[],
  profile?: ProjectValidationFirstPassProfile,
  schemaDiagnostics: Diagnostic[] = diagnostics
): ProjectValidationFirstPassResult {
  return {
    state: { kind: "failed", file, diagnostics },
    schemaDiagnostics,
    contributedFacts: false,
    diagnostics,
    objectRecords: [],
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
    dependencies: [],
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
    localValueValidationProfile: {},
    yamlFactsMs: 0,
    fieldIndexMs: 0,
    objectIndexMs: 0,
    memberIndexMs: 0,
    valueIndexMs: 0,
    diagnostics: 0,
    propertyEvents: 0,
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

function buildMemberIndexEntries(params: {
  projectDir: string
  owner: OwnerMetadata
  objectTarget?: Extract<ParsedMetadataTarget, { kind: "object" }>
  rawYaml: unknown
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

  if (params.objectTarget === undefined) return entries
  for (const contributor of getProjectReferenceMemberIndexContributors()) {
    for (const entry of contributor({
      projectDir: params.projectDir,
      owner: params.owner,
      objectTarget: params.objectTarget,
      rawYaml: params.rawYaml,
    })) addMemberIndexEntry(entries, seen, entry)
  }

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
