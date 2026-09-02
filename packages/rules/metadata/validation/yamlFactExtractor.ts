import { parseMetadataTargetFromYAML } from "../ruleRuntime/metadataTarget"
import {
  isTypeOwnedMetadataTargetUnavailable,
  metadataTargetConstraintForOwner,
  metadataTargetOwnerForProperty,
  rootFromYAML,
} from "@nkdk/runtime/rule-kit"
import type { MetadataTargetOwner } from "@nkdk/runtime/rule-kit"
import type { ElementType } from "../ruleRuntime/formElement/types"
import { getTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import { getSystemEnumeration } from "@nkdk/runtime/rule-kit"
import type { DataPathPropertyRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import { callAtomicFromYAML } from "../ruleRuntime/property/fromYAMLToXML"
import { exportPropertyValueToYAML } from "../ruleRuntime/property/toYAML"
import { getElementRule } from "../ruleRuntime/formElement/ruleFactory"
import { enterNestedYamlRule, enterYamlProperty } from "../ruleRuntime/property/yamlRuleCursor"
import type { YamlRuleCursor } from "@nkdk/runtime/rule-kit"
import {
  createConfigurationLanguages,
  isMetadataTargetUuid,
  parsedYamlFromKnownData,
  snapshotXmlAnomalyAnnotations,
  type ConfigurationContext,
  type ParsedYaml,
  type XmlAnomalyAnnotation,
} from "@nkdk/runtime"
import {
  metadataTargetUuidContractForOccurrence,
  type MetadataTargetOccurrence,
} from "@nkdk/runtime/rule-kit"
import type { FormDataPathIndex } from "./dataPath/formIndex"
import { buildObjectFieldIndex, type ObjectFieldIndex } from "./dataPath/objectFields"
import { ownerFactFromYAML, type ValidationOwnerFacts } from "./dataPath/ownerFacts"
import {
  projectMetadataTargetIndexKey,
  projectObjectIndexKey,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
  type ProjectValueIndexEntry,
} from "./projectReferenceIndex"
import type { ValidationProjectFile } from "./projectFiles"
import type { DataPathValidationPendingCheck, ValidationPendingCheck } from "./projectValidationPendingChecks"
import { toDataPathPolicyInput } from "./dataPath/policies"
import {
  findValidationRulesSpec,
  findValidationRulesItem,
  type ValidationRulesSnapshot,
  type ValidationRulesSpecSnapshot,
} from "./rulesSnapshot"
import {
  collectStructuralYamlReferences,
  type StructuralReferenceNestedRule,
  type StructuralReferenceRuntime,
} from "./structuralReferences"
import { validateRuleYAMLObjectProperties } from "./excludeIfEqualNameYAML"
import { diagnosticAtYamlPath, yamlDiagnosticLocationAtPath } from "./yamlLocations"
import type { Diagnostic } from "./types"
import { createLocalIndexesCollector } from "../projectDefinition/localIndexes"
import type { LocalIndexesCollector } from "../projectDefinition/localIndexes"
import { validateRegisteredLocalYamlValue } from "./yamlValueValidationRegistry"
import type { ValidationRegistrySet } from "./validationRegistrySet"
import {
  analyzeDependentYamlItem,
  type DependentImportedPropertyCandidate,
  type DependentReferenceCandidate,
} from "../ruleRuntime/property/dependentItemRegistry"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { createFormDataPathIndexFromYAML } from "./dataPath/formYamlIndex"
import { getRegisteredFormDataPathMetadataProjection } from "./formDataPathProjectionRegistry"
import type { FormElementNameCollectorView, FormStructuredComponent } from "./formContracts"
import { requireFormValidationAdapter } from "./formValidationRegistry"
import {
  collectAddressableMetadataObjectEntries,
  objectTargetForProjectFile,
} from "./addressableMetadataTargets"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import type { ProjectStateStructuredDocumentEntry } from "../projectState/contracts/fileUpdate"
import { collectConfigurationExtensionPropertyStateDocuments } from "./configurationExtensionPropertyStateFacts"
import { configurationExtensionStructureDocument } from "../ruleRuntime/property/configurationExtensionStructureFacts"
import { traverseMetadataRuleYaml } from "./metadataRuleYamlTraversal"

export type LocalValueValidationProfile = Record<string, { items: number; timeMs: number }>

export interface ValidationYamlFacts {
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  pendingChecks: ValidationPendingCheck[]
  diagnostics: Diagnostic[]
  localValueValidationProfile: LocalValueValidationProfile
  localizedTextProperties: number
  fieldIndex?: ObjectFieldIndex
  formDataPathIndex?: FormDataPathIndex
  localIndexes?: ReturnType<LocalIndexesCollector["finish"]>
  structuredComponents?: readonly FormStructuredComponent[]
  structuredDocuments?: readonly ProjectStateStructuredDocumentEntry[]
}

export interface ValidationOwnerYamlFacts {
  fieldIndex: ObjectFieldIndex
  ownerFacts: ValidationOwnerFacts
}

export interface DependentYamlIndexFacts {
  readonly pendingReferences: readonly PendingMetadataTargetReference[]
  readonly pendingChecks: readonly ValidationPendingCheck[]
}

export function extractDependentYamlIndexFacts(params: {
  readonly filePath: string
  readonly rootYaml: unknown
  readonly rootRule: MetadataItemRule
  readonly owner: { readonly dir: string; readonly name: string }
  readonly candidates: readonly DependentImportedPropertyCandidate[]
}): DependentYamlIndexFacts {
  const parsed = parsedYamlFromKnownData("", params.rootYaml)
  const pendingReferences: PendingMetadataTargetReference[] = []
  const pendingChecks: ValidationPendingCheck[] = []
  const visitedItems = new Set<string>()
  for (const candidate of params.candidates) {
    const itemKey = JSON.stringify([candidate.itemType, candidate.itemName, candidate.itemYamlPath])
    if (visitedItems.has(itemKey)) continue
    visitedItems.add(itemKey)
    const root = asRecord(params.rootYaml)
    const item = root === undefined ? undefined : asRecord(valueAtPath(root, candidate.itemYamlPath))
    if (item === undefined) continue
    const analysis = analyzeDependentYamlItem({
      itemType: candidate.itemType,
      ...(candidate.itemName === undefined ? {} : { itemName: candidate.itemName }),
      item,
      itemYamlPath: candidate.itemYamlPath,
      rootYaml: params.rootYaml,
      rootRule: params.rootRule,
      filePath: params.filePath,
      parsed,
      owner: params.owner,
    })
    pendingReferences.push(...analysis.references.map((reference) => ({
      ...dependentPendingReference(reference),
      filePath: params.filePath,
    })))
    pendingChecks.push(...analysis.projectChecks.map((check) => ({
      ...check,
      location: yamlDiagnosticLocationAtPath({
        filePath: params.filePath,
        parsed,
        path: check.yamlPath,
      }),
    })))
  }
  return { pendingReferences, pendingChecks }
}

export function extractValidationYamlFacts(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  rulesSnapshot: ValidationRulesSnapshot
  validationDiagnostics?: boolean
  runtime?: ValidationRegistrySet
  propertyStateCompatibilityMode?: string
  borrowedLogicalAddresses?: ReadonlySet<string>
  context?: ConfigurationContext
  fileExists?: (absolutePath: string) => boolean
}): ValidationYamlFacts {
  if (params.parsed.annotations.root() !== undefined) return emptyFacts()
  const validationDiagnostics = params.validationDiagnostics !== false
  if (params.file.kind === "form") {
    return validationDiagnostics
      ? extractFormYamlFacts(params.file, params.parsed, params.context, params.runtime)
      : emptyFacts()
  }

  const spec = findValidationRulesItem(
    params.rulesSnapshot,
    params.file.itemType,
    params.file.topologyNodeId,
  ) ?? findValidationRulesSpec(params.rulesSnapshot, params.file.owner.dir)
  const objectTarget = objectTargetForProjectFile(params.file)
  const owner = referenceOwnerForProjectFile(params.file, objectTarget)
  const referenceDiagnostics: Diagnostic[] = []
  const claimedUuidAnnotations = new Set<XmlAnomalyAnnotation>()
  const localValueDiagnostics: Diagnostic[] = []
  const localValueValidationProfile: LocalValueValidationProfile = {}
  if (validationDiagnostics && params.parsed.annotations.root() === undefined) {
    collectLocalValueValidation({
      filePath: params.file.absolutePath,
      parsed: params.parsed,
      owner: params.file.owner,
      type: params.file.itemType,
      value: params.parsed.data,
      yamlPath: [],
      diagnostics: localValueDiagnostics,
      profile: localValueValidationProfile,
      runtime: params.runtime,
    })
  }
  const localIndexesCollector = createLocalIndexesCollector({ recordEvents: false })
  const pendingChecks: ValidationPendingCheck[] = []
  const pendingReferences =
    spec === undefined
      ? []
      : collectPendingReferences({
          filePath: params.file.absolutePath,
          parsed: params.parsed,
          owner,
          value: params.parsed.data,
          properties: spec.properties,
          yamlPath: [],
          diagnostics: referenceDiagnostics,
          localValueDiagnostics,
          localValueValidationProfile,
          collector: localIndexesCollector,
          fileOwner: params.file.owner,
          rulePath: [],
          rootYaml: params.parsed.data,
          rootRule: params.file.itemRule,
          validationDiagnostics,
          pendingChecks,
          runtime: params.runtime,
          claimedUuidAnnotations,
        })
  if (validationDiagnostics) {
    collectUnclaimedUuidAnnotationDiagnostics({
      filePath: params.file.absolutePath,
      parsed: params.parsed,
      claimed: claimedUuidAnnotations,
      diagnostics: referenceDiagnostics,
    })
  }
  const collectedLocalIndexes = localIndexesCollector.finish()
  const ownerFacts = spec === undefined
    ? undefined
    : collectOwnerFactRolesFromYaml(params.parsed.data, spec, params.parsed.annotations)
  const localIndexes = ownerFacts === undefined || Object.keys(ownerFacts).length === 0
    ? collectedLocalIndexes
    : {
        ...collectedLocalIndexes,
        metadata: {
          ...collectedLocalIndexes.metadata,
          ownerFacts: {
            ...collectedLocalIndexes.metadata.ownerFacts,
            ...ownerFacts,
          },
        },
      }
  const objectIndexEntries = objectTarget === undefined
    ? []
    : [
        {
          canonical: projectObjectIndexKey(objectTarget),
          target: objectTarget,
          result: {
            ok: true as const,
            filePath: params.file.absolutePath,
            details: objectIndexDetails(params.parsed.data),
          },
        },
        ...collectAddressableMetadataObjectEntries({
          yaml: params.parsed.data,
          rule: params.file.itemRule,
          canonicalTarget: projectObjectIndexKey(objectTarget),
          filePath: params.file.absolutePath,
        }),
      ]
  const extensionComponent = params.file.componentPath.startsWith("cfe/")
  const fileExists = params.fileExists ?? existsSync
  const belongsToBorrowedPair = extensionComponent && (
    fileExists(resolve(params.file.componentDir, "..", "..", "cf", ...params.file.projectPath.split("/")))
  )
  const extensionLogicalAddress = params.file.logicalAddress
    ?? (params.file.componentPath.startsWith("cfe/") && objectTarget !== undefined
      ? projectObjectIndexKey(objectTarget)
      : undefined)
  const structuredDocuments = extensionLogicalAddress === undefined
    ? []
    : collectConfigurationExtensionDocuments({
        yaml: params.parsed.data,
        parsed: params.parsed,
        rule: params.file.itemRule,
        logicalAddress: extensionLogicalAddress,
        workingProjectPath: params.file.projectPath,
        runtime: params.runtime,
        collectPropertyStates: belongsToBorrowedPair,
        borrowed: belongsToBorrowedPair,
        borrowedLogicalAddresses: params.borrowedLogicalAddresses,
        propertyStateCompatibilityMode: params.propertyStateCompatibilityMode,
        projectFileExists: (projectPath) => fileExists(resolve(params.file.componentDir, ...projectPath.split("/"))),
      })
  const propertyStatePendingReferences = pendingReferences.map((reference) => {
    const propertyStateMode = pendingReferencePropertyStateMode(
      reference.yamlPath,
      structuredDocuments,
      params.file.itemRule,
    )
    return propertyStateMode === undefined ? reference : { ...reference, propertyStateMode }
  })
  return {
    objectIndexEntries,
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: propertyStatePendingReferences,
    pendingChecks,
    diagnostics: validationDiagnostics
      ? [
          ...referenceDiagnostics,
          ...localValueDiagnostics,
          ...(spec === undefined ? [] : collectUniqueNameScopeDiagnostics(params.file, params.parsed, spec)),
        ]
      : [],
    localValueValidationProfile,
    localizedTextProperties: 0,
    localIndexes,
    ...(structuredDocuments.length === 0
      ? {}
      : { structuredDocuments }),
  }
}

interface ExtensionDocumentTraversalState {
  readonly logicalAddress: string
  readonly metadataObject: boolean
}

function collectConfigurationExtensionDocuments(params: {
  readonly yaml: unknown
  readonly parsed: ParsedYaml
  readonly rule: MetadataItemRule
  readonly logicalAddress: string
  readonly workingProjectPath: string
  readonly runtime?: ValidationRegistrySet
  readonly collectPropertyStates: boolean
  readonly borrowed: boolean
  readonly borrowedLogicalAddresses?: ReadonlySet<string>
  readonly propertyStateCompatibilityMode?: string
  readonly projectFileExists: (projectPath: string) => boolean
}): readonly ProjectStateStructuredDocumentEntry[] {
  const documents: ProjectStateStructuredDocumentEntry[] = []
  traverseMetadataRuleYaml<ExtensionDocumentTraversalState>({
    yaml: params.yaml,
    rule: params.rule,
    initialState: { logicalAddress: params.logicalAddress, metadataObject: true },
    onObject: ({ yaml, rule, yamlPath, state }) => {
      if (!state.metadataObject) return
      const record = metadataRecord(yaml)
      const capability = params.runtime?.propertyStates.item(
        rule.itemType,
        params.propertyStateCompatibilityMode,
      )
      const extensionObject = params.borrowedLogicalAddresses !== undefined
      const borrowed = params.borrowedLogicalAddresses?.has(state.logicalAddress) ?? params.borrowed
      if (capability !== undefined && (params.collectPropertyStates || !borrowed)) {
        const propertyStateDocuments = collectConfigurationExtensionPropertyStateDocuments({
          yaml: record,
          rule,
          capability,
          logicalAddress: state.logicalAddress,
          workingProjectPath: params.workingProjectPath,
          borrowed,
          projectFileExists: params.projectFileExists,
          yamlPathPrefix: yamlPath,
          isInvalidAtYAMLPath: (path) => hasSemanticXmlAnomalyAtExactPath(params.yaml, params.parsed, path),
        })
        if (params.collectPropertyStates && (!extensionObject || borrowed)) {
          documents.push(...propertyStateDocuments)
        }
      }
      documents.push(configurationExtensionStructureDocument({
        itemType: rule.itemType,
        logicalAddress: state.logicalAddress,
        workingProjectPath: params.workingProjectPath,
        yamlPath,
        ...(typeof record["РежимСовместимостиРасширенияКонфигурации"] === "string"
          ? { compatibilityMode: record["РежимСовместимостиРасширенияКонфигурации"] as string }
          : {}),
        ...(typeof record["ДлинаНомераСтроки"] === "number"
          ? { lineNumberLength: record["ДлинаНомераСтроки"] as number }
          : {}),
        ...(typeof record["ИсторияДанных"] === "string"
          ? { dataHistory: record["ИсторияДанных"] as string }
          : {}),
        ...(typeof record["РаспределеннаяИнформационнаяБаза"] === "boolean"
          ? { distributedInfoBase: record["РаспределеннаяИнформационнаяБаза"] as boolean }
          : {}),
        ...(hasRestrictedExtensionTypes(record) ? { usesRestrictedTypes: true } : {}),
        ...(typeof record["Размещение"] === "string" ? { location: record["Размещение"] as string } : {}),
        ...(typeof record["Тип"] === "string" ? { valueType: record["Тип"] as string } : {}),
      }))
    },
    enterNestedObject: ({ state }) => ({ ...state, metadataObject: false }),
    enterCollectionItem: ({ rule, propertyRule, collectionUidSegment, itemName, state }) => {
      const externalMetadata = rule.externalMetadata
      const addressable = externalMetadata?.placement === "ownedEntry" ||
        externalMetadata?.placement === "ownerChild" || rule.properties.uuid !== undefined
      const segment = propertyRule.configurationIndexUidSegment ?? collectionUidSegment ?? externalMetadata?.segment
      if (!addressable || itemName === undefined || segment === undefined) {
        return { ...state, metadataObject: false }
      }
      return {
        logicalAddress: `${state.logicalAddress}.${segment}.${itemName}`,
        metadataObject: true,
      }
    },
  })
  return documents
}

function pendingReferencePropertyStateMode(
  yamlPath: readonly (string | number)[],
  documents: readonly ProjectStateStructuredDocumentEntry[],
  rule: MetadataItemRule,
): "control" | "notify" | "extend" | undefined {
  const candidates = documents
    .filter((entry) => entry.documentKind === "configurationExtensionPropertyState"
      && (isYamlPathPrefix(entry.yamlPath, yamlPath)
        || propertyDocumentMatchesReference(entry, yamlPath, rule)))
    .sort((left, right) => right.yamlPath.length - left.yamlPath.length)
  const candidate = candidates[0]
  if (candidate?.payload === undefined) return undefined
  const payload = JSON.parse(candidate.payload) as {
    mode?: unknown
    value?: unknown
    explicitMode?: unknown
  }
  if (payload.mode === "control" || payload.mode === "notify" || payload.mode === "extend") {
    return payload.mode
  }
  if (payload.mode !== "multi" || !Array.isArray(payload.value)) return undefined
  const relativePath = yamlPath.slice(candidate.yamlPath.length)
  const index = relativePath.find((segment): segment is number => typeof segment === "number")
  const part = index === undefined ? undefined : payload.value[index]
  if (typeof part !== "object" || part === null) return undefined
  const mode = (part as { mode?: unknown }).mode
  return mode === "control" || mode === "notify" || mode === "extend" ? mode : undefined
}

function propertyDocumentMatchesReference(
  entry: ProjectStateStructuredDocumentEntry,
  yamlPath: readonly (string | number)[],
  rule: MetadataItemRule,
): boolean {
  const yamlName = rule.properties[entry.name]?.yaml
  return typeof yamlName === "string" && yamlPath[0] === yamlName
}

function isYamlPathPrefix(
  prefix: readonly (string | number)[],
  path: readonly (string | number)[],
): boolean {
  return prefix.length <= path.length && prefix.every((segment, index) => segment === path[index])
}

function hasRestrictedExtensionTypes(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasRestrictedExtensionTypes)
  if (value === null || typeof value !== "object") return false
  return Object.entries(value).some(([key, nested]) => key === "Тип"
    ? isRestrictedExtensionTypeValue(nested)
    : hasRestrictedExtensionTypes(nested))
}

