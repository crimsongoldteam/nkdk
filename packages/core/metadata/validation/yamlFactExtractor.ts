import { parseMetadataTargetFromYAML } from "../commonObjects/metadataTargets"
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { MetadataTargetOwner, ParsedMetadataTarget } from "../commonObjects/metadataTargets/types"
import { getTypeFromYAML } from "../commonObjects/typeDescription/helper"
import type { TypeDescription } from "../commonObjects/typeDescription/types"
import { CollectableElementTypeFromYAML, type ElementType } from "../forms/elements/orchestration/types"
import type { DataPathPropertyRule, PropertyRule } from "../orchestration/property/types"
import { getElementRule } from "../orchestration/formElement/ruleFactory"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import { typeDescriptionToDataPathTypeInfo } from "./dataPath/typeDescription"
import type { FormDataPathIndex } from "./dataPath/formIndex"
import type { FormDataPathSource, FormDataPathColumnSource } from "./dataPath/types"
import type { ObjectField, ObjectFieldIndex } from "./dataPath/objectFields"
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
import { findValidationRulesSpec, type ValidationRulesSnapshot, type ValidationRulesSpecSnapshot } from "./rulesSnapshot"
import { diagnosticAtYamlPath } from "./yamlLocations"
import type { Diagnostic } from "./types"

export interface ValidationYamlFacts {
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  pendingChecks: ValidationPendingCheck[]
  diagnostics: Diagnostic[]
  fieldIndex?: ObjectFieldIndex
  ownerModelStub?: Record<string, unknown>
}

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
  const owner = objectTarget === undefined ? undefined : { root: objectTarget.root, objectName: objectTarget.objectName }
  const pendingReferences =
    spec === undefined
      ? []
      : collectPendingReferences({
          filePath: params.file.absolutePath,
          owner,
          value: params.parsed.data,
          properties: spec.properties,
          yamlPath: [],
        })
  const ownerFacts = spec === undefined ? undefined : buildOwnerFactsFromYaml(params.file, params.parsed.data, spec)
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
    diagnostics: [],
    ...(ownerFacts === undefined ? {} : ownerFacts),
  }
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
      property.modelKey === "commands"
    ) {
      model[property.modelKey] = namedTypedItemsFromYaml(value)
      continue
    }
    if (property.modelKey === "tabularSections") {
      model[property.modelKey] = tabularSectionsFromYaml(value)
      continue
    }
    if (property.modelKey === "owners") {
      model[property.modelKey] = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
      continue
    }
    if (property.modelKey === "registerRecords") {
      model[property.modelKey] = metadataLinksFromYaml(value)
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
  const fields = new Map<string, ObjectField>()
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
    const table = { kind: "TabularSection" as const, owner: { kind: file.owner.dir, name: file.owner.name }, name: record["name"] }
    fields.set(record["name"], {
      name: record["name"],
      kind: "tabularSection",
      sourceCollection: "tabularSections",
      typeInfo: { kinds: ["tableSource"], nextTypes: [], table },
      tableSource: { table, columns, hasColumns: columns.size > 0 },
    })
  }

  return { fields, standardAttributeAliases: new Map(), diagnostics: [] }
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

function tabularSectionsFromYaml(value: unknown): Array<{ name: string; attributes: Array<{ name: string; type?: TypeDescription }> }> {
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
  const dotIndex = value.indexOf(".")
  if (dotIndex === -1) return value

  const root = value.substring(0, dotIndex)
  return `${rootFromYAML[root] ?? root}${value.substring(dotIndex)}`
}

function collectPendingReferences(params: {
  filePath: string
  owner: MetadataTargetOwner | undefined
  value: unknown
  properties: readonly ValidationRulesSpecSnapshot["properties"][number][]
  yamlPath: readonly (string | number)[]
}): PendingMetadataTargetReference[] {
  const record = asRecord(params.value)
  if (record === undefined) return []

  const references: PendingMetadataTargetReference[] = []
  for (const property of params.properties) {
    const value = valueAtPath(record, property.yamlPath)
    if (value === undefined) continue

    if (property.metadataTarget !== undefined) {
      references.push(
        ...collectTargetValues({
          filePath: params.filePath,
          owner: params.owner,
          value,
          constraint: property.metadataTarget,
          yamlPath: [...params.yamlPath, ...property.yamlPath],
        })
      )
    }

    if (property.children !== undefined) {
      references.push(
        ...collectNestedReferences({
          filePath: params.filePath,
          owner: params.owner,
          value,
          properties: property.children,
          yamlPath: [...params.yamlPath, ...property.yamlPath],
        })
      )
    }
  }

  return references
}

