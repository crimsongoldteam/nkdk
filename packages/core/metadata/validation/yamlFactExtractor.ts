import { parseMetadataTargetFromYAML } from "../orchestration/metadataTarget"
import { rootFromYAML } from "../orchestration/metadataTarget/roots"
import type { MetadataTargetOwner, ParsedMetadataTarget } from "../orchestration/metadataTarget/types"
import type { ElementType } from "../orchestration/formElement/types"
import type { DataPathPropertyRule, PropertyRule } from "../orchestration/property/types"
import { callAtomicFromYAML } from "../orchestration/property/fromYAMLToXML"
import { exportPropertyValueToYAML } from "../orchestration/property/toYAML"
import { getElementRule } from "../orchestration/formElement/ruleFactory"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import { getSystemEnumeration } from "../orchestration/property/systemEnumerationRegistry"
import { enterNestedYamlRule, enterYamlProperty } from "../orchestration/property/yamlRuleCursor"
import type { YamlRuleCursor } from "../orchestration/property/importYamlTypes"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import type { FormDataPathIndex } from "./dataPath/formIndex"
import { buildObjectFieldIndex, type ObjectFieldIndex } from "./dataPath/objectFields"
import { ownerFactFromYAML, type ValidationOwnerFacts } from "./dataPath/ownerFacts"
import {
  projectMemberIndexKey,
  projectObjectIndexKey,
  projectValueIndexKey,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
  type ProjectValueIndexEntry,
} from "./projectReferenceIndex"
import type { ValidationProjectFile } from "./projectFiles"
import type { ValidationPendingCheck } from "./projectValidationPendingChecks"
import { toDataPathPolicyInput } from "./dataPath/policies"
import {
  findValidationRulesSpec,
  type ValidationRulesSnapshot,
  type ValidationRulesSpecSnapshot,
} from "./rulesSnapshot"
import {
  collectStructuralYamlReferences,
  type StructuralReferenceNestedRule,
  type StructuralReferenceRuntime,
} from "./structuralReferences"
import { validateExcludedEqualNameYAML } from "./excludeIfEqualNameYAML"
import { diagnosticAtYamlPath, yamlDiagnosticLocationAtPath } from "./yamlLocations"
import type { Diagnostic } from "./types"
import { createLocalIndexesCollector } from "../project/localIndexes"
import type { LocalIndexesCollector } from "../project/localIndexes"
import { validateRegisteredLocalYamlValue } from "./yamlValueValidationRegistry"
import {
  analyzeDependentYamlItem,
  type DependentReferenceCandidate,
} from "../orchestration/property/dependentItemRegistry"
import type { MetadataItemRule } from "../orchestration/property/types"
import { createFormDataPathIndexFromYAML } from "./dataPath/formYamlIndex"
import { getRegisteredFormDataPathMetadataProjection } from "./formDataPathProjectionRegistry"
import type { FormElementNameCollectorView } from "./formContracts"
import { requireFormValidationAdapter } from "./formValidationRegistry"

export type LocalValueValidationProfile = Record<string, { items: number; timeMs: number }>

export interface ValidationYamlFacts {
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  pendingChecks: ValidationPendingCheck[]
  diagnostics: Diagnostic[]
  localValueValidationProfile: LocalValueValidationProfile
  fieldIndex?: ObjectFieldIndex
  formDataPathIndex?: FormDataPathIndex
  localIndexes?: ReturnType<LocalIndexesCollector["finish"]>
}

export interface ValidationOwnerYamlFacts {
  fieldIndex: ObjectFieldIndex
  ownerFacts: ValidationOwnerFacts
}