function isRestrictedExtensionTypeValue(value: unknown): boolean {
  if (typeof value === "string") return /^(?:ОпределяемыйТип|Характеристика)(?:\.|$)/u.test(value)
  if (Array.isArray(value)) return value.length > 1 || value.some(isRestrictedExtensionTypeValue)
  if (value === null || typeof value !== "object") return false
  return Object.values(value).some(isRestrictedExtensionTypeValue)
}

export function extractValidationOwnerYamlFacts(params: {
  file: ValidationProjectFile
  data: unknown
  rulesSnapshot: ValidationRulesSnapshot
  runtime?: ValidationRegistrySet
}): ValidationOwnerYamlFacts | undefined {
  const spec = findValidationRulesSpec(params.rulesSnapshot, params.file.owner.dir)
  return spec === undefined ? undefined : buildOwnerFactsFromYaml(params.file, params.data, spec, params.runtime)
}

function objectIndexDetails(data: unknown): { type?: string } {
  const type = metadataRecord(data)["Тип"]
  return typeof type === "string" ? { type } : {}
}

function referenceOwnerForProjectFile(
  file: ValidationProjectFile,
  objectTarget: ReturnType<typeof objectTargetForProjectFile>,
): MetadataTargetOwner | undefined {
  if (objectTarget === undefined || file.metadataTarget === undefined) return undefined

  const currentOwner = {
    root: objectTarget.root,
    objectName: file.metadataTarget.owner.objectName,
  }
  if (file.itemRule.metadataTargetOwner?.kind !== "inherit") return currentOwner

  const segment = file.itemRule.externalMetadata?.segment
  if (segment === undefined) return currentOwner
  const marker = `.${segment}.`
  const markerIndex = currentOwner.objectName.lastIndexOf(marker)
  return markerIndex <= 0
    ? currentOwner
    : { root: currentOwner.root, objectName: currentOwner.objectName.slice(0, markerIndex) }
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

function emptyFacts(): ValidationYamlFacts {
  return {
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
    pendingChecks: [],
    diagnostics: [],
    localValueValidationProfile: {},
    localizedTextProperties: 0,
  }
}

function buildOwnerFactsFromYaml(
  file: ValidationProjectFile,
  data: unknown,
  spec: ValidationRulesSpecSnapshot,
  runtime?: ValidationRegistrySet,
): ValidationOwnerYamlFacts {
  const compactFacts = collectOwnerFactRolesFromYaml(data, spec)

  const ref = { kind: file.owner.dir, name: file.owner.name }
  const ownerFactsWithoutIndex = {
    ref,
    filePath: file.absolutePath,
    fieldIndex: emptyObjectFieldIndex(),
    ...compactFacts,
  } as ValidationOwnerFacts
  const owner = {
    ref,
    facts: ownerFactsWithoutIndex,
    rule: file.owner.spec.rule,
  }
  const fieldIndex = runtime?.buildObjectFieldIndex(owner) ?? buildObjectFieldIndex(owner)
  return {
    fieldIndex,
    ownerFacts: { ...ownerFactsWithoutIndex, fieldIndex },
  }
}

function collectOwnerFactRolesFromYaml(
  data: unknown,
  spec: Pick<ValidationRulesSpecSnapshot, "properties">,
  annotations?: ParsedYaml["annotations"],
): Record<string, unknown> {
  const record = asRecord(data) ?? {}
  const compactFacts: Record<string, unknown> = {}
  for (const property of spec.properties) {
    if (property.ownerFactRole === undefined) continue
    const value = valueAtPath(record, property.yamlPath)
    const fact = ownerFactFromYAML(property.ownerFactRole, value, annotations)
    if (fact !== undefined) compactFacts[property.ownerFactRole] = fact
  }
  return compactFacts
}

function emptyObjectFieldIndex(): ObjectFieldIndex {
  return { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
}

function collectUniqueNameScopeDiagnostics(
  file: ValidationProjectFile,
  parsed: ParsedYaml,
  spec: Pick<ValidationRulesSpecSnapshot, "uniqueNameScopes" | "properties">
): Diagnostic[] {
  if (spec.uniqueNameScopes.length === 0) return []

  const diagnostics: Diagnostic[] = []
  const data = asRecord(parsed.data)
  if (data === undefined) return []

  for (const scope of spec.uniqueNameScopes) {
    const seen = new Map<string, string>()

    for (const collection of scope.collections) {
      const collectionYamlPath = yamlPathByModelKey(spec, collection)
      if (collectionYamlPath === undefined) continue
      const collectionValue = valueAtPath(data, collectionYamlPath)
      const collectionRecord = asRecord(collectionValue)
      if (collectionRecord === undefined) continue

      for (const name of Object.keys(collectionRecord)) {
        const previousCollectionYaml = seen.get(name)
        const collectionYaml = collectionYamlPath.join("/")
        if (previousCollectionYaml === undefined) {
          seen.set(name, collectionYaml)
          continue
        }

        diagnostics.push(
          diagnosticAtYamlPath({
            filePath: file.absolutePath,
            parsed,
            path: [...collectionYamlPath, name],
            severity: "error",
            source: "structure",
            message: `Имя "${name}" должно быть уникальным в коллекциях ${previousCollectionYaml}, ${collectionYaml}`,
          })
        )
      }
    }
  }

  return diagnostics
}

function yamlPathByModelKey(
  spec: Pick<ValidationRulesSpecSnapshot, "properties">,
  modelKey: string,
): readonly string[] | undefined {
  return spec.properties.find((property) => property.modelKey === modelKey)?.yamlPath
}

function collectLocalValueValidation(params: {
  filePath: string
  parsed: ParsedYaml
  owner: ValidationProjectFile["owner"]
  type: string
  value: unknown
  yamlPath: readonly (string | number)[]
  diagnostics: Diagnostic[]
  profile: LocalValueValidationProfile
  runtime?: ValidationRegistrySet
}): void {
  const input = {
    type: params.type,
    filePath: params.filePath,
    parsed: params.parsed,
    owner: { dir: params.owner.dir, name: params.owner.name },
    value: params.value,
    yamlPath: params.yamlPath,
  }
  const result = params.runtime?.validateLocalValue(input) ?? validateRegisteredLocalYamlValue(input)
  params.diagnostics.push(...result.diagnostics)
  if (result.profile === undefined) return

  const current = params.profile[result.profile.substep]
  params.profile[result.profile.substep] = {
    items: (current?.items ?? 0) + 1,
    timeMs: (current?.timeMs ?? 0) + result.profile.timeMs,
  }
}

function collectPendingReferences(params: {
  filePath: string
  parsed: ParsedYaml
  owner: MetadataTargetOwner | undefined
  value: unknown
  properties: readonly ValidationRulesSpecSnapshot["properties"][number][]
  yamlPath: readonly (string | number)[]
  diagnostics: Diagnostic[]
  localValueDiagnostics: Diagnostic[]
  localValueValidationProfile: LocalValueValidationProfile
  collector: LocalIndexesCollector
  fileOwner: ValidationProjectFile["owner"]
  rulePath: readonly { propertyKey: string; nestedItemType?: string }[]
  rootYaml: unknown
  rootRule: MetadataItemRule
  validationDiagnostics: boolean
  pendingChecks: ValidationPendingCheck[]
  runtime?: ValidationRegistrySet
  claimedUuidAnnotations: Set<XmlAnomalyAnnotation>
}): PendingMetadataTargetReference[] {
  const record = asRecord(params.value)
  if (record === undefined) return []

  const references: PendingMetadataTargetReference[] = []
  for (const property of params.properties) {
    const yamlPath = [...params.yamlPath, ...property.yamlPath]
    const hasAnomaly = hasXmlAnomalyAtPath(params.rootYaml, params.parsed, yamlPath)
    if (hasRawXmlAnomalyAtPath(params.rootYaml, params.parsed, yamlPath)) continue
    const sourceValue = valueAtLogicalPath(record, property.yamlPath, params.parsed)
    if (sourceValue === undefined) continue
    const value = withoutRawDescendants(sourceValue, params.parsed)
    const rulePath = [
      ...params.rulePath,
      {
        propertyKey: property.modelKey,
        ...(property.nestedItemType === undefined
          ? {}
          : { nestedItemType: property.nestedItemType }),
      },
    ]
    if (property.type !== undefined) {
      if (params.validationDiagnostics && !hasAnomaly) {
        collectLocalValueValidation({
          filePath: params.filePath,
          parsed: params.parsed,
          owner: params.fileOwner,
          type: property.type,
          value,
          yamlPath,
          diagnostics: params.localValueDiagnostics,
          profile: params.localValueValidationProfile,
          runtime: params.runtime,
        })
      }
      params.collector.acceptProperty({
        yamlPath,
        rulePath,
        rule: {
          type: property.type as PropertyRule["type"],
          yaml: property.yamlPath.at(-1),
          ...(property.ownerFactRole === undefined ? {} : { ownerFactRole: property.ownerFactRole }),
        },
        value,
        annotations: params.parsed.annotations,
        source: yamlDiagnosticLocationAtPath({ filePath: params.filePath, parsed: params.parsed, path: yamlPath }),
      })
    }

    if (property.metadataTarget !== undefined) {
      const siblingValue = (propertyKey: string) => {
        const sibling = params.properties.find((candidate) => candidate.modelKey === propertyKey)
        return sibling === undefined ? undefined : valueAtPath(record, sibling.yamlPath)
      }
      if (isTypeOwnedMetadataTargetUnavailable({
        rule: { metadataTarget: property.metadataTarget },
        siblingValue,
      })) {
        if (params.validationDiagnostics) {
          params.diagnostics.push(diagnosticAtYamlPath({
            filePath: params.filePath,
            parsed: params.parsed,
            path: yamlPath,
            severity: "error",
            source: "reference",
            message: `Свойство "${property.yamlPath.at(-1)}" недоступно для реквизита с составным типом`,
          }))
        }
        continue
      }
      const propertyOwner = metadataTargetOwnerForProperty({
        rule: { metadataTarget: property.metadataTarget },
        owner: params.owner,
        siblingValue,
      })
      auditMetadataTargetUuidOccurrences({
        ...params,
        value: sourceValue,
        type: property.type,
        metadataTarget: property.metadataTarget,
        yamlPath,
        owner: propertyOwner,
      })
      references.push(
        ...collectTargetValues({
          filePath: params.filePath,
          parsed: params.parsed,
          owner: propertyOwner,
          value,
          type: property.type,
          constraint: metadataTargetConstraintForOwner(property.metadataTarget, propertyOwner),
          yamlPath,
          diagnostics: params.diagnostics,
          validationDiagnostics: params.validationDiagnostics,
        })
      )
    }

    if (property.children !== undefined) {
      references.push(
        ...collectNestedReferences({
          filePath: params.filePath,
          parsed: params.parsed,
          owner: params.owner,
          value,
          properties: property.children,
          yamlPath,
          diagnostics: params.diagnostics,
          localValueDiagnostics: params.localValueDiagnostics,
          localValueValidationProfile: params.localValueValidationProfile,
          collector: params.collector,
          fileOwner: params.fileOwner,
          rulePath,
          rootYaml: params.rootYaml,
          rootRule: params.rootRule,
          nestedItemType: property.nestedItemType,
          validationDiagnostics: params.validationDiagnostics,
          pendingChecks: params.pendingChecks,
          runtime: params.runtime,
          claimedUuidAnnotations: params.claimedUuidAnnotations,
        })
      )
    }
  }

  return references
}

function collectNestedReferences(params: {
  filePath: string
  parsed: ParsedYaml
  owner: MetadataTargetOwner | undefined
  value: unknown
  properties: readonly ValidationRulesSpecSnapshot["properties"][number][]
  yamlPath: readonly (string | number)[]
  diagnostics: Diagnostic[]
  localValueDiagnostics: Diagnostic[]
  localValueValidationProfile: LocalValueValidationProfile
  collector: LocalIndexesCollector
  fileOwner: ValidationProjectFile["owner"]
  rulePath: readonly { propertyKey: string; nestedItemType?: string }[]
  rootYaml: unknown
  rootRule: MetadataItemRule
  nestedItemType?: string
  validationDiagnostics: boolean
  pendingChecks: ValidationPendingCheck[]
  runtime?: ValidationRegistrySet
  claimedUuidAnnotations: Set<XmlAnomalyAnnotation>
}): PendingMetadataTargetReference[] {
  if (Array.isArray(params.value)) {
    return params.value.flatMap((item, index) => collectNestedItem({ ...params, item, itemKey: index }))
  }

  const record = asRecord(params.value)
  if (record === undefined) return []

  return Object.entries(record).flatMap(([key, item]) => collectNestedItem({ ...params, item, itemKey: key }))
}

function collectNestedItem(
  params: Parameters<typeof collectNestedReferences>[0] & { item: unknown; itemKey: string | number }
): PendingMetadataTargetReference[] {
  const itemYamlPath = [...params.yamlPath, params.itemKey]
  const item = asRecord(params.item)
  const references: PendingMetadataTargetReference[] = []
  if (item !== undefined && params.nestedItemType !== undefined) {
    const analyze = params.runtime?.rules.property.analyzeDependentYamlItem ?? analyzeDependentYamlItem
    const analysis = analyze({
      itemType: params.nestedItemType,
      ...(typeof params.itemKey === "string" ? { itemName: params.itemKey } : {}),
      item,
      itemYamlPath,
      rootYaml: params.rootYaml,
      rootRule: params.rootRule,
      filePath: params.filePath,
      parsed: params.parsed,
      owner: { dir: params.fileOwner.dir, name: params.fileOwner.name },
    })
    if (params.validationDiagnostics) params.localValueDiagnostics.push(...analysis.diagnostics)
    params.pendingChecks.push(...analysis.projectChecks.map((check) => ({
      ...check,
      ...(hasSemanticXmlAnomalyAtExactPath(
        params.rootYaml,
        params.parsed,
        check.yamlPath,
      ) ? { xmlAnomaly: "pending" as const } : {}),
      location: yamlDiagnosticLocationAtPath({
        filePath: params.filePath,
        parsed: params.parsed,
        path: check.yamlPath,
      }),
    })))
    references.push(
      ...analysis.references.map((reference) => ({
        ...dependentPendingReference(reference),
        filePath: params.filePath,
        ...(hasSemanticXmlAnomalyAtExactPath(params.rootYaml, params.parsed, reference.yamlPath)
          ? { xmlAnomaly: "pending" as const }
          : {}),
      }))
    )
  }

  references.push(
    ...collectPendingReferences({
      ...params,
      value: params.item,
      yamlPath: itemYamlPath,
    })
  )
  return references
}

function dependentPendingReference(
  reference: DependentReferenceCandidate,
): Omit<PendingMetadataTargetReference, "filePath"> {
  return reference as Omit<PendingMetadataTargetReference, "filePath">
}

function collectTargetValues(params: {
  filePath: string
  parsed: ParsedYaml
  owner: MetadataTargetOwner | undefined
  value: unknown
  type?: string
  constraint: PendingMetadataTargetReference["constraint"]
  yamlPath: readonly (string | number)[]
  diagnostics: Diagnostic[]
  validationDiagnostics: boolean
  runtime?: ValidationRegistrySet
  relativePath?: readonly (string | number)[]
}): PendingMetadataTargetReference[] {
  if ((params.constraint.kind === "dataTable" || params.constraint.kind === "dataTableField")
    && params.constraint.validation === "translateOnly") return []

  if (params.type === "Picture") {
    return collectPictureTargetValues(params)
  }

  if (typeof params.value === "string") {
    if (params.value === "") return []
    if (isMetadataTargetUuid(params.value)) return []
    const reference = pendingReferenceFromYamlValue({ ...params, value: params.value, yamlPath: params.yamlPath })
    return reference === undefined ? [] : [reference]
  }

  if (Array.isArray(params.value)) {
    return params.value.flatMap((item, index) =>
      collectTargetValues({
        ...params,
        value: item,
        yamlPath: [...params.yamlPath, index],
        relativePath: [...(params.relativePath ?? []), index],
      })
    )
  }

  return []
}

function auditMetadataTargetUuidOccurrences(params: {
  filePath: string
  parsed: ParsedYaml
  owner: MetadataTargetOwner | undefined
  value: unknown
  type?: string
  metadataTarget: NonNullable<PropertyRule["metadataTarget"]>
  yamlPath: readonly (string | number)[]
  diagnostics: Diagnostic[]
  validationDiagnostics: boolean
  runtime?: ValidationRegistrySet
  claimedUuidAnnotations: Set<XmlAnomalyAnnotation>
}): void {
  if (params.type === undefined) return
  const collect = params.runtime?.rules.execution.getTypeRule(params.type, "metadataTargetOccurrences")
    ?? getTypeRule(params.type, "metadataTargetOccurrences")
  if (collect === undefined) return
  const occurrences = collect({
    value: params.value,
    representation: "yaml",
    yamlPath: params.yamlPath,
    propRule: {
      type: params.type as PropertyRule["type"],
      yaml: typeof params.yamlPath.at(-1) === "string" ? params.yamlPath.at(-1) as string : undefined,
      metadataTarget: params.metadataTarget,
    },
    owner: params.owner,
  })
  for (const occurrence of occurrences) {
    if (occurrence.representation.kind !== "canonical") continue
    const contract = metadataTargetUuidContractForOccurrence({
      yaml: params.parsed.data,
      annotations: params.parsed.annotations,
    }, occurrence)
    if (contract.kind === "accepted" || contract.kind === "unnecessary") {
      params.claimedUuidAnnotations.add(contract.annotation)
    }
    if (!params.validationDiagnostics || contract.kind === "none" || contract.kind === "accepted") continue
    params.diagnostics.push(diagnosticAtYamlPath({
      filePath: params.filePath,
      parsed: params.parsed,
      path: pathForMetadataTargetOccurrence(occurrence),
      severity: "error",
      source: "reference",
      message: contract.kind === "required"
        ? "UUID metadata-ссылки требует !xml/uuid"
        : "!xml/uuid допустим только для UUID или UUID.UUID metadata-ссылки",
    }))
  }
}

function pathForMetadataTargetOccurrence(occurrence: MetadataTargetOccurrence): readonly (string | number)[] {
  return occurrence.location.kind === "key"
    ? [...occurrence.location.path, occurrence.location.key]
    : occurrence.location.path
}

function collectUnclaimedUuidAnnotationDiagnostics(params: {
  filePath: string
  parsed: ParsedYaml
  claimed: ReadonlySet<XmlAnomalyAnnotation>
  diagnostics: Diagnostic[]
}): void {
  const snapshot = snapshotXmlAnomalyAnnotations(params.parsed.data, params.parsed.annotations)
  for (const entry of snapshot.entries) {
    if (entry.annotation.kind !== "uuid" || params.claimed.has(entry.annotation)) continue
    params.diagnostics.push(diagnosticAtYamlPath({
      filePath: params.filePath,
      parsed: params.parsed,
      path: [...entry.parentPath, entry.key],
      severity: "error",
      source: "reference",
      message: "!xml/uuid допустим только для metadata-ссылки",
    }))
  }
}

function collectPictureTargetValues(params: {
  filePath: string
  parsed: ParsedYaml
  owner: MetadataTargetOwner | undefined
  value: unknown
  constraint: PendingMetadataTargetReference["constraint"]
  yamlPath: readonly (string | number)[]
  diagnostics: Diagnostic[]
  validationDiagnostics: boolean
  runtime?: ValidationRegistrySet
}): PendingMetadataTargetReference[] {
  if (typeof params.value === "string") {
    const reference = pendingPictureReferenceFromYamlValue({
      ...params,
      value: params.value,
      yamlPath: params.yamlPath,
    })
    return reference === undefined ? [] : [reference]
  }

  const record = asRecord(params.value)
  const ref = record?.["Ссылка"]
  if (typeof ref !== "string") return []

  const reference = pendingPictureReferenceFromYamlValue({
    ...params,
    value: ref,
    yamlPath: [...params.yamlPath, "Ссылка"],
  })
  return reference === undefined ? [] : [reference]
}

function pendingPictureReferenceFromYamlValue(params: {
  filePath: string
  parsed: ParsedYaml
  owner: MetadataTargetOwner | undefined
  value: string
  constraint: PendingMetadataTargetReference["constraint"]
  yamlPath: readonly (string | number)[]
  diagnostics: Diagnostic[]
  validationDiagnostics: boolean
  runtime?: ValidationRegistrySet
}): PendingMetadataTargetReference | undefined {
  const pictureLib = params.runtime?.rules.execution.getSystemEnumeration("PictureLib") ?? getSystemEnumeration("PictureLib")
  if (params.value in (pictureLib?.fromYAML ?? {})) return undefined
  if (!params.value.startsWith("ОбщаяКартинка.")) return undefined

  return pendingReferenceFromYamlValue({
    ...params,
    constraint: { kind: "object", allowedObjectPaths: [["CommonPicture"]] },
  })
}

function pendingReferenceFromYamlValue(params: {
  filePath: string
  parsed: ParsedYaml
  owner: MetadataTargetOwner | undefined
  value: string
  constraint: PendingMetadataTargetReference["constraint"]
  yamlPath: readonly (string | number)[]
  diagnostics: Diagnostic[]
  validationDiagnostics: boolean
}): PendingMetadataTargetReference | undefined {
  const parsed = parseMetadataTargetFromYAML({
    value: params.value,
    constraint: params.constraint,
    owner: params.owner,
  })
  if (!parsed.ok) {
    if (!params.validationDiagnostics) return undefined
    params.diagnostics.push(
      diagnosticAtYamlPath({
        filePath: params.filePath,
        parsed: params.parsed,
        path: params.yamlPath,
        severity: "error",
        source: "structure",
        message: parsed.message,
      })
    )
    return undefined
  }

  return {
    filePath: params.filePath,
    yamlPath: [...params.yamlPath],
    canonical: targetKey(parsed.target),
    target: parsed.target,
    constraint: params.constraint,
    ...(hasSemanticXmlAnomalyAtExactPath(params.parsed.data, params.parsed, params.yamlPath)
      ? { xmlAnomaly: "pending" as const }
      : {}),
  }
}

const targetKey = projectMetadataTargetIndexKey

function extractFormYamlFacts(
  file: ValidationProjectFile,
  parsed: ParsedYaml,
  context: ConfigurationContext | undefined,
  runtime?: ValidationRegistrySet,
): ValidationYamlFacts {
  const data = asRecord(parsed.data)
  if (data === undefined) return emptyFacts()

  const adapter = requireFormValidationAdapter()
  const projection = getRegisteredFormDataPathMetadataProjection()
  if (projection === undefined) throw new Error("Не зарегистрирована проекция индекса формы")
  const index = createFormDataPathIndexFromYAML(parsed.data, projection, undefined, {
    inferImplicitDataPaths: file.componentPath === "cf",
  })
  const collected = collectFormPendingChecks({
    file,
    parsed,
    value: data,
    index,
    yamlPath: [],
  })
  const root = rootFromYAML[file.owner.dir]
  const validationContext = context ?? {
    version: "2.20",
    languages: createConfigurationLanguages({ default: "ru", registered: ["ru"] }),
  }
  const structuralReferences = collectStructuralYamlReferences({
    filePath: file.absolutePath,
    parsed,
    rule: adapter.formRule,
    yaml: data,
    owner: root === undefined ? undefined : { root, objectName: file.owner.name },
    context: { ...validationContext, exportToYAML: { toTyped: false } },
    runtime: createPropertyStructuralReferenceRuntime(runtime),
  })
  if (!structuralReferences.ok) throw new Error(structuralReferences.message)
  const pendingReferences = structuralReferences.references.map(({
    setCanonical: _setCanonical,
    stageCanonical: _stageCanonical,
    commitStaged: _commitStaged,
    ...reference
  }) => reference)
  let localizedTextProperties = 0
  const localizedTextDiagnostics: Diagnostic[] = []
  traverseMetadataRuleYaml<{ readonly name: string | undefined }>({
    yaml: data,
    rule: adapter.formRule,
    initialState: { name: file.formName },
    onObject: ({ yaml, rule, yamlPath, state }) => {
      if (hasRawXmlAnomalyAtPath(data, parsed, yamlPath)) return
      localizedTextDiagnostics.push(...validateRuleYAMLObjectProperties({
        filePath: file.absolutePath,
        parsed,
        rule,
        context: validationContext,
        name: state.name,
        value: yaml,
        yamlPath,
        onLocalizedTextProperty: () => { localizedTextProperties += 1 },
      }))
    },
    enterCollectionItem: ({ itemName }) => ({ name: itemName }),
  })

  return {
    ...emptyFacts(),
    formDataPathIndex: index,
    structuredComponents: adapter.collectStructuredComponents(parsed.data, {
      kind: file.owner.dir,
      name: file.owner.name,
    }),
    pendingReferences,
    pendingChecks: collected.pendingChecks,
    localizedTextProperties,
    localValueValidationProfile: {
      [adapter.elementNamesProfileSubstep]: {
        items: 1,
        timeMs: collected.formElementNamesMs,
      },
    },
    diagnostics: [
      ...localizedTextDiagnostics,
      ...collected.formElementNameDiagnostics,
      ...index.duplicateDiagnostics,
    ],
  }
}

function createPropertyStructuralReferenceRuntime(runtime?: ValidationRegistrySet): StructuralReferenceRuntime {
  return {
    valueFromYAML: (params) => callAtomicFromYAML(
      params as Parameters<typeof callAtomicFromYAML>[0]
    ),
    valueToYAML: (params) => exportPropertyValueToYAML(
      params as Parameters<typeof exportPropertyValueToYAML>[0]
    ),
    collectStructuralReferences: (params) => {
      const propertyRule = params.propRule as PropertyRule
      const handler = runtime?.rules.execution.getTypeRule(propertyRule.type, "structuralReferences")
        ?? getTypeRule(propertyRule.type, "structuralReferences")
      return handler?.({ ...params, propRule: propertyRule })
    },
    collectIndexedReferences: (params) => {
      const propertyRule = params.propRule as PropertyRule
      const handler = runtime?.rules.execution.getTypeRule(propertyRule.type, "collectMetadataTargetReferences")
        ?? getTypeRule(propertyRule.type, "collectMetadataTargetReferences")
      return handler?.({ ...params, propRule: propertyRule }).references ?? []
    },
    nestedRule: (rule) => {
      const propertyRule = rule as PropertyRule
      const nested = runtime?.rules.execution.getTypeRule(propertyRule.type, "yamlToXMLNestedRule")
        ?? getTypeRule(propertyRule.type, "yamlToXMLNestedRule")
      return nested as unknown as StructuralReferenceNestedRule | undefined
    },
  }
}
function collectFormPendingChecks(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  value: Record<string, unknown>
  index: FormDataPathIndex
  yamlPath: readonly (string | number)[]
  tableContext?: { dataPath: string }
  runtime?: ValidationRegistrySet
}): {
  pendingChecks: DataPathValidationPendingCheck[]
  formElementNameDiagnostics: Diagnostic[]
  formElementNamesMs: number
} {
  const adapter = requireFormValidationAdapter()
  const nameCollector = adapter.createElementNameCollector({
    filePath: params.file.absolutePath,
    parsed: params.parsed,
  })
  const pendingChecks = collectNestedFormElementChecks({
    file: params.file,
    parsed: params.parsed,
    owner: params.value,
    properties: adapter.formRule.properties,
    index: params.index,
    cursor: { yamlPath: params.yamlPath, rulePath: [] },
    tableContext: params.tableContext,
    nameCollector,
    singletonRuleStack: new Set(),
    runtime: params.runtime,
  })
  const namesStartedAt = performance.now()
  const formElementNameDiagnostics = nameCollector.finish()
  return {
    pendingChecks,
    formElementNameDiagnostics,
    formElementNamesMs: performance.now() - namesStartedAt,
  }
}

function collectNestedFormElementChecks(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  owner: Record<string, unknown>
  properties: Record<string, PropertyRule>
  index: FormDataPathIndex
  cursor: YamlRuleCursor
  tableContext?: { dataPath: string }
  nameCollector?: FormElementNameCollectorView
  ownerName?: string
  singletonRuleStack: ReadonlySet<string>
  runtime?: ValidationRegistrySet
}): DataPathValidationPendingCheck[] {
  const checks: DataPathValidationPendingCheck[] = []
  for (const [propertyKey, propertyRule] of Object.entries(params.properties)) {
    if (typeof propertyRule.yaml !== "string") continue
    const nested = params.runtime?.rules.execution.getTypeRule(propertyRule.type, "nestedItemRule")
      ?? getTypeRule(propertyRule.type, "nestedItemRule")
    if (nested === undefined) continue
    const propertyCursor = enterYamlProperty({
      cursor: params.cursor,
      propertyKey,
      yamlKey: propertyRule.yaml,
    })
    const value = asRecord(params.owner[propertyRule.yaml])

    if ("itemRule" in nested) {
      const identity = params.runtime?.rules.execution.getTypeRule(propertyRule.type, "nestedItemIdentity")
        ?? getTypeRule(propertyRule.type, "nestedItemIdentity")
      const singletonName = identity?.resolveName(params.ownerName)
      if (singletonName !== undefined && singletonName.length > 0) {
        params.nameCollector?.acceptReserved({
          name: singletonName,
          path: params.cursor.yamlPath,
          ...(params.ownerName === undefined ? {} : { ownerName: params.ownerName }),
          propertyName: propertyRule.yaml,
        })
      }

      const singletonRuleStack = new Set(params.singletonRuleStack)
      const canRecurseNames = !singletonRuleStack.has(nested.itemRule.itemType)
      if (canRecurseNames) singletonRuleStack.add(nested.itemRule.itemType)

      if (value === undefined) {
        if (singletonName === undefined || !canRecurseNames) continue
        checks.push(
          ...collectNestedFormElementChecks({
            ...params,
            owner: {},
            properties: nested.itemRule.properties,
            cursor: params.cursor,
            ownerName: singletonName,
            singletonRuleStack,
            nameCollector: params.nameCollector,
          })
        )
        continue
      }

      if (!("enterpriseField" in nested.itemRule)) {
        checks.push(
          ...collectNestedFormElementChecks({
            ...params,
            owner: value,
            properties: nested.itemRule.properties,
            cursor: enterNestedYamlRule(propertyCursor, nested.itemRule.itemType),
            ...(singletonName === undefined ? {} : { ownerName: singletonName }),
            singletonRuleStack,
            nameCollector: identity === undefined ? undefined : params.nameCollector,
          })
        )
        continue
      }
      checks.push(
        ...collectFormElementChecks({
          ...params,
          owner: value,
          rule: nested.itemRule as ReturnType<typeof getElementRule>,
          cursor: enterNestedYamlRule(propertyCursor, nested.itemRule.itemType),
          ...(singletonName === undefined ? {} : { ownerName: singletonName }),
          singletonRuleStack,
          nameCollector: identity === undefined ? undefined : params.nameCollector,
        })
      )
      continue
    }

    if (value === undefined) continue
    for (const [name, rawElement] of Object.entries(value)) {
      const element = asRecord(rawElement)
      if (element === undefined) continue
      const elementCursor = {
        ...propertyCursor,
        yamlPath: [...propertyCursor.yamlPath, name],
      }
      params.nameCollector?.acceptExplicit({ name, path: elementCursor.yamlPath })
      const elementType = elementTypeFromYaml(element["Вид"], params.tableContext)
      if (elementType === undefined) continue
      const itemRule = nested.resolveItemRule(elementType)
      if (!("enterpriseField" in itemRule)) {
        checks.push(
          ...collectNestedFormElementChecks({
            ...params,
            owner: element,
            properties: itemRule.properties,
            cursor: enterNestedYamlRule(elementCursor, elementType),
            ownerName: name,
          })
        )
        continue
      }
      checks.push(
        ...collectFormElementChecks({
          ...params,
          owner: element,
          rule: itemRule as ReturnType<typeof getElementRule>,
          cursor: enterNestedYamlRule(elementCursor, elementType),
          ownerName: name,
        })
      )
    }
  }
  return checks
}

