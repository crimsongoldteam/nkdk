import type { TypeDescription } from "../../commonObjects/typeDescription/types"
import { indexValueFromYAML } from "../../orchestration/property/indexValueFromYAMLRegistry"
import type { Diagnostic } from "../types"
import type { FormDataPathIndex } from "./formIndex"
import { typeDescriptionToDataPathTypeInfo } from "./typeDescription"
import type { DataPathTypeInfo, FormDataPathColumnSource, FormDataPathSource } from "./types"

interface PendingFormAttribute {
  typeInfo: DataPathTypeInfo
  columns: Map<string, FormDataPathColumnSource>
}

export const arbitraryDataPathTypeInfo: DataPathTypeInfo = {
  kinds: ["any"],
  nextTypes: [],
  sourceText: "Произвольный",
}

export function createFormDataPathIndexCollector(_params: { filePath: string }): {
  declareAttribute(name: string): void
  setAttributeType(name: string, type: TypeDescription | undefined): void
  setDynamicList(name: string): void
  declareColumn(attributeName: string, columnName: string): void
  setColumnType(attributeName: string, columnName: string, type: TypeDescription | undefined): void
  setAdditionalColumns(value: unknown): void
  acceptTableDataPath(params: { name: string; dataPath: string }): void
  finish(): FormDataPathIndex
} {
  const attributes = new Map<string, PendingFormAttribute>()
  const additionalColumnsByTablePath = new Map<string, Map<string, FormDataPathColumnSource>>()
  const tableDataPathByElementName = new Map<string, string>()

  const pendingAttribute = (name: string): PendingFormAttribute => {
    const existing = attributes.get(name)
    if (existing !== undefined) return existing
    const created: PendingFormAttribute = { typeInfo: arbitraryDataPathTypeInfo, columns: new Map() }
    attributes.set(name, created)
    return created
  }

  const declareColumn = (attributeName: string, columnName: string): void => {
    const columns = pendingAttribute(attributeName).columns
    if (columns.has(columnName)) return
    columns.set(columnName, { name: columnName, typeInfo: arbitraryDataPathTypeInfo })
  }

  return {
    declareAttribute: (name) => void pendingAttribute(name),
    setAttributeType(name, type) {
      pendingAttribute(name).typeInfo = typeDescriptionToDataPathTypeInfo(type)
    },
    setDynamicList(name) {
      pendingAttribute(name).typeInfo = {
        kinds: ["dynamicList", "tableSource"],
        nextTypes: [],
        table: { kind: "DynamicList" },
        sourceText: "DynamicList",
      }
    },
    declareColumn,
    setColumnType(attributeName, columnName, type) {
      declareColumn(attributeName, columnName)
      pendingAttribute(attributeName).columns.set(columnName, {
        name: columnName,
        typeInfo: typeDescriptionToDataPathTypeInfo(type),
      })
    },
    setAdditionalColumns(value) {
      copyAdditionalColumns(additionalColumnsByTablePath, value)
    },
    acceptTableDataPath({ name, dataPath }) {
      if (dataPath.trim().length > 0 && !tableDataPathByElementName.has(name)) {
        tableDataPathByElementName.set(name, dataPath)
      }
    },
    finish() {
      const roots = new Map<string, FormDataPathSource>()
      for (const [name, attribute] of attributes) {
        const tableSource =
          attribute.typeInfo.table === undefined
            ? undefined
            : {
                table: attribute.typeInfo.table,
                columns: new Map(attribute.columns),
                hasColumns: attribute.typeInfo.table.kind !== "ValueTable" || attribute.columns.size > 0,
              }
        roots.set(name, {
          kind: "formAttribute",
          name,
          typeInfo: attribute.typeInfo,
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

function copyAdditionalColumns(target: Map<string, Map<string, FormDataPathColumnSource>>, value: unknown): void {
  const groups = asRecord(value)
  for (const [tablePath, rawColumns] of Object.entries(groups ?? {})) {
    const columns = new Map<string, FormDataPathColumnSource>()
    for (const [name, rawColumn] of Object.entries(asRecord(rawColumns) ?? {})) {
      columns.set(name, {
        name,
        typeInfo: typeDescriptionToDataPathTypeInfo(
          indexValueFromYAML<TypeDescription>("TypeDescription", asRecord(rawColumn)?.["Тип"])
        ),
      })
    }
    target.set(normalizeIndexedPath(tablePath), columns)
  }
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
