import { compileValidationSchema, type ValidationSchemaValidator } from "./compileValidationSchema"
import fs from "fs"
import { performance } from "node:perf_hooks"
import { resolve } from "path"
import { createRuleSchemaRuntime, currentRuleRegistrySet, rootFromYAML } from "@nkdk/runtime/rule-kit"
import type { RuleSchemaRuntime } from "@nkdk/runtime/rule-kit"
import type { MetadataFieldKind, ParsedMetadataTarget } from "@nkdk/runtime/rule-kit"
import type { ConfigurationContext } from "@nkdk/runtime"
import { getMetadataComponentDescriptor } from "../components/descriptor"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { decodeValidationSchemaKey, stripCollectedSchemaRefs } from "../ruleRuntime/jsonSchemaRefs"
import { evaluateParsedXmlAnomalyBoundaries, parseMetadataYaml, type ParsedYaml } from "@nkdk/runtime"
import { type OwnerMetadata, type OwnerMetadataCache } from "./dataPath/ownerCache"
import type { ValidationOwnerFacts } from "./dataPath/ownerFacts"
import { buildObjectFieldIndex, type ObjectField, type ObjectFieldIndex, type ObjectFieldKind } from "./dataPath/objectFields"
import { validateExcludedEqualNameYAML } from "./excludeIfEqualNameYAML"
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
import { getConfigurationValidationProjectSpec, getValidationProjectSpecs } from "./projectSpecs"
import type { ValidationFormIndexContribution, ValidationObjectRecord } from "./projectValidationTypes"
import type { ValidationRulesSnapshot } from "./rulesSnapshot"
import type { Diagnostic } from "./types"
import {
  validationIssuePathFromPointer,
  validationIssueTargetKey,
  type ValidationIssue,
  type ValidationIssueTarget,
} from "@nkdk/runtime"
import type { TSchema } from "typebox"
import { projectLocalDependenciesFromFacts } from "./projectLocalDependencies"
import { validateParsedFileWithIssues } from "./validateFile"
import {
  extractValidationYamlFacts,
  type LocalValueValidationProfile,
} from "./yamlFactExtractor"
import { registeredProjectValidationFormRules } from "./projectValidationFormRules"
import type { FormStructuredComponent } from "./formContracts"
import { collectAddressableRequiredChecks } from "./addressableRequired"
import { collectAddressableMetadataLogicalAddresses } from "./addressableMetadataTargets"
import { objectTargetForProjectFile } from "./addressableMetadataTargets"
import type { ValidationRegistrySet } from "./validationRegistrySet"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { currentOperationRegistrySet } from "../operations/operationExecutionContext"
import type { PropertyStateCapabilityRegistry } from "../ruleRuntime/definition"
import {
  exportBorrowedPropertyStateSchema,
  exportNestedPropertyStateSchema,
} from "../ruleRuntime/property/propertyStateSchema"
import type { DataTableIndex } from "./dataTables"

type CompiledSchema = ValidationSchemaValidator
type ValidationSchemaVariant = "full" | "extension-root" | "extension-overlay" | "extension-form-overlay"
const formSchemaCache = new WeakMap<
  MetadataItemRule,
  Map<string, CompiledSchema>
>()
const propertiesSchemaCache = new Map<string, CompiledSchema>()

export interface ValidationSchemaCache {
  form: (rule: MetadataItemRule, variant?: ValidationSchemaVariant, compatibilityMode?: string) => CompiledSchema
  properties: (rule: MetadataItemRule, variant?: ValidationSchemaVariant, compatibilityMode?: string) => CompiledSchema
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
      pendingReferences: PendingMetadataTargetReference[]
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
  validationContextDependencies?: readonly import("../projectState/contracts/fileUpdate").ProjectStateValidationContextDependency[]
  logicalAddresses?: import("../projectDefinition/componentIndexFacts").ProjectLogicalAddressEntry[]
  form?: ValidationFormIndexContribution
  structuredComponents?: readonly FormStructuredComponent[]
  structuredDocuments?: readonly import("../projectState/contracts/fileUpdate").ProjectStateStructuredDocumentEntry[]
  diagnostics: Diagnostic[]
  issues: ValidationIssue[]
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
  localizedTextProperties: number
  localDependencies: import("../projectDefinition/componentIndexFacts").ProjectLocalDependency[]
  logicalAddresses?: import("../projectDefinition/componentIndexFacts").ProjectLogicalAddressEntry[]
  form?: ValidationFormIndexContribution
  structuredComponents?: readonly FormStructuredComponent[]
  structuredDocuments?: readonly import("../projectState/contracts/fileUpdate").ProjectStateStructuredDocumentEntry[]
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
  dataTableIndex?: DataTableIndex
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
  const contextualRules = currentRuleRegistrySet<RuleRegistrySet>()
  const schemaRuntime = contextualRules === undefined
    ? undefined
    : createRuleSchemaRuntime(contextualRules, (name) => new Error(`Неизвестная JSON Schema: ${name}`))
  const formSchemas = new WeakMap<MetadataItemRule, Record<string, CompiledSchema>>()