function collectFormElementChecks(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  owner: Record<string, unknown>
  rule: ReturnType<typeof getElementRule>
  index: FormDataPathIndex
  cursor: YamlRuleCursor
  tableContext?: { dataPath: string }
  nameCollector?: FormElementNameCollectorView
  ownerName?: string
  singletonRuleStack: ReadonlySet<string>
  runtime?: ValidationRegistrySet
}): DataPathValidationPendingCheck[] {
  const itemChecks = collectRuleDataPathChecks({
    file: params.file,
    parsed: params.parsed,
    owner: params.owner,
    properties: params.rule.properties,
    index: params.index,
    cursor: params.cursor,
    elementType: params.rule.itemType,
    tableContext: params.tableContext,
    runtime: params.runtime,
  })
  const childTableContext = tableContextForChildren(params.rule.itemType, itemChecks, params.tableContext)
  return [
    ...itemChecks,
    ...collectNestedFormElementChecks({
      ...params,
      owner: params.owner,
      properties: params.rule.properties,
      cursor: params.cursor,
      tableContext: childTableContext,
    }),
  ]
}

function collectRuleDataPathChecks(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  owner: Record<string, unknown>
  properties: Record<string, PropertyRule>
  index: FormDataPathIndex
  cursor: YamlRuleCursor
  elementType: ElementType
  tableContext?: { dataPath: string }
  runtime?: ValidationRegistrySet
}): DataPathValidationPendingCheck[] {
  const checks: DataPathValidationPendingCheck[] = []
  for (const [propertyKey, rule] of Object.entries(params.properties)) {
    if (!isDataPathRule(rule) || typeof rule.yaml !== "string") continue

    const rawValue = params.owner[rule.yaml]
    if (typeof rawValue !== "string") continue
    const value = rawValue
    if (value.trim().length === 0) continue
    const yamlPath = enterYamlProperty({ cursor: params.cursor, propertyKey, yamlKey: rule.yaml }).yamlPath
    checks.push({
      kind: "dataPath",
      yamlPath,
      location: yamlDiagnosticLocationAtPath({
        filePath: params.file.absolutePath,
        parsed: params.parsed,
        path: yamlPath,
      }),
      owner: { kind: params.file.owner.dir, name: params.file.owner.name },
      value,
      ...(hasSemanticXmlAnomalyAtExactPath(params.parsed.data, params.parsed, yamlPath)
        ? { xmlAnomaly: "pending" as const }
        : {}),
      nameMode: "yaml",
      index: params.index,
      policyInput: toDataPathPolicyInput(rule),
      elementType: params.elementType,
      ...(params.owner["КартинкаЗначений"] === undefined ? {} : { hasValuesPicture: true }),
      ...(params.tableContext !== undefined && rule.yaml === "ПутьКДанным"
        ? { tableContext: params.tableContext }
        : {}),
      policy: "formDataPath",
    })
  }
  return checks
}

