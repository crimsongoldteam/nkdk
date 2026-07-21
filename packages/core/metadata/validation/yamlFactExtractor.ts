import { parseMetadataTargetFromYAML } from "../commonObjects/metadataTargets"
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { MetadataTargetOwner, ParsedMetadataTarget } from "../commonObjects/metadataTargets/types"
import type { TypeDescription } from "../commonObjects/typeDescription/types"
import { CollectableElementTypeFromYAML, type ElementType } from "../forms/elements/orchestration/types"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type { DataPathPropertyRule, PropertyRule } from "../orchestration/property/types"
import { getElementRule } from "../orchestration/formElement/ruleFactory"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import { enterNestedYamlRule, enterYamlProperty } from "../orchestration/property/yamlRuleCursor"
import type { YamlRuleCursor } from "../orchestration/property/importYamlTypes"
import { CommonAttributeUseFromYAML, PictureLibFromYAML, type CommonAttributeUseYAML } from "../systemEnumerations/types"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import { typeDescriptionToDataPathTypeInfo } from "./dataPath/typeDescription"
import { createFormDataPathIndexCollector, typeDescriptionFromYAML } from "./dataPath/formYamlIndex"
import type { FormDataPathIndex } from "./dataPath/formIndex"
import { buildObjectFieldIndex, type ObjectField, type ObjectFieldIndex } from "./dataPath/objectFields"
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
import {
  findValidationRulesSpec,
  type ValidationRulesSnapshot,
  type ValidationRulesSpecSnapshot,
} from "./rulesSnapshot"
import { validateExcludedEqualNameYAML } from "./excludeIfEqualNameYAML"
import { diagnosticAtYamlPath, yamlDiagnosticLocationAtPath } from "./yamlLocations"
import type { Diagnostic } from "./types"
import { createLocalIndexesCollector } from "../project/localIndexes"
import type { LocalIndexesCollector } from "../project/localIndexes"

export interface ValidationYamlFacts {
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  pendingChecks: ValidationPendingCheck[]
  diagnostics: Diagnostic[]
  fieldIndex?: ObjectFieldIndex
  ownerModelStub?: Record<string, unknown>
  localIndexes?: ReturnType<LocalIndexesCollector["finish"]>
}

export type ValidationOwnerYamlFacts = Pick<ValidationYamlFacts, "fieldIndex" | "ownerModelStub">

export function extractValidationYamlFacts(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  rulesSnapshot: ValidationRulesSnapshot
}): ValidationYamlFacts {
  if (params.file.kind === "form") {
    return extractFormYamlFacts(params.file, params.parsed)
  }

  const spec = findValidationRulesSpec(params.rulesSnapshot, params.file.owner.dir)
  const objectTarget = spec === undefined ? undefined : objectTargetForProjectFile(params.file, spec)
  const owner =
    objectTarget === undefined ? undefined : { root: objectTarget.root, objectName: objectTarget.objectName }
  const referenceDiagnostics: Diagnostic[] = []
  const localIndexesCollector = createLocalIndexesCollector()
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
          collector: localIndexesCollector,
          rulePath: [],
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
    diagnostics: [...referenceDiagnostics, ...(spec === undefined ? [] : collectUniqueNameScopeDiagnostics(params.file, params.parsed, spec))],
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
  }
}

function buildOwnerFactsFromYaml(
  file: ValidationProjectFile,
  data: unknown,
  spec: ValidationRulesSpecSnapshot
): Pick<ValidationYamlFacts, "fieldIndex" | "ownerModelStub"> {
  const model = syntheticModelFromYaml(file, data, spec)
  return {
    ownerModelStub: model,
    fieldIndex: buildObjectFieldIndexFromSyntheticModel(file, model),
  }
}