export function extractValidationYamlFacts(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  rulesSnapshot: ValidationRulesSnapshot
  validationDiagnostics?: boolean
}): ValidationYamlFacts {
  const validationDiagnostics = params.validationDiagnostics !== false
  if (params.file.kind === "form") {
    return validationDiagnostics ? extractFormYamlFacts(params.file, params.parsed) : emptyFacts()
  }

  const spec = findValidationRulesSpec(params.rulesSnapshot, params.file.owner.dir)
  const objectTarget = spec === undefined ? undefined : objectTargetForProjectFile(params.file, spec)
  const owner =
    objectTarget === undefined ? undefined : { root: objectTarget.root, objectName: objectTarget.objectName }
  const referenceDiagnostics: Diagnostic[] = []
  const localValueDiagnostics: Diagnostic[] = []
  const localValueValidationProfile: LocalValueValidationProfile = {}
  if (validationDiagnostics) {
    collectLocalValueValidation({
      filePath: params.file.absolutePath,
      parsed: params.parsed,
      owner: params.file.owner,
      type: params.file.itemType,
      value: params.parsed.data,
      yamlPath: [],
      diagnostics: localValueDiagnostics,
      profile: localValueValidationProfile,
    })
  }
  const localIndexesCollector = createLocalIndexesCollector({ recordEvents: false })
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
          rootRule: params.file.owner.spec.rule,
          validationDiagnostics,
        })
  const localIndexes = localIndexesCollector.finish()
  return {
    objectIndexEntries:
      objectTarget === undefined
        ? []
        : [
            {
              canonical: projectObjectIndexKey(objectTarget),
              target: objectTarget,
              result: {
                ok: true,
                filePath: params.file.absolutePath,
                details: objectIndexDetails(params.parsed.data),
              },
            },
          ],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences,
    pendingChecks: [],
    diagnostics: validationDiagnostics
      ? [
          ...referenceDiagnostics,
          ...localValueDiagnostics,
          ...(spec === undefined ? [] : collectUniqueNameScopeDiagnostics(params.file, params.parsed, spec)),
        ]
      : [],
    localValueValidationProfile,
    localIndexes,
  }
}

export function extractValidationOwnerYamlFacts(params: {
  file: ValidationProjectFile
  data: unknown
  rulesSnapshot: ValidationRulesSnapshot
}): ValidationOwnerYamlFacts | undefined {
  const spec = findValidationRulesSpec(params.rulesSnapshot, params.file.owner.dir)
  return spec === undefined ? undefined : buildOwnerFactsFromYaml(params.file, params.data, spec)
}

function objectTargetForProjectFile(
  file: ValidationProjectFile,
  spec: ValidationRulesSpecSnapshot
): Extract<ParsedMetadataTarget, { kind: "object" }> | undefined {
  const root = spec.metadataTargetOwner?.kind === "self" ? spec.metadataTargetOwner.root : spec.root
  if (!root || file.owner.name.length === 0) return undefined

  if (spec.nesting?.kind !== "recursiveChildDir") {
    return {
      kind: "object",
      root,
      objectName: file.owner.name,
    }
  }

  const parts = file.projectPath.split("/")
  if (parts[0] !== file.owner.dir || parts[parts.length - 1] !== "Свойства.yaml") return undefined
  const rootObjectName = parts[1]
  if (rootObjectName === undefined || rootObjectName.length === 0) return undefined
  const nestedNames: string[] = []
  for (let index = 2; index < parts.length - 2; index += 2) {
    if (parts[index] !== spec.nesting.childDir) return undefined
    const objectName = parts[index + 1]
    if (objectName === undefined || objectName.length === 0) return undefined
    nestedNames.push(objectName)
  }

  return {
    kind: "object",
    root,
    objectName: rootObjectName,
    segments: nestedNames.map((objectName) => ({ kind: root, objectName })),
  }
}

function objectIndexDetails(data: unknown): { type?: string } {
  const type = metadataRecord(data)["Тип"]
  return typeof type === "string" ? { type } : {}
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
  }
}

function buildOwnerFactsFromYaml(
  file: ValidationProjectFile,
  data: unknown,
  spec: ValidationRulesSpecSnapshot
): ValidationOwnerYamlFacts {
  const record = asRecord(data) ?? {}
  const compactFacts: Record<string, unknown> = {}

  for (const property of spec.properties) {
    if (property.ownerFactRole === undefined) continue
    const value = valueAtPath(record, property.yamlPath)
    const fact = ownerFactFromYAML(property.ownerFactRole, value)
    if (fact !== undefined) compactFacts[property.ownerFactRole] = fact
  }

  const ref = { kind: file.owner.dir, name: file.owner.name }
  const ownerFactsWithoutIndex = {
    ref,
    filePath: file.absolutePath,
    fieldIndex: emptyObjectFieldIndex(),
    ...compactFacts,
  } as ValidationOwnerFacts
  const fieldIndex = buildObjectFieldIndex({
    ref,
    facts: ownerFactsWithoutIndex,
    rule: file.owner.spec.rule,
  })
  return {
    fieldIndex,
    ownerFacts: { ...ownerFactsWithoutIndex, fieldIndex },
  }
}