function collectNestedReferences(params: {
  filePath: string
  owner: MetadataTargetOwner | undefined
  value: unknown
  properties: readonly ValidationRulesSpecSnapshot["properties"][number][]
  yamlPath: readonly (string | number)[]
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
  owner: MetadataTargetOwner | undefined
  value: unknown
  constraint: PendingMetadataTargetReference["constraint"]
  yamlPath: readonly (string | number)[]
}): PendingMetadataTargetReference[] {
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

function pendingReferenceFromYamlValue(params: {
  filePath: string
  owner: MetadataTargetOwner | undefined
  value: string
  constraint: PendingMetadataTargetReference["constraint"]
  yamlPath: readonly (string | number)[]
}): PendingMetadataTargetReference | undefined {
  const parsed = parseMetadataTargetFromYAML({
    value: params.value,
    constraint: params.constraint,
    owner: params.owner,
  })
  if (!parsed.ok) return undefined

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
    diagnostics: index.duplicateDiagnostics,
  }
}

function buildFormDataPathIndexFromYaml(params: { filePath: string; parsed: ParsedYaml }): FormDataPathIndex {
  const roots = new Map<string, FormDataPathSource>()
  const additionalColumnsByTablePath = new Map<string, Map<string, FormDataPathColumnSource>>()
  const duplicateDiagnostics: Diagnostic[] = []
  const seenNames = new Map<string, number>()
  const attributes = asRecord(asRecord(params.parsed.data)?.["Реквизиты"])

  for (const [name, value] of Object.entries(attributes ?? {})) {
    const occurrence = (seenNames.get(name) ?? 0) + 1
    seenNames.set(name, occurrence)
    if (roots.has(name)) {
      duplicateDiagnostics.push(
        diagnosticAtYamlPath({
          filePath: params.filePath,
          parsed: params.parsed,
          path: ["Реквизиты", name],
          severity: "error",
          source: "structure",
          message: `Дублируется реквизит формы "${name}"`,
        })
      )
      continue
    }

    const attribute = asRecord(value)
    addAdditionalColumnsFromYaml({
      additionalColumnsByTablePath,
      value: attribute?.["ДополнительныеКолонки"],
    })
    const typeInfo =
      attribute?.["ДинамическийСписок"] !== undefined
        ? { kinds: ["dynamicList", "tableSource"] as const, nextTypes: [], table: { kind: "DynamicList" as const }, sourceText: "DynamicList" }
        : typeDescriptionToDataPathTypeInfo(typeDescriptionFromYAML(attribute?.["Тип"]))
    const tableSource =
      typeInfo.table === undefined
        ? undefined
        : {
            table: typeInfo.table,
            columns: columnsFromYaml(attribute?.["Колонки"]),
            hasColumns: typeInfo.table.kind !== "ValueTable" || columnsFromYaml(attribute?.["Колонки"]).size > 0,
          }

    roots.set(name, {
      kind: "formAttribute",
      name,
      typeInfo,
      ...(tableSource === undefined ? {} : { tableSource }),
    })
  }

  return {
    roots,
    additionalColumnsByTablePath,
    duplicateDiagnostics,
    getRoot(name) {
      return roots.get(name)
    },
  }
}

function addAdditionalColumnsFromYaml(params: {
  additionalColumnsByTablePath: Map<string, Map<string, FormDataPathColumnSource>>
  value: unknown
}): void {
  const groups = asRecord(params.value)
  for (const [tablePath, columns] of Object.entries(groups ?? {})) {
    params.additionalColumnsByTablePath.set(normalizeIndexedPath(tablePath), columnsFromYaml(columns))
  }
}

function columnsFromYaml(value: unknown): Map<string, FormDataPathColumnSource> {
  const result = new Map<string, FormDataPathColumnSource>()
  const columns = asRecord(value)
  for (const [name, column] of Object.entries(columns ?? {})) {
    result.set(name, {
      name,
      typeInfo: typeDescriptionToDataPathTypeInfo(typeDescriptionFromYAML(asRecord(column)?.["Тип"])),
    })
  }
  return result
}