function syntheticModelFromYaml(
  file: ValidationProjectFile,
  data: unknown,
  spec: ValidationRulesSpecSnapshot
): Record<string, unknown> {
  const record = asRecord(data) ?? {}
  const model: Record<string, unknown> = {
    itemType: spec.itemType,
    name: file.owner.name,
  }

  for (const property of spec.properties) {
    const value = valueAtPath(record, property.yamlPath)
    if (value === undefined) continue
    if (
      property.modelKey === "attributes" ||
      property.modelKey === "dimensions" ||
      property.modelKey === "resources" ||
      property.modelKey === "addressingAttributes" ||
      property.modelKey === "commands" ||
      property.modelKey === "accountingFlags" ||
      property.modelKey === "extDimensionAccountingFlags"
    ) {
      model[property.modelKey] = namedTypedItemsFromYaml(value)
      continue
    }
    if (property.modelKey === "tabularSections") {
      model[property.modelKey] = tabularSectionsFromYaml(value)
      continue
    }
    if (property.modelKey === "owners") {
      model[property.modelKey] = metadataLinksFromYaml(value)
      continue
    }
    if (property.modelKey === "registerRecords") {
      model[property.modelKey] = metadataLinksFromYaml(value)
      continue
    }
    if (property.modelKey === "chartOfAccounts" && typeof value === "string") {
      model[property.modelKey] = value
      continue
    }
    if (property.modelKey === "content") {
      model[property.modelKey] = commonAttributeContentFromYaml(value)
      continue
    }
    if (property.modelKey === "task") {
      const link = taskLinkFromYaml(value)
      if (link !== undefined) model[property.modelKey] = link
      continue
    }
    if (property.modelKey === "type") {
      model[property.modelKey] = typeDescriptionFromYAML(value)
      continue
    }
  }

  return model
}

function buildObjectFieldIndexFromSyntheticModel(
  file: ValidationProjectFile,
  model: Record<string, unknown>
): ObjectFieldIndex {
  const index = buildObjectFieldIndex({
    ref: { kind: file.owner.dir, name: file.owner.name },
    facts: model as never,
    rule: file.owner.spec.rule,
  })
  const fields = new Map<string, ObjectField>(index.fields)
  for (const collection of [
    ["attributes", "attribute"],
    ["dimensions", "dimension"],
    ["resources", "resource"],
    ["addressingAttributes", "addressingAttribute"],
  ] as const) {
    const collectionValue = model[collection[0]]
    const items: unknown[] = Array.isArray(collectionValue) ? collectionValue : []
    for (const item of items) {
      const record = asRecord(item)
      if (record === undefined || typeof record["name"] !== "string") continue
      fields.set(record["name"], {
        name: record["name"],
        kind: collection[1],
        sourceCollection: collection[0],
        typeInfo: typeDescriptionToDataPathTypeInfo(record["type"] as TypeDescription | undefined),
      })
    }
  }

  for (const item of Array.isArray(model["tabularSections"]) ? model["tabularSections"] : []) {
    const record = asRecord(item)
    if (record === undefined || typeof record["name"] !== "string") continue
    const columns = new Map<string, ObjectField>()
    for (const attribute of Array.isArray(record["attributes"]) ? record["attributes"] : []) {
      const attributeRecord = asRecord(attribute)
      if (attributeRecord === undefined || typeof attributeRecord["name"] !== "string") continue
      columns.set(attributeRecord["name"], {
        name: attributeRecord["name"],
        kind: "attribute",
        sourceCollection: "attributes",
        typeInfo: typeDescriptionToDataPathTypeInfo(attributeRecord["type"] as TypeDescription | undefined),
      })
    }
    addTabularSectionStandardColumns(columns)
    const table = {
      kind: "TabularSection" as const,
      owner: { kind: file.owner.dir, name: file.owner.name },
      name: record["name"],
    }
    fields.set(record["name"], {
      name: record["name"],
      kind: "tabularSection",
      sourceCollection: "tabularSections",
      typeInfo: { kinds: ["tableSource"], nextTypes: [], table },
      tableSource: { table, columns, hasColumns: columns.size > 0 },
    })
  }

  return { fields, standardAttributeAliases: index.standardAttributeAliases, diagnostics: index.diagnostics }
}

function addTabularSectionStandardColumns(columns: Map<string, ObjectField>): void {
  const lineNumber: ObjectField = {
    name: "НомерСтроки",
    targetName: "LineNumber",
    kind: "standardAttribute",
    sourceCollection: "standardAttributes",
    typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "TabularSection.LineNumber" },
  }
  columns.set("LineNumber", lineNumber)
  columns.set("НомерСтроки", lineNumber)
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

function yamlPathByModelKey(
  spec: ValidationRulesSpecSnapshot,
  modelKey: string
): readonly string[] | undefined {
  return spec.properties.find((property) => property.modelKey === modelKey)?.yamlPath
}

function namedTypedItemsFromYaml(value: unknown): Array<{ name: string; type?: TypeDescription }> {
  const record = asRecord(value)
  return Object.entries(record ?? {}).map(([name, item]) => ({
    name,
    ...(typeDescriptionFromYAML(asRecord(item)?.["Тип"]) === undefined
      ? {}
      : { type: typeDescriptionFromYAML(asRecord(item)?.["Тип"]) }),
  }))
}

