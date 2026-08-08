import type { LocalYamlFact } from "../../orchestration/property/importYamlTypes"
import { callAtomicFromYAML } from "../../orchestration/property/fromYAMLToXML"
import type { TypeDescriptionView } from "../../orchestration/property/typeDescriptionView"
import type { Diagnostic } from "../types"
import type { FormDataPathIndex } from "./formIndex"
import { typeDescriptionToDataPathTypeInfo } from "./typeDescription"
import type { FormDataPathColumnSource, FormDataPathSource } from "./types"

interface PendingFormAttribute {
  type?: TypeDescriptionView
  dynamicList?: true
  columns: Map<string, FormDataPathColumnSource>
}

export function createFormDataPathIndexCollector(_params: { filePath: string }): {
  acceptProperty(fact: LocalYamlFact): void
  acceptTableDataPath(params: { name: string; dataPath: string }): void
  completeValue(fact: LocalYamlFact): void
  finish(): FormDataPathIndex
} {
  const attributes = new Map<string, PendingFormAttribute>()
  const additionalColumnsByTablePath = new Map<string, Map<string, FormDataPathColumnSource>>()
  const tableDataPathByElementName = new Map<string, string>()

  const pendingAttribute = (name: string): PendingFormAttribute => {
    const existing = attributes.get(name)
    if (existing !== undefined) return existing
    const created: PendingFormAttribute = { columns: new Map() }
    attributes.set(name, created)
    return created
  }

  const acceptProperty = (fact: LocalYamlFact): void => {
    const propertyRulePath = fact.rulePath.at(-1)
    const ownerRulePath = fact.rulePath.at(-2)
    const elementName = fact.yamlPath.at(-2)
    if (
      propertyRulePath?.propertyKey === "dataPath" &&
      ownerRulePath?.nestedItemType === "Table" &&
      typeof elementName === "string" &&
      typeof fact.value === "string" &&
      fact.value.trim().length > 0 &&
      !tableDataPathByElementName.has(elementName)
    ) {
      tableDataPathByElementName.set(elementName, fact.value)
    }

    const [root, attributeName, property, nestedName, nestedProperty] = fact.yamlPath
    if (root !== "Реквизиты" || typeof attributeName !== "string" || typeof property !== "string") return
    const attribute = pendingAttribute(attributeName)

    if (property === "Тип" && fact.yamlPath.length === 3) {
      attribute.type = typeDescriptionFromYAML(fact.value)
      return
    }
    if (property === "ДинамическийСписок" && fact.yamlPath.length === 3) {
      attribute.dynamicList = true
      return
    }
    if (
      property === "Колонки" &&
      typeof nestedName === "string" &&
      nestedProperty === "Тип" &&
      fact.yamlPath.length === 5
    ) {
      attribute.columns.set(nestedName, {
        name: nestedName,
        typeInfo: typeDescriptionToDataPathTypeInfo(typeDescriptionFromYAML(fact.value)),
      })
      return
    }
    if (property === "ДополнительныеКолонки" && fact.yamlPath.length === 3) {
      copyAdditionalColumns(additionalColumnsByTablePath, fact.value)
    }
  }

  return {
    acceptProperty,
    acceptTableDataPath({ name, dataPath }) {
      if (dataPath.trim().length > 0 && !tableDataPathByElementName.has(name)) {
        tableDataPathByElementName.set(name, dataPath)
      }
    },
    completeValue: acceptProperty,
    finish() {
      const roots = new Map<string, FormDataPathSource>()
      for (const [name, attribute] of attributes) {
        const typeInfo = attribute.dynamicList
          ? {
              kinds: ["dynamicList", "tableSource"] as const,
              nextTypes: [],
              table: { kind: "DynamicList" as const },
              sourceText: "DynamicList",
            }
          : typeDescriptionToDataPathTypeInfo(attribute.type)
        const tableSource =
          typeInfo.table === undefined
            ? undefined
            : {
                table: typeInfo.table,
                columns: new Map(attribute.columns),
                hasColumns: typeInfo.table.kind !== "ValueTable" || attribute.columns.size > 0,
              }
        roots.set(name, {
          kind: "formAttribute",
          name,
          typeInfo,
          ...(tableSource === undefined ? {} : { tableSource }),
        })
      }
      const duplicateDiagnostics: Diagnostic[] = []
      return {
        roots,
        additionalColumnsByTablePath,
        tableDataPathByElementName,
        duplicateDiagnostics,
        getRoot(name) {
          return roots.get(name)
        },
      }
    },
  }
}

export function createFormDataPathIndexFromYAML(
  yaml: unknown,
  tableDataPathByElementName: ReadonlyMap<string, string> = new Map()
): FormDataPathIndex {
  const collector = createFormDataPathIndexCollector({ filePath: "" })
  const attributes = asRecord(asRecord(yaml)?.["Реквизиты"])
  const attributePropertyRule = { type: "string" } as const
  for (const [attributeName, rawAttribute] of Object.entries(attributes ?? {})) {
    const attribute = asRecord(rawAttribute)
    for (const property of ["Тип", "ДинамическийСписок", "ДополнительныеКолонки"] as const) {
      if (!Object.prototype.hasOwnProperty.call(attribute ?? {}, property)) continue
      collector.acceptProperty({
        yamlPath: ["Реквизиты", attributeName, property],
        rulePath: [],
        rule: attributePropertyRule,
        value: attribute?.[property],
      })
    }
    const columns = asRecord(attribute?.["Колонки"])
    for (const [columnName, rawColumn] of Object.entries(columns ?? {})) {
      const column = asRecord(rawColumn)
      if (!Object.prototype.hasOwnProperty.call(column ?? {}, "Тип")) continue
      collector.acceptProperty({
        yamlPath: ["Реквизиты", attributeName, "Колонки", columnName, "Тип"],
        rulePath: [],
        rule: attributePropertyRule,
        value: column?.["Тип"],
      })
    }
  }
  for (const [name, dataPath] of tableDataPathByElementName) {
    collector.acceptTableDataPath({ name, dataPath })
  }
  return collector.finish()
}

function copyAdditionalColumns(target: Map<string, Map<string, FormDataPathColumnSource>>, value: unknown): void {
  const groups = asRecord(value)
  for (const [tablePath, rawColumns] of Object.entries(groups ?? {})) {
    const columns = new Map<string, FormDataPathColumnSource>()
    for (const [name, rawColumn] of Object.entries(asRecord(rawColumns) ?? {})) {
      columns.set(name, {
        name,
        typeInfo: typeDescriptionToDataPathTypeInfo(typeDescriptionFromYAML(asRecord(rawColumn)?.["Тип"])),
      })
    }
    target.set(normalizeIndexedPath(tablePath), columns)
  }
}

export function typeDescriptionFromYAML(value: unknown): TypeDescriptionView | undefined {
  const imported = callAtomicFromYAML({
    context: { version: "", defaultLanguage: "" },
    rule: { type: "TypeDescription" },
    value,
  })
  return isTypeDescriptionView(imported) ? imported : undefined
}

function isTypeDescriptionView(value: unknown): value is TypeDescriptionView {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  return Array.isArray(record.type) || Array.isArray(record.typeId)
}

function normalizeIndexedPath(path: string): string {
  return path.split(".").map(segmentLookupName).join(".")
}

function segmentLookupName(segment: string): string {
  const match = /^(?<name>.+)\[(?<index>\d+)\]$/.exec(segment)
  return match?.groups?.name ?? segment
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