function normalizeIndexedPath(path: string): string {
  return path.split(".").map(segmentLookupName).join(".")
}

function segmentLookupName(segment: string): string {
  const match = /^(?<name>.+)\[(?<index>\d+)\]$/.exec(segment)
  return match?.groups?.name ?? segment
}

function collectFormPendingChecks(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  value: Record<string, unknown>
  index: FormDataPathIndex
  yamlPath: readonly (string | number)[]
  tableContext?: { dataPath: string }
}): ValidationPendingCheck[] {
  const checks: ValidationPendingCheck[] = []
  checks.push(
    ...collectElementTreeChecks({
      ...params,
      value: asRecord(params.value["Элементы"]),
      yamlPath: [...params.yamlPath, "Элементы"],
    })
  )
  return checks
}

function collectElementTreeChecks(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  value: Record<string, unknown> | undefined
  index: FormDataPathIndex
  yamlPath: readonly (string | number)[]
  tableContext?: { dataPath: string }
}): ValidationPendingCheck[] {
  const checks: ValidationPendingCheck[] = []
  for (const [name, rawElement] of Object.entries(params.value ?? {})) {
    const element = asRecord(rawElement)
    if (element === undefined) continue
    const elementType = elementTypeFromYaml(element["Вид"], params.tableContext)
    if (elementType === undefined) continue
    const rule = getElementRule(elementType)
    const elementPath = [...params.yamlPath, name]
    const itemChecks = collectRuleDataPathChecks({
      file: params.file,
      parsed: params.parsed,
      owner: element,
      properties: rule.properties,
      index: params.index,
      yamlPath: elementPath,
      elementType,
      tableContext: params.tableContext,
    })
    const childTableContext = tableContextForChildren(elementType, itemChecks, params.tableContext)
    checks.push(
      ...itemChecks,
      ...collectElementTreeChecks({
        ...params,
        value: asRecord(element["Элементы"]),
        yamlPath: [...elementPath, "Элементы"],
        tableContext: childTableContext,
      })
    )
  }
  return checks
}

function collectRuleDataPathChecks(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
  owner: Record<string, unknown>
  properties: Record<string, PropertyRule>
  index: FormDataPathIndex
  yamlPath: readonly (string | number)[]
  elementType: ElementType
  tableContext?: { dataPath: string }
}): ValidationPendingCheck[] {
  const checks: ValidationPendingCheck[] = []
  for (const rule of Object.values(params.properties)) {
    if (!isDataPathRule(rule) || typeof rule.yaml !== "string") continue

    const value = params.owner[rule.yaml]
    if (typeof value !== "string" || value.trim().length === 0) continue
    checks.push({
      kind: "dataPath",
      filePath: params.file.absolutePath,
      parsed: params.parsed,
      yamlPath: [...params.yamlPath, rule.yaml],
      owner: { kind: params.file.owner.dir, name: params.file.owner.name },
      value,
      index: params.index,
      rule,
      elementType: params.elementType,
      ...(params.owner["КартинкаЗначений"] === undefined ? {} : { hasValuesPicture: true }),
      ...(params.tableContext !== undefined && rule.yaml === "ПутьКДанным" ? { tableContext: params.tableContext } : {}),
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

function typeDescriptionFromYAML(value: unknown): TypeDescription | undefined {
  const values = Array.isArray(value) ? value : [value]
  const types = values
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => {
      const dotIndex = item.indexOf(".")
      const base = dotIndex === -1 ? item : item.slice(0, dotIndex)
      const detail = dotIndex === -1 ? undefined : item.slice(dotIndex + 1)
      const type = getTypeFromYAML(base)
      return type === undefined ? primitiveTypeFromYaml(item) : detail === undefined ? type : `${type}.${detail}`
    })
  return types.length === 0 ? undefined : { type: types }
}

function primitiveTypeFromYaml(value: string): string {
  const base = value.replace(/\(.+\)$/, "")
  if (base === "Строка" || base === "ФиксированнаяСтрока") return "string"
  if (base === "Число" || base === "ПоложительноеЧисло") return "decimal"
  if (value === "Булево") return "boolean"
  if (value === "Дата" || value === "Время" || value === "ДатаВремя") return "dateTime"
  return value
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
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}