  return {
    form(rule, variant = "full", compatibilityMode) {
      const cacheVariant = `${variant}:${compatibilityMode ?? ""}`
      const existing = formSchemas.get(rule)?.[cacheVariant]
      if (existing !== undefined) return existing
      const compiled = compileRegisteredFormSchema(context, rule, variant, schemaRuntime, compatibilityMode)
      formSchemas.set(rule, { ...formSchemas.get(rule), [cacheVariant]: compiled })
      return compiled
    },
    properties(rule, variant = "full", compatibilityMode) {

      const capability = variant === "full"
        ? undefined
        : currentOperationRegistrySet<{ readonly propertyStates: PropertyStateCapabilityRegistry }>()
          ?.propertyStates.item(rule.itemType, compatibilityMode)
      const globalKey = [
        context.version,
        context.languages.default,
        variant,
        compatibilityMode ?? "",
        rule.itemType,
        ...(capability === undefined
          ? []
          : Object.entries(capability.properties).sort(([left], [right]) => left.localeCompare(right))
            .map(([propertyKey, property]) => [
              propertyKey,
              property.availability,
              property.representation,
              property.externalName,
              ...property.modes,
            ].join("|"))),
      ].join(":")
      const compiled = variant === "extension-overlay"
        ? compileProjectPropertiesSchema(context, rule, variant, schemaRuntime, compatibilityMode)
        : propertiesSchemaCache.get(globalKey)
          ?? compileProjectPropertiesSchema(context, rule, variant, schemaRuntime, compatibilityMode)
      if (variant !== "extension-overlay") propertiesSchemaCache.set(globalKey, compiled)
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
  runtime?: RuleSchemaRuntime,
  compatibilityMode?: string,
): CompiledSchema {
  return compileRuleValidationSchema({
    context,
    rule,
    variant,
    runtime,
    rootKey: "properties",
    excludeImplicitValueYAML: variant === "full",
    stripRootRefs: true,
    compatibilityMode,
  })
}

function validationProjectPropertyRules(): MetadataItemRule[] {
  const rules = currentRuleRegistrySet<RuleRegistrySet>()
  if (rules !== undefined) {
    return uniqueRulesByItemType([
      ...rules.projectSpecs.values().map(({ rule }) => rule),
      ...rules.components.values().map(({ rootRule }) => rootRule),
    ])
  }
  return uniqueRulesByItemType([
    ...[getConfigurationValidationProjectSpec()?.rule].filter((rule): rule is MetadataItemRule => rule !== undefined),
    getMetadataComponentDescriptor("configurationExtension").rootRule,
    ...getValidationProjectSpecs().map((spec) => spec.rule),
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
  runtime?: RuleSchemaRuntime,
  compatibilityMode?: string,
): CompiledSchema {
  const cacheKey = `${context.version}:${context.languages.default}:${variant}:${compatibilityMode ?? ""}`
  let schemasByContext = formSchemaCache.get(rule)
  const cached = schemasByContext?.get(cacheKey)
  if (cached !== undefined) return cached

  const compiled = compileRuleValidationSchema({
    context,
    rule,
    variant,
    runtime,
    rootKey: "form",
    includeNestedChildItems: true,
    compatibilityMode,
  })
  schemasByContext ??= new Map()
  schemasByContext.set(cacheKey, compiled)
  formSchemaCache.set(rule, schemasByContext)
  return compiled
}

function compileRuleValidationSchema(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  variant: ValidationSchemaVariant
  runtime?: RuleSchemaRuntime
  rootKey: string
  includeNestedChildItems?: boolean
  excludeImplicitValueYAML?: boolean
  stripRootRefs?: boolean
  compatibilityMode?: string
}): CompiledSchema {
  const common = {
    context: params.context,
    excludeImplicitValueYAML: params.excludeImplicitValueYAML,
    validationPropertyRefs: true as const,
    roots: [{
      key: params.rootKey,
      rule: params.rule,
      includeNestedChildItems: params.includeNestedChildItems,
    }],
    requiredPolicy: requiredPolicy(params.variant),
  }
  const graph = params.runtime === undefined
    ? exportJSONSchemaGraph(common)
    : params.runtime.exportGraph({ ...common, explicitXMLValues: true })
  const sourceRoot = graph.roots[params.rootKey]!
  const capability = params.variant !== "full"
    ? currentOperationRegistrySet<{ readonly propertyStates: PropertyStateCapabilityRegistry }>()
      ?.propertyStates.item(params.rule.itemType, params.compatibilityMode)
    : undefined
  const root = capability === undefined
    ? sourceRoot
    : exportBorrowedPropertyStateSchema({
        rule: params.rule,
        capability,
        source: sourceRoot,
        structuralPropertyKeys: structuralPropertyKeys(params.rule),
        closed: params.variant !== "extension-root" && params.variant !== "extension-form-overlay",
        includeExtendedConfigurationObject: params.variant === "extension-root",
      })
  const schemas = params.variant === "extension-overlay" || params.variant === "extension-form-overlay"
    ? propertyStateNestedSchemas(graph.schemas, params.compatibilityMode)
    : graph.schemas
  return compileValidationSchema(
    schemas,
    params.stripRootRefs === true ? stripCollectedSchemaRefs(root) : root,
  )
}

function propertyStateNestedSchemas(
  schemas: Readonly<Record<string, TSchema>>,
  compatibilityMode?: string,
): Record<string, TSchema> {
  const rules = currentRuleRegistrySet<RuleRegistrySet>()
  const propertyStates = currentOperationRegistrySet<{
    readonly propertyStates: PropertyStateCapabilityRegistry
  }>()?.propertyStates
  if (rules === undefined || propertyStates === undefined) return { ...schemas }
  const schemaNames = [...rules.schemas.names()].sort((left, right) => right.length - left.length)
  const entries = Object.entries(schemas).map(([ref, schema]) => {
    const decoded = decodeValidationSchemaKey(ref.replace(/^nkdk:\/\/schema\/validation\/[^/]+\/[^/]+\//u, ""))
    const name = schemaNames.find((candidate) => decoded === candidate || decoded.endsWith(`/${candidate}`))
    const source = name === undefined ? undefined : rules.schemas.get(name)?.source
    if (!isMetadataItemRule(source)) return [ref, schema]
    const capability = propertyStates.item(name ?? source.itemType, compatibilityMode)
      ?? propertyStates.item(source.itemType, compatibilityMode)
    const transformed = capability === undefined ? undefined : exportNestedPropertyStateSchema({
      rule: source,
      capability,
      source: structuredClone(schema),
      structuralPropertyKeys: structuralPropertyKeys(source),
    })
    return capability === undefined
      ? [ref, schema]
      : [ref, transformed!]
  })
  const result = Object.fromEntries(entries)
  return result
}

function isMetadataItemRule(value: unknown): value is MetadataItemRule {
  return typeof value === "object" && value !== null
    && typeof (value as Partial<MetadataItemRule>).itemType === "string"
    && typeof (value as Partial<MetadataItemRule>).properties === "object"
}

function structuralPropertyKeys(rule: MetadataItemRule): string[] {
  const execution = currentRuleRegistrySet<RuleRegistrySet>()?.execution
  if (execution === undefined) return []
  return Object.entries(rule.properties).flatMap(([propertyKey, property]) =>
    execution.resolvePropertyItemRule(property) !== undefined ||
    (property.xmlParents ?? []).includes("ChildObjects")
      ? [propertyKey]
      : [])
}

function requiredPolicy(variant: ValidationSchemaVariant) {
  return variant === "extension-overlay" || variant === "extension-form-overlay"
    ? { currentBoundary: "defer" as const, cacheVariant: "extension-overlay" as const }
    : undefined
}

function validationSchemaVariant(file: ValidationProjectFile): ValidationSchemaVariant {
  if (file.kind === "form") return isBorrowedExtensionFile(file) ? "extension-form-overlay" : "full"
  if (file.componentPath.startsWith("cfe/") && file.kind === "configuration") {
    return "extension-root"
  }
  return isBorrowedExtensionFile(file)
    ? "extension-overlay"
    : "full"
}

function isBorrowedExtensionFile(file: ValidationProjectFile): boolean {
  if (!file.componentPath.startsWith("cfe/") || file.metadataTarget === undefined) return false
  const projectRoot = resolve(file.componentDir, "..", "..")
  return fs.existsSync(resolve(projectRoot, "cf", ...file.projectPath.split("/")))
}

export function collectBorrowedExtensionLogicalAddresses(
  file: ValidationProjectFile,
  readEntry: (filePath: string) => ProjectValidationYamlReadResult,
): ReadonlySet<string> | undefined {
  if (!file.componentPath.startsWith("cfe/")) return undefined
  const objectTarget = file.kind === "properties" ? objectTargetForProjectFile(file) : undefined
  const logicalAddress = file.logicalAddress
    ?? (objectTarget === undefined ? undefined : projectObjectIndexKey(objectTarget))
  if (logicalAddress === undefined) return undefined
  const projectRoot = resolve(file.componentDir, "..", "..")
  const entry = readEntry(resolve(projectRoot, "cf", ...file.projectPath.split("/")))
  if ("error" in entry) return new Set()
  return new Set([
    logicalAddress,
    ...collectAddressableMetadataLogicalAddresses({
      yaml: entry.parsed.data,
      rule: file.itemRule,
      logicalAddress,
      filePath: file.projectPath,
    }).map(({ logicalAddress }) => logicalAddress),
  ])
}

function extensionCompatibilityMode(
  file: ValidationProjectFile,
  cache: ProjectYamlCache,
): string | undefined {
  if (!file.componentPath.startsWith("cfe/")) return undefined
  const entry = cache.get(resolve(file.componentDir, "Конфигурация.yaml"))
  if ("error" in entry) return undefined
  const root = typeof entry.parsed.data === "object" && entry.parsed.data !== null
    ? entry.parsed.data as Record<string, unknown>
    : {}
  const value = root["РежимСовместимостиРасширенияКонфигурации"]
  return typeof value === "string" ? value : undefined
}

function formSchemaForFile(
  cache: ValidationSchemaCache,
  file: ValidationProjectFile,
  compatibilityMode: string | undefined,
): CompiledSchema {
  const rule = requireFormRule(file)
  const variant = validationSchemaVariant(file)
  return compatibilityMode === undefined
    ? cache.form(rule, variant)
    : cache.form(rule, variant, compatibilityMode)
}

function propertiesSchemaForFile(
  cache: ValidationSchemaCache,
  file: ValidationProjectFile,
  compatibilityMode: string | undefined,
): CompiledSchema {
  const variant = validationSchemaVariant(file)
  return compatibilityMode === undefined
    ? cache.properties(file.itemRule, variant)
    : cache.properties(file.itemRule, variant, compatibilityMode)
}

export function validateProjectFileFirstPass(params: {
  projectDir: string
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  schemaCache: ValidationSchemaCache
  rulesSnapshot?: ValidationRulesSnapshot
  runtime?: ValidationRegistrySet
  propertyStateCompatibilityMode?: string
  borrowedLogicalAddresses?: ReadonlySet<string>
}): ProjectValidationFirstPassResult {
  if (params.file.kind === "form") return validateProjectFormFirstPass(params)
  return validateProjectPropertiesFirstPass(params)
}

export function extractProjectValidationFileFacts(params: {
  projectDir: string
  file: ValidationProjectFile
  entry: ProjectYamlEntry
  borrowedLogicalAddresses?: ReadonlySet<string>
  rulesSnapshot: ValidationRulesSnapshot
  validationDiagnostics?: boolean
  runtime?: ValidationRegistrySet
  propertyStateCompatibilityMode?: string
  context?: ConfigurationContext
}): ProjectValidationFileFacts {
  const parsed = parsedForProjectFile(params.file, params.entry.parsed)
  const measuredYamlFacts = measureValidationPhase(() =>
    extractValidationYamlFacts({
      file: params.file,
      parsed,
      rulesSnapshot: params.rulesSnapshot,
      runtime: params.runtime,
      propertyStateCompatibilityMode: params.propertyStateCompatibilityMode,
      borrowedLogicalAddresses: params.borrowedLogicalAddresses,
      context: params.context,
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
      localizedTextProperties: yamlFacts.localizedTextProperties,
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
      ...(yamlFacts.structuredDocuments === undefined
        ? {}
        : { structuredDocuments: yamlFacts.structuredDocuments }),
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
    const fieldIndex = params.runtime?.buildObjectFieldIndex(ownerWithoutIndex)
      ?? buildObjectFieldIndex(ownerWithoutIndex)
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
  const canonicalTarget = yamlFacts.objectIndexEntries[0]?.canonical

  return {
    objectIndexEntries: yamlFacts.objectIndexEntries,
    memberIndexEntries,
    valueIndexEntries: yamlFacts.valueIndexEntries,
    pendingReferences: yamlFacts.pendingReferences,
    pendingChecks,
    diagnostics: [...yamlFacts.diagnostics, ...measuredOwner.value.fieldIndex.diagnostics],
    localizedTextProperties: yamlFacts.localizedTextProperties,
    localDependencies: projectLocalDependenciesFromFacts(
      params.file.projectPath,
      yamlFacts.localIndexes?.metadata.metadataTargets ?? []
    ),
    ...(canonicalTarget === undefined || params.file.logicalAddress === undefined
      ? {}
      : {
          logicalAddresses: [
            { logicalAddress: params.file.logicalAddress, sourceProjectPath: params.file.projectPath },
            ...collectAddressableMetadataLogicalAddresses({
              yaml: parsed.data,
              rule: params.file.itemRule,
              logicalAddress: params.file.logicalAddress,
              filePath: params.file.projectPath,
            }),
          ],
        }),
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
    ...(yamlFacts.structuredDocuments === undefined
      ? {}
      : { structuredDocuments: yamlFacts.structuredDocuments }),
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
    const referenceDiagnostics = params.skipMetadataTargetValidation
      ? []
      : validateSecondPassReferences(params, params.state.pendingReferences)
    return {
      status: "ok",
      diagnostics: [
        ...referenceDiagnostics,
        ...validatePendingChecks({
          ownerCache: params.ownerCache,
          checks: params.state.pendingChecks,
          resolveReference: pendingReferenceResolver(params),
        }).diagnostics,
      ],
    }
  }

  const collected = params.skipMetadataTargetValidation
    ? { references: [], diagnostics: [] }
    : { references: params.state.pendingReferences, diagnostics: [] }
  const diagnostics = [
    ...collected.diagnostics,
    ...validateSecondPassReferences(params, collected.references),
    ...validatePendingChecks({
      ownerCache: params.ownerCache,
      checks: params.state.pendingChecks,
      resolveReference: pendingReferenceResolver(params),
    }).diagnostics,
  ]
  return { status: "ok", diagnostics }
}

function pendingReferenceResolver(
  params: ProjectValidationSecondPassParams,
): (canonical: string) => "found" | "missing" | "ambiguous" {
  const references = new Map(params.state.kind === "failed"
    ? []
    : params.state.pendingReferences.map((reference) => [reference.canonical, reference]))
  return (canonical) => {
    const reference = references.get(canonical)
    if (reference === undefined) return "missing"
    const result = params.referenceIndex.resolve(reference)
    if (result.ok) return "found"
    return result.reason === "conflict" ? "ambiguous" : "missing"
  }
}

function validateSecondPassReferences(
  params: ProjectValidationSecondPassParams,
  references: readonly PendingMetadataTargetReference[],
): Diagnostic[] {
  const dataTables = references.filter(({ target }) => target.kind === "dataTable" || target.kind === "dataTableField")
  const ordinary = references.filter(({ target }) => target.kind !== "dataTable" && target.kind !== "dataTableField")
  const diagnostics = validatePendingReferencesWithIndex({
    index: params.referenceIndex,
    references: ordinary,
  }).diagnostics
  for (const reference of dataTables) {
    const resolved = params.dataTableIndex?.resolve(reference) ?? params.referenceIndex.resolve(reference)
    if (!resolved.ok) diagnostics.push(...resolved.diagnostics)
  }
  return diagnostics
}

interface ProjectValidationFirstPassInternalParams {
  projectDir: string
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  schemaCache: ValidationSchemaCache
  rulesSnapshot?: ValidationRulesSnapshot
  runtime?: ValidationRegistrySet
  propertyStateCompatibilityMode?: string
  borrowedLogicalAddresses?: ReadonlySet<string>
}

function extractFirstPassFacts(
  params: ProjectValidationFirstPassInternalParams,
  entry: ProjectYamlEntry,
  propertyStateCompatibilityMode: string | undefined,
) {
  return extractProjectValidationFileFacts({
    projectDir: params.projectDir,
    file: params.file,
    entry,
    borrowedLogicalAddresses: params.borrowedLogicalAddresses ?? collectBorrowedExtensionLogicalAddresses(
      params.file, (filePath) => params.cache.get(filePath)),
    rulesSnapshot: requireRulesSnapshot(params.rulesSnapshot),
    context: params.context,
    runtime: params.runtime,
    propertyStateCompatibilityMode,
  })
}

function validateProjectFormFirstPass(
  params: ProjectValidationFirstPassInternalParams
): ProjectValidationFirstPassResult {
  const totalStartedAt = performance.now()
  const schemaStartedAt = performance.now()
  const compatibilityMode = params.propertyStateCompatibilityMode
    ?? extensionCompatibilityMode(params.file, params.cache)
  const schemaValidation = validateProjectFileSchema({
    file: params.file,
    cache: params.cache,
    schema: formSchemaForFile(params.schemaCache, params.file, compatibilityMode),
  })
  const schemaDiagnostics = schemaValidation.diagnostics
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

  const facts = extractFirstPassFacts(params, entry, compatibilityMode)
  const parsed = parsedForProjectFile(params.file, entry.parsed)
  const evaluated = evaluateProjectXmlAnomalyBoundaries({
    filePath: entry.filePath,
    parsed,
    diagnostics: [...schemaDiagnostics, ...facts.diagnostics],
    issues: [
      ...schemaValidation.issues,
      ...facts.diagnostics.map(validationIssueFromDiagnostic),
    ],
    facts,
  })
  const diagnostics = evaluated.diagnostics
  const { pendingReferences, pendingChecks } = applyXmlAnomalyStatesToFacts(facts, evaluated.boundaries)

  return {
    state: {
      kind: "form",
      file: params.file,
      pendingReferences,
      pendingChecks,
      firstPassDiagnostics: diagnostics,
    },
    schemaDiagnostics,
    contributedFacts: true,
    diagnostics,
    issues: evaluated.issues,
    objectRecords: facts.objectRecords,
    objectIndexEntries: facts.objectIndexEntries,
    memberIndexEntries: facts.memberIndexEntries,
    valueIndexEntries: facts.valueIndexEntries,
    pendingReferences,
    dependencies: [
      ...new Set([
        ...facts.localDependencies.map(({ canonical }) => canonical),
        ...facts.pendingReferences.map(({ canonical }) => canonical),
      ]),
    ],
    ...languageValidationDependency(facts.localizedTextProperties, params.context),
    ...(facts.logicalAddresses === undefined ? {} : { logicalAddresses: facts.logicalAddresses }),
    ...(facts.form === undefined ? {} : { form: facts.form }),
    ...(facts.structuredComponents === undefined
      ? {}
      : { structuredComponents: facts.structuredComponents }),
    ...(facts.structuredDocuments === undefined
      ? {}
      : { structuredDocuments: facts.structuredDocuments }),
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

function validateProjectPropertiesFirstPass(
  params: ProjectValidationFirstPassInternalParams
): ProjectValidationFirstPassResult {
  const totalStartedAt = performance.now()
  const cacheStartedAt = performance.now()
  const entry = params.cache.get(params.file.absolutePath)
  const compatibilityMode = params.propertyStateCompatibilityMode
    ?? extensionCompatibilityMode(params.file, params.cache)
  const cacheMs = performance.now() - cacheStartedAt
  if ("error" in entry) {
    const schemaStartedAt = performance.now()
    const diagnostics = validateProjectFileSchema({
      file: params.file,
      cache: params.cache,
      schema: propertiesSchemaForFile(params.schemaCache, params.file, compatibilityMode),
    }).diagnostics
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
  const schemaValidation = validateProjectFileSchema({
    file: params.file,
    cache: params.cache,
    schema: propertiesSchemaForFile(params.schemaCache, params.file, compatibilityMode),
    parsed,
  })
  const baseSchemaDiagnostics = schemaValidation.diagnostics
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
    runtime: params.runtime,
  })
  const requiredIssues = requiredDiagnostics.map(validationIssueFromDiagnostic)
  const validatorsMs = performance.now() - validatorsStartedAt
  if (requiredDiagnostics.length > 0) {
    const evaluated = evaluateParsedXmlAnomalyBoundaries({
      filePath: entry.filePath,
      parsed,
      diagnostics: [...schemaDiagnostics, ...requiredDiagnostics],
      issues: [
        ...schemaValidation.issues,
        ...requiredIssues,
      ],
      deferUnnecessaryFor: () => true,
    })
    const diagnostics = evaluated.diagnostics
    if (diagnostics.length > 0) {
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
  }

  const equalNameValidationName =
    params.file.kind === "configuration" ? rootStringProperty(parsed.data, "Имя") : params.file.owner.name
  const equalNameStartedAt = performance.now()
  let localizedTextProperties = 0
  const equalNameDiagnostics = validateExcludedEqualNameYAML({
    filePath: params.file.absolutePath,
    parsed,
    rule: params.file.owner.spec.rule,
    context: params.context,
    name: equalNameValidationName,
    onLocalizedTextProperty: () => { localizedTextProperties += 1 },
  })
  const equalNameMs = performance.now() - equalNameStartedAt
  const facts = extractFirstPassFacts(params, { ...entry, parsed }, compatibilityMode)
  const publishedSchemaDiagnostics = suppressEqualNameSchemaDiagnostics(schemaDiagnostics, equalNameDiagnostics)
  const unevaluatedDiagnostics = [
    ...publishedSchemaDiagnostics,
    ...equalNameDiagnostics,
    ...facts.diagnostics,
  ]
  const evaluated = evaluateProjectXmlAnomalyBoundaries({
    filePath: entry.filePath,
    parsed,
    diagnostics: unevaluatedDiagnostics,
    issues: [
      ...schemaValidation.issues,
      ...requiredIssues,
      ...equalNameDiagnostics.map(validationIssueFromDiagnostic),
      ...facts.diagnostics.map(validationIssueFromDiagnostic),
    ],
    facts,
  })
  const diagnostics = evaluated.diagnostics
  const { pendingReferences, pendingChecks } = applyXmlAnomalyStatesToFacts(facts, evaluated.boundaries)

  return {
    state: {
      kind: "properties",
      file: params.file,
      pendingReferences,
      pendingChecks,
      firstPassDiagnostics: diagnostics,
    },
    schemaDiagnostics: publishedSchemaDiagnostics,
    contributedFacts: true,
    diagnostics,
    issues: evaluated.issues,
    objectIndexEntries: facts.objectIndexEntries,
    memberIndexEntries: facts.memberIndexEntries,
    valueIndexEntries: facts.valueIndexEntries,
    pendingReferences,
    dependencies: facts.localDependencies.map(({ canonical }) => canonical),
    ...languageValidationDependency(localizedTextProperties, params.context),
    ...(facts.logicalAddresses === undefined ? {} : { logicalAddresses: facts.logicalAddresses }),
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

function deferredXmlAnomalyTargetKeys(facts: ProjectValidationFileFacts): ReadonlySet<string> {
  const paths = [
    ...facts.pendingReferences.filter(({ xmlAnomaly }) => xmlAnomaly !== undefined).map(({ yamlPath }) => yamlPath),
    ...facts.pendingChecks.filter((check) => "xmlAnomaly" in check && check.xmlAnomaly !== undefined)
      .map(({ yamlPath }) => yamlPath),
  ]
  return new Set(paths.map((path) => validationIssueTargetKey({ kind: "path", path })))
}

function evaluateProjectXmlAnomalyBoundaries(params: {
  readonly filePath: string
  readonly parsed: ParsedYaml
  readonly diagnostics: readonly Diagnostic[]
  readonly issues: readonly ValidationIssue[]
  readonly facts: ProjectValidationFileFacts
}) {
  const deferredTargets = deferredXmlAnomalyTargetKeys(params.facts)
  return evaluateParsedXmlAnomalyBoundaries({
    filePath: params.filePath,
    parsed: params.parsed,
    diagnostics: params.diagnostics,
    issues: params.issues,
    deferUnnecessaryFor: (target) => deferredTargets.has(validationIssueTargetKey(target)),
  })
}

function applyXmlAnomalyStates<T extends {
  readonly yamlPath: readonly (string | number)[]
  readonly xmlAnomaly?: "pending" | "accepted"
}>(
  entries: readonly T[],
  boundaries: readonly {
    readonly target: ValidationIssueTarget
    readonly state: "pending" | "accepted"
  }[],
): T[] {
  const states = new Map(
    boundaries
      .filter(({ target }) => target.kind === "path")
      .map(({ target, state }) => [validationIssueTargetKey(target), state] as const),
  )
  return entries.map((entry) => {
    if (entry.xmlAnomaly === undefined) return entry
    const state = states.get(validationIssueTargetKey({ kind: "path", path: entry.yamlPath }))
    return state === undefined ? entry : { ...entry, xmlAnomaly: state }
  })
}

function applyXmlAnomalyStatesToFacts(
  facts: ProjectValidationFileFacts,
  boundaries: readonly {
    readonly target: ValidationIssueTarget
    readonly state: "pending" | "accepted"
  }[],
): Pick<ProjectValidationFileFacts, "pendingReferences" | "pendingChecks"> {
  return {
    pendingReferences: applyXmlAnomalyStates(facts.pendingReferences, boundaries),
    pendingChecks: applyXmlAnomalyStates(facts.pendingChecks, boundaries),
  }
}

function languageValidationDependency(
  localizedTextProperties: number,
  context: ConfigurationContext,
): Pick<ProjectValidationFirstPassResult, "validationContextDependencies"> {
  return localizedTextProperties === 0
    ? {}
    : { validationContextDependencies: [{ key: "languages", version: context.languages.version }] }
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
    issues: diagnostics.map(validationIssueFromDiagnostic),
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
  runtime?: ValidationRegistrySet
}): Diagnostic[] {
  const validators = params.runtime?.references.getFileValidators(params.file.owner.spec.kind)
    ?? getProjectFileValidators(params.file.owner.spec.kind)
  return validators.flatMap((validator) =>
    validator({ filePath: params.file.absolutePath, parsed: params.parsed })
  )
}

function validateProjectFileSchema(params: {
  file: ValidationProjectFile
  cache: ProjectYamlCache
  schema: CompiledSchema
  parsed?: ParsedYaml
}): { diagnostics: Diagnostic[]; issues: ValidationIssue[] } {
  const entry = params.cache.get(params.file.absolutePath)
  if ("error" in entry) {
    const diagnostic = {
        filePath: entry.filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "external-file",
        message: `Не удалось прочитать YAML-файл: ${entry.error.message}`,
      } satisfies Diagnostic
    return { diagnostics: [diagnostic], issues: [validationIssueFromDiagnostic(diagnostic)] }
  }

  return validateParsedFileWithIssues({
    filePath: entry.filePath,
    parsed: params.parsed ?? entry.parsed,
    schema: params.schema,
    evaluateXmlAnomalies: false,
  })
}

function validationIssueFromDiagnostic(diagnostic: Diagnostic): ValidationIssue {
  return {
    code: `diagnostic.${diagnostic.source}`,
    kind: diagnostic.source === "syntax" || diagnostic.source === "external-file"
      ? "infrastructure"
      : "semantic",
    target: { kind: "path", path: validationIssuePathFromPointer(diagnostic.path ?? "") },
    params: { message: diagnostic.message },
  }
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