function tabularSectionsFromYaml(
  value: unknown
): Array<{ name: string; attributes: Array<{ name: string; type?: TypeDescription }> }> {
  const record = asRecord(value)
  return Object.entries(record ?? {}).map(([name, item]) => ({
    name,
    attributes: namedTypedItemsFromYaml(asRecord(item)?.["Реквизиты"]),
  }))
}

function metadataLinksFromYaml(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string").map(metadataLinkFromYaml)
}

function metadataLinkFromYaml(value: string): string {
  const normalized = normalizeMetadataLinkFromYaml(value)
  const dotIndex = normalized.indexOf(".")
  if (dotIndex === -1) return normalized

  const root = normalized.substring(0, dotIndex)
  return `${rootFromYAML[root] ?? root}${normalized.substring(dotIndex)}`
}

function normalizeMetadataLinkFromYaml(value: string): string {
  for (const [from, to] of [
    ["Справочники.", "Справочник."],
    ["ПланыВидовРасчета.", "ПланВидовРасчета."],
  ] as const) {
    if (value.startsWith(from)) return `${to}${value.slice(from.length)}`
  }

  return value
}

function taskLinkFromYaml(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined
  if (value.includes(".")) return metadataLinkFromYaml(value)
  return `Task.${value}`
}

function commonAttributeContentFromYaml(value: unknown): Array<{ metadata: string; use: string }> {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    const record = asRecord(item)
    if (record === undefined || typeof record["Объект"] !== "string") return []
    const use =
      typeof record["Использование"] === "string" && isCommonAttributeUseYAML(record["Использование"])
        ? CommonAttributeUseFromYAML[record["Использование"]]
        : undefined
    return [
      {
        metadata: metadataLinkFromYaml(record["Объект"]),
        use: use ?? "Use",
      },
    ]
  })
}

function collectPendingReferences(params: {
  filePath: string
  parsed: ParsedYaml
  owner: MetadataTargetOwner | undefined
  value: unknown
  properties: readonly ValidationRulesSpecSnapshot["properties"][number][]
  yamlPath: readonly (string | number)[]
  diagnostics: Diagnostic[]
  collector: LocalIndexesCollector
  rulePath: readonly { propertyKey: string }[]
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
          collector: params.collector,
          rulePath,
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
  collector: LocalIndexesCollector
  rulePath: readonly { propertyKey: string }[]
}): PendingMetadataTargetReference[] {
  if (Array.isArray(params.value)) {
    return params.value.flatMap((item, index) =>
      collectPendingReferences({ ...params, value: item, yamlPath: [...params.yamlPath, index] })
    )
  }

  const record = asRecord(params.value)
  if (record === undefined) return []

  return Object.entries(record).flatMap(([key, item]) =>
    collectPendingReferences({ ...params, value: item, yamlPath: [...params.yamlPath, key] })
  )
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
}): PendingMetadataTargetReference | undefined {
  if (params.value in PictureLibFromYAML) return undefined
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
}): PendingMetadataTargetReference | undefined {
  const parsed = parseMetadataTargetFromYAML({
    value: params.value,
    constraint: params.constraint,
    owner: params.owner,
  })
  if (!parsed.ok) {
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

  const index = buildFormDataPathIndexFromYaml({ filePath: file.absolutePath, parsed })
  const pendingChecks = collectFormPendingChecks({
    file,
    parsed,
    value: data,
    index,
    yamlPath: [],
  })

  return {
    ...emptyFacts(),
    pendingChecks,
    diagnostics: [
      ...validateExcludedEqualNameYAML({
        filePath: file.absolutePath,
        parsed,
        rule: ClientApplicationFormRules,
        context: { version: "2.20", defaultLanguage: "ru" },
        name: file.formName,
      }),
      ...index.duplicateDiagnostics,
    ],
  }
}

function buildFormDataPathIndexFromYaml(params: { filePath: string; parsed: ParsedYaml }): FormDataPathIndex {
  const collector = createFormDataPathIndexCollector({ filePath: params.filePath })
  const attributes = asRecord(asRecord(params.parsed.data)?.["Реквизиты"])

  for (const [name, value] of Object.entries(attributes ?? {})) {
    const attribute = asRecord(value)
    acceptFormIndexValue(collector, ["Реквизиты", name, "Тип"], attribute?.["Тип"])
    if (attribute?.["ДинамическийСписок"] !== undefined) {
      acceptFormIndexValue(collector, ["Реквизиты", name, "ДинамическийСписок"], true)
    }
    for (const [columnName, column] of Object.entries(asRecord(attribute?.["Колонки"]) ?? {})) {
      acceptFormIndexValue(
        collector,
        ["Реквизиты", name, "Колонки", columnName, "Тип"],
        asRecord(column)?.["Тип"]
      )
    }
    if (attribute?.["ДополнительныеКолонки"] !== undefined) {
      acceptFormIndexValue(
        collector,
        ["Реквизиты", name, "ДополнительныеКолонки"],
        attribute["ДополнительныеКолонки"]
      )
    }
  }

  return collector.finish()
}

function acceptFormIndexValue(
  collector: ReturnType<typeof createFormDataPathIndexCollector>,
  yamlPath: readonly (string | number)[],
  value: unknown
): void {
  if (value === undefined) return
  collector.acceptProperty({
    yamlPath,
    rulePath: [],
    rule: { type: "ValidationFormIndex" as never, yaml: String(yamlPath.at(-1)) },
    value,
  })
}

function collectFormPendingChecks(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  value: Record<string, unknown>
  index: FormDataPathIndex
  yamlPath: readonly (string | number)[]
  tableContext?: { dataPath: string }
}): ValidationPendingCheck[] {
  return collectNestedFormElementChecks({
    file: params.file,
    parsed: params.parsed,
    owner: params.value,
    properties: ClientApplicationFormRules.properties,
    index: params.index,
    cursor: { yamlPath: params.yamlPath, rulePath: [] },
    tableContext: params.tableContext,
  })
}

