import { getTypeFromYAML } from "../../commonObjects/typeDescription/helper"
import type { TypeDescription } from "../../commonObjects/typeDescription/types"
import type { LocalYamlFact } from "../../orchestration/property/importYamlTypes"
import type { Diagnostic } from "../types"
import type { FormDataPathIndex } from "./formIndex"
import { typeDescriptionToDataPathTypeInfo } from "./typeDescription"
import type { FormDataPathColumnSource, FormDataPathSource } from "./types"

interface PendingFormAttribute {
  type?: TypeDescription
  dynamicList?: true
  columns: Map<string, FormDataPathColumnSource>
}

export function createFormDataPathIndexCollector(_params: { filePath: string }): {
  acceptProperty(fact: LocalYamlFact): void
  completeValue(fact: LocalYamlFact): void
  finish(): FormDataPathIndex
} {
  const attributes = new Map<string, PendingFormAttribute>()
  const additionalColumnsByTablePath = new Map<string, Map<string, FormDataPathColumnSource>>()

  const pendingAttribute = (name: string): PendingFormAttribute => {
    const existing = attributes.get(name)
    if (existing !== undefined) return existing
    const created: PendingFormAttribute = { columns: new Map() }
    attributes.set(name, created)
    return created
  }

  const acceptProperty = (fact: LocalYamlFact): void => {
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
        duplicateDiagnostics,
        getRoot(name) {
          return roots.get(name)
        },
      }
    },
  }
}

function copyAdditionalColumns(
  target: Map<string, Map<string, FormDataPathColumnSource>>,
  value: unknown
): void {
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

export function typeDescriptionFromYAML(value: unknown): TypeDescription | undefined {
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