function tableContextForChildren(
  elementType: ElementType,
  checks: readonly DataPathValidationPendingCheck[],
  currentContext: { dataPath: string } | undefined
): { dataPath: string } | undefined {
  if (elementType !== "Table") return currentContext
  return checks.find((check) => check.policyInput.yaml === "ПутьКДанным")?.value === undefined
    ? currentContext
    : { dataPath: checks.find((check) => check.policyInput.yaml === "ПутьКДанным")!.value }
}

function elementTypeFromYaml(value: unknown, tableContext: { dataPath: string } | undefined): ElementType | undefined {
  return requireFormValidationAdapter().elementTypeFromYAML(value, tableContext)
}

function isDataPathRule(rule: PropertyRule): rule is DataPathPropertyRule {
  return rule.type === "DataPath"
}

function valueAtPath(value: Record<string, unknown>, path: readonly (string | number)[]): unknown {
  let current: unknown = value
  for (const segment of path) {
    if (current === null || typeof current !== "object") return undefined
    current = (current as Record<string | number, unknown>)[segment]
  }
  return current
}

function hasXmlAnomalyAtPath(
  root: unknown,
  parsed: ParsedYaml,
  path: readonly (string | number)[],
): boolean {
  return hasXmlAnnotationAtPath(root, parsed, path, () => true)
}