function emptyObjectFieldIndex(): ObjectFieldIndex {
  return { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
}

function collectUniqueNameScopeDiagnostics(
  file: ValidationProjectFile,
  parsed: ParsedYaml,
  spec: ValidationRulesSpecSnapshot
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

function yamlPathByModelKey(spec: ValidationRulesSpecSnapshot, modelKey: string): readonly string[] | undefined {
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
}): void {
  const result = validateRegisteredLocalYamlValue({
    type: params.type,
    filePath: params.filePath,
    parsed: params.parsed,
    owner: { dir: params.owner.dir, name: params.owner.name },
    value: params.value,
    yamlPath: params.yamlPath,
  })
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
  rulePath: readonly { propertyKey: string }[]
  rootYaml: unknown
  rootRule: MetadataItemRule
  validationDiagnostics: boolean
}): PendingMetadataTargetReference[] {
  const record = asRecord(params.value)
  if (record === undefined) return []

  const references: PendingMetadataTargetReference[] = []
  for (const property of params.properties) {
    const value = valueAtPath(record, property.yamlPath)
    if (value === undefined) continue
    const yamlPath = [...params.yamlPath, ...property.yamlPath]
    const rulePath = [...params.rulePath, { propertyKey: property.modelKey }]
    if (property.type !== undefined) {
      if (params.validationDiagnostics) {
        collectLocalValueValidation({
          filePath: params.filePath,
          parsed: params.parsed,
          owner: params.fileOwner,
          type: property.type,
          value,
          yamlPath,
          diagnostics: params.localValueDiagnostics,
          profile: params.localValueValidationProfile,
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
        source: yamlDiagnosticLocationAtPath({ filePath: params.filePath, parsed: params.parsed, path: yamlPath }),
      })
    }

    if (property.metadataTarget !== undefined) {
      references.push(
        ...collectTargetValues({
          filePath: params.filePath,
          parsed: params.parsed,
          owner: params.owner,
          value,
          type: property.type,
          constraint: property.metadataTarget,
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
  rulePath: readonly { propertyKey: string }[]
  rootYaml: unknown
  rootRule: MetadataItemRule
  nestedItemType?: string
  validationDiagnostics: boolean
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
    const analysis = analyzeDependentYamlItem({
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
    references.push(
      ...analysis.references.map((reference) => ({
        ...dependentPendingReference(reference),
        filePath: params.filePath,
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
}): PendingMetadataTargetReference[] {
  if (params.type === "Picture") {
    return collectPictureTargetValues(params)
  }

  if (typeof params.value === "string") {
    const reference = pendingReferenceFromYamlValue({ ...params, value: params.value, yamlPath: params.yamlPath })
    return reference === undefined ? [] : [reference]
  }

  if (Array.isArray(params.value)) {
    return params.value.flatMap((item, index) =>
      collectTargetValues({ ...params, value: item, yamlPath: [...params.yamlPath, index] })
    )
  }

  return []
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
}): PendingMetadataTargetReference | undefined {
  if (params.value in (getSystemEnumeration("PictureLib")?.fromYAML ?? {})) return undefined
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
  }
}

function targetKey(target: ParsedMetadataTarget): string {
  if (target.kind === "object") return projectObjectIndexKey(target)
  if (target.kind === "member") return projectMemberIndexKey(target)
  return projectValueIndexKey(target)
}

function extractFormYamlFacts(file: ValidationProjectFile, parsed: ParsedYaml): ValidationYamlFacts {
  const data = asRecord(parsed.data)
  if (data === undefined) return emptyFacts()

  const adapter = requireFormValidationAdapter()
  const projection = getRegisteredFormDataPathMetadataProjection()
  if (projection === undefined) throw new Error("Не зарегистрирована проекция индекса формы")
  const index = createFormDataPathIndexFromYAML(parsed.data, projection)
  const collected = collectFormPendingChecks({
    file,
    parsed,
    value: data,
    index,
    yamlPath: [],
  })
  const root = rootFromYAML[file.owner.dir]
  const structuralReferences = collectStructuralYamlReferences({
    filePath: file.absolutePath,
    parsed,
    rule: adapter.formRule,
    yaml: data,
    owner: root === undefined ? undefined : { root, objectName: file.owner.name },
    context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
    runtime: createPropertyStructuralReferenceRuntime(),
  })
  if (!structuralReferences.ok) throw new Error(structuralReferences.message)
  const pendingReferences = structuralReferences.references.map(({
    setCanonical: _setCanonical,
    stageCanonical: _stageCanonical,
    commitStaged: _commitStaged,
    ...reference
  }) => reference)

  return {
    ...emptyFacts(),
    formDataPathIndex: index,
    pendingReferences,
    pendingChecks: collected.pendingChecks,
    localValueValidationProfile: {
      [adapter.elementNamesProfileSubstep]: {
        items: 1,
        timeMs: collected.formElementNamesMs,
      },
    },
    diagnostics: [
      ...validateExcludedEqualNameYAML({
        filePath: file.absolutePath,
        parsed,
        rule: adapter.formRule,
        context: { version: "2.20", defaultLanguage: "ru" },
        name: file.formName,
      }),
      ...collected.formElementNameDiagnostics,
      ...index.duplicateDiagnostics,
    ],
  }
}

function createPropertyStructuralReferenceRuntime(): StructuralReferenceRuntime {
  return {
    valueFromYAML: (params) => callAtomicFromYAML(
      params as Parameters<typeof callAtomicFromYAML>[0]
    ),
    valueToYAML: (params) => exportPropertyValueToYAML(
      params as Parameters<typeof exportPropertyValueToYAML>[0]
    ),
    collectStructuralReferences: (params) => {
      const propertyRule = params.propRule as PropertyRule
      const handler = getTypeRule(propertyRule.type, "structuralReferences")
      return handler?.({ ...params, propRule: propertyRule })
    },
    collectIndexedReferences: (params) => {
      const propertyRule = params.propRule as PropertyRule
      const handler = getTypeRule(propertyRule.type, "collectMetadataTargetReferences")
      return handler?.({ ...params, propRule: propertyRule }).references ?? []
    },
    nestedRule: (rule) => getTypeRule(
      (rule as PropertyRule).type,
      "yamlToXMLNestedRule"
    ) as unknown as StructuralReferenceNestedRule | undefined,
  }
}
function collectFormPendingChecks(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  value: Record<string, unknown>
  index: FormDataPathIndex
  yamlPath: readonly (string | number)[]
  tableContext?: { dataPath: string }
}): {
  pendingChecks: ValidationPendingCheck[]
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
}): ValidationPendingCheck[] {
  const checks: ValidationPendingCheck[] = []
  for (const [propertyKey, propertyRule] of Object.entries(params.properties)) {
    if (typeof propertyRule.yaml !== "string") continue
    const nested = getTypeRule(propertyRule.type, "nestedItemRule")
    if (nested === undefined) continue
    const propertyCursor = enterYamlProperty({
      cursor: params.cursor,
      propertyKey,
      yamlKey: propertyRule.yaml,
    })
    const value = asRecord(params.owner[propertyRule.yaml])

    if ("itemRule" in nested) {
      const identity = getTypeRule(propertyRule.type, "nestedItemIdentity")
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
}): ValidationPendingCheck[] {
  const itemChecks = collectRuleDataPathChecks({
    file: params.file,
    parsed: params.parsed,
    owner: params.owner,
    properties: params.rule.properties,
    index: params.index,
    cursor: params.cursor,
    elementType: params.rule.itemType,
    tableContext: params.tableContext,
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
}): ValidationPendingCheck[] {
  const checks: ValidationPendingCheck[] = []
  for (const [propertyKey, rule] of Object.entries(params.properties)) {
    if (!isDataPathRule(rule) || typeof rule.yaml !== "string") continue

    const value = params.owner[rule.yaml]
    if (typeof value !== "string" || value.trim().length === 0) continue
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
  checks: readonly ValidationPendingCheck[],
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

function valueAtPath(value: Record<string, unknown>, path: readonly string[]): unknown {
  let current: unknown = value
  for (const segment of path) {
    const record = asRecord(current)
    if (record === undefined) return undefined
    current = record[segment]
  }
  return current
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