function collectNestedFormElementChecks(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  owner: Record<string, unknown>
  properties: Record<string, PropertyRule>
  index: FormDataPathIndex
  cursor: YamlRuleCursor
  tableContext?: { dataPath: string }
}): ValidationPendingCheck[] {
  const checks: ValidationPendingCheck[] = []
  for (const [propertyKey, propertyRule] of Object.entries(params.properties)) {
    if (typeof propertyRule.yaml !== "string") continue
    const nested = getTypeRule(propertyRule.type, "nestedItemRule")
    if (nested === undefined) continue
    const value = asRecord(params.owner[propertyRule.yaml])
    if (value === undefined) continue
    const propertyCursor = enterYamlProperty({
      cursor: params.cursor,
      propertyKey,
      yamlKey: propertyRule.yaml,
    })

    if ("itemRule" in nested) {
      if (!("enterpriseField" in nested.itemRule)) continue
      checks.push(
        ...collectFormElementChecks({
          ...params,
          owner: value,
          rule: nested.itemRule as ReturnType<typeof getElementRule>,
          cursor: enterNestedYamlRule(propertyCursor, nested.itemRule.itemType),
        })
      )
      continue
    }

    for (const [name, rawElement] of Object.entries(value)) {
      const element = asRecord(rawElement)
      if (element === undefined) continue
      const elementType = elementTypeFromYaml(element["Вид"], params.tableContext)
      if (elementType === undefined) continue
      const itemRule = nested.resolveItemRule(elementType)
      if (!("enterpriseField" in itemRule)) continue
      checks.push(
        ...collectFormElementChecks({
          ...params,
          owner: element,
          rule: itemRule as ReturnType<typeof getElementRule>,
          cursor: enterNestedYamlRule(
            { ...propertyCursor, yamlPath: [...propertyCursor.yamlPath, name] },
            elementType
          ),
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
      file: params.file,
      parsed: params.parsed,
      owner: params.owner,
      properties: params.rule.properties,
      index: params.index,
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
      location: yamlDiagnosticLocationAtPath({
        filePath: params.file.absolutePath,
        parsed: params.parsed,
        path: yamlPath,
      }),
      owner: { kind: params.file.owner.dir, name: params.file.owner.name },
      value,
      index: params.index,
      rule,
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
  return checks.find((check) => check.rule.yaml === "ПутьКДанным")?.value === undefined
    ? currentContext
    : { dataPath: checks.find((check) => check.rule.yaml === "ПутьКДанным")!.value }
}

function elementTypeFromYaml(value: unknown, tableContext: { dataPath: string } | undefined): ElementType | undefined {
  if (typeof value !== "string") return undefined
  if (tableContext !== undefined) {
    if (value === "ПолеВвода") return "TableInputField"
    if (value === "ПолеНадписи") return "TableLabelField"
    if (value === "ПолеРисунка") return "TablePictureField"
    if (value === "ПолеФлажок") return "TableCheckBoxField"
  }
  return CollectableElementTypeFromYAML[value as keyof typeof CollectableElementTypeFromYAML]
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

function isCommonAttributeUseYAML(value: string): value is CommonAttributeUseYAML {
  return Object.prototype.hasOwnProperty.call(CommonAttributeUseFromYAML, value)
}