function hasRawXmlAnomalyAtPath(
  root: unknown,
  parsed: ParsedYaml,
  path: readonly (string | number)[],
): boolean {
  return hasXmlAnnotationAtPath(root, parsed, path, (annotation) => annotation.kind === "raw")
}

function hasSemanticXmlAnomalyAtExactPath(
  root: unknown,
  parsed: ParsedYaml,
  path: readonly (string | number)[],
): boolean {
  if (path.length === 0) {
    const annotation = parsed.annotations.root()
    return annotation?.kind === "invalid" || annotation?.kind === "important"
  }
  let parent = root
  for (const segment of path.slice(0, -1)) {
    if (typeof parent !== "object" || parent === null) return false
    const runtimeSegment = runtimePathSegment(parent, segment, parsed)
    parent = (parent as Record<string | number, unknown>)[runtimeSegment]
  }
  if (typeof parent !== "object" || parent === null) return false
  const runtimeSegment = runtimePathSegment(parent, path.at(-1)!, parsed)
  const annotation = parsed.annotations.at(parent, runtimeSegment)
  const semantic = annotation?.kind === "raw" ? annotation.semantic : annotation
  return semantic?.kind === "invalid" || semantic?.kind === "important"
}

function hasXmlAnnotationAtPath(
  root: unknown,
  parsed: ParsedYaml,
  path: readonly (string | number)[],
  matches: (annotation: NonNullable<ReturnType<ParsedYaml["annotations"]["root"]>>) => boolean,
): boolean {
  const rootAnnotation = parsed.annotations.root()
  if (rootAnnotation !== undefined && matches(rootAnnotation)) return true
  let parent = root
  for (const segment of path) {
    if (typeof parent !== "object" || parent === null) return false
    const runtimeSegment = runtimePathSegment(parent, segment, parsed)
    const valueAnnotation = parsed.annotations.at(parent, runtimeSegment)
    if (valueAnnotation !== undefined && matches(valueAnnotation)) return true
    const keyAnnotation = typeof runtimeSegment === "string"
      ? parsed.annotations.keyAt(parent, runtimeSegment)
      : undefined
    if (keyAnnotation !== undefined && matches(keyAnnotation)) return true
    parent = (parent as Record<string | number, unknown>)[runtimeSegment]
  }
  return false
}

function valueAtLogicalPath(
  value: Record<string, unknown>,
  path: readonly (string | number)[],
  parsed: ParsedYaml,
): unknown {
  let current: unknown = value
  for (const segment of path) {
    if (typeof current !== "object" || current === null) return undefined
    const runtimeSegment = runtimePathSegment(current, segment, parsed)
    current = (current as Record<string | number, unknown>)[runtimeSegment]
  }
  return current
}

function runtimePathSegment(
  parent: object,
  segment: string | number,
  parsed: ParsedYaml,
): string | number {
  if (typeof segment === "number" || Array.isArray(parent)) return segment
  const record = parent as Record<string, unknown>
  if (Object.prototype.hasOwnProperty.call(record, segment)) return segment
  const matches = Object.keys(record).filter((runtimeKey) =>
    parsed.annotations.keyAt(parent, runtimeKey)?.logicalKey === segment
  )
  return matches.length === 1 ? matches[0]! : segment
}

function withoutRawDescendants(value: unknown, parsed: ParsedYaml): unknown {
  const firstAnnotation = parsed.annotations.entries()[Symbol.iterator]().next()
  if (parsed.annotations.root() === undefined && firstAnnotation.done === true) return value
  return projectWithoutRawDescendants(value, parsed)
}

function projectWithoutRawDescendants(value: unknown, parsed: ParsedYaml): unknown {
  if (typeof value !== "object" || value === null) return value
  if (Array.isArray(value)) {
    let changed = false
    const projected: unknown[] = []
    for (let index = 0; index < value.length; index += 1) {
      if (parsed.annotations.at(value, index)?.kind === "raw") {
        changed = true
        continue
      }
      const child = projectWithoutRawDescendants(value[index], parsed)
      changed ||= child !== value[index]
      projected.push(child)
    }
    if (!changed) return value
    parsed.annotations.copy(value, projected)
    return projected
  }
  let changed = false
  const projected: Record<string, unknown> = {}
  for (const [key, childValue] of Object.entries(value)) {
    if (
      parsed.annotations.at(value, key)?.kind === "raw"
      || parsed.annotations.keyAt(value, key)?.kind === "raw"
    ) {
      changed = true
      continue
    }
    const child = projectWithoutRawDescendants(childValue, parsed)
    changed ||= child !== childValue
    projected[key] = child
  }
  if (!changed) return value
  parsed.annotations.copy(value, projected)
  return projected
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
