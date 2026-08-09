import type { TypeDescriptionView } from "../../orchestration/property/typeDescriptionView"
import { indexValueFromYAML } from "../../orchestration/property/indexValueFromYAMLRegistry"
import type { Diagnostic } from "../types"
import { typeDescriptionToDataPathTypeInfo } from "./typeDescription"
import type {
  DataPathTypeInfo,
  FormDataPathColumnSource,
  FormDataPathSource,
} from "./types"
import type { FormDataPathIndex } from "./formIndex"
import type { FormDataPathTabularElementDeclaration } from "../../orchestration/dataPath/formIndex"
import type {
  FormDataPathItemFact,
  FormDataPathMetadataProjection,
  FormDataPathPropertyFact,
} from "../formDataPathProjection"

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
  setAttributeType(name: string, type: TypeDescriptionView | undefined): void
  setDynamicList(name: string): void
  declareColumn(attributeName: string, columnName: string): void
  setColumnType(attributeName: string, columnName: string, type: TypeDescriptionView | undefined): void
  setAdditionalColumns(value: unknown): void
  declareTabularElement(params: { name: string; dataPath?: string }): void
  acceptTableDataPath(params: { name: string; dataPath: string }): void
  finish(): FormDataPathIndex
} {
  const attributes = new Map<string, PendingFormAttribute>()
  const additionalColumnsByTablePath = new Map<string, Map<string, FormDataPathColumnSource>>()
  const tableDataPathByElementName = new Map<string, string>()
  const tabularElementsByName = new Map<string, FormDataPathTabularElementDeclaration>()

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
    declareTabularElement({ name, dataPath }) {
      const normalizedDataPath = dataPath?.trim().length ? dataPath : undefined
      const existing = tabularElementsByName.get(name)
      if (existing === undefined || (existing.dataPath === undefined && normalizedDataPath !== undefined)) {
        tabularElementsByName.set(name, {
          kind: "tabularFormElement",
          ...(normalizedDataPath === undefined ? {} : { dataPath: normalizedDataPath }),
        })
      }
      if (normalizedDataPath !== undefined && !tableDataPathByElementName.has(name)) {
        tableDataPathByElementName.set(name, normalizedDataPath)
      }
    },
    acceptTableDataPath({ name, dataPath }) {
      this.declareTabularElement({ name, dataPath })
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
        tabularElementsByName,
        tableDataPathByElementName,
        duplicateDiagnostics,
        getRoot(name) {
          return roots.get(name)
        },
      }
    },
  }
}

export function createFormDataPathMetadataCollector(params: {
  filePath: string
  projection: FormDataPathMetadataProjection
}) {
  const index = createFormDataPathIndexCollector(params)
  const projection = params.projection

  const acceptItem = (fact: FormDataPathItemFact): void => {
    if (fact.itemType === projection.attributeItemType) {
      const name = fact.name ?? stringSegment(fact.yamlPath.at(-1))
      if (name !== undefined) index.declareAttribute(name)
      return
    }
    if (projection.tabularElementItemTypes.includes(fact.itemType)) {
      const name = fact.name ?? stringSegment(fact.yamlPath.at(-1))
      if (name !== undefined) index.declareTabularElement({ name })
      return
    }
    if (fact.itemType !== projection.columnItemType) return
    const attributeName = stringSegment(fact.yamlPath.at(-3))
    const columnName = fact.name ?? stringSegment(fact.yamlPath.at(-1))
    if (attributeName !== undefined && columnName !== undefined) index.declareColumn(attributeName, columnName)
  }

  const acceptProperty = (fact: FormDataPathPropertyFact): void => {
    const property = fact.rulePath.at(-1)?.propertyKey
    const ownerType = fact.rulePath.at(-2)?.nestedItemType
    if (property === projection.tableDataPathPropertyKey && projection.tabularElementItemTypes.includes(ownerType ?? "")) {
      const name = stringSegment(fact.yamlPath.at(-2))
      if (name !== undefined && typeof fact.value === "string") {
        index.declareTabularElement({ name, dataPath: fact.value })
      }
      return
    }
    if (ownerType === projection.attributeItemType) {
      const name = stringSegment(fact.yamlPath.at(-2))
      if (name === undefined) return
      if (property === projection.typePropertyKey) index.setAttributeType(name, typeDescriptionFromYAML(fact.value))
      else if (property === projection.dynamicListPropertyKey) index.setDynamicList(name)
      else if (property === projection.additionalColumnsPropertyKey) index.setAdditionalColumns(fact.value)
      return
    }
    if (ownerType !== projection.columnItemType || property !== projection.typePropertyKey) return
    const attributeName = stringSegment(fact.yamlPath.at(-4))
    const columnName = stringSegment(fact.yamlPath.at(-2))
    if (attributeName !== undefined && columnName !== undefined) {
      index.setColumnType(attributeName, columnName, typeDescriptionFromYAML(fact.value))
    }
  }

  return {
    acceptItem,
    acceptProperty,
    completeValue: acceptProperty,
    declareTabularElement: index.declareTabularElement,
    acceptTableDataPath: index.acceptTableDataPath,
    finish: index.finish,
  }
}

export function createFormDataPathIndexFromYAML(
  yaml: unknown,
  projection: FormDataPathMetadataProjection,
  tabularElementsByName?: ReadonlyMap<string, FormDataPathTabularElementDeclaration>
): FormDataPathIndex {
  const collector = createFormDataPathMetadataCollector({ filePath: "", projection })
  const attributes = asRecord(asRecord(yaml)?.[projection.attributesYaml])
  for (const [attributeName, rawAttribute] of Object.entries(attributes ?? {})) {
    const attributePath = [projection.attributesYaml, attributeName] as const
    collector.acceptItem({
      itemType: projection.attributeItemType,
      name: attributeName,
      yamlPath: attributePath,
      rulePath: [{ propertyKey: "attributes", nestedItemType: projection.attributeItemType }],
    })
    const attribute = asRecord(rawAttribute)
    acceptPresentProperty(
      collector,
      attribute,
      projection.typeYaml,
      [...attributePath, projection.typeYaml],
      projection.attributeItemType,
      projection.typePropertyKey
    )
    acceptPresentProperty(
      collector,
      attribute,
      projection.dynamicListYaml,
      [...attributePath, projection.dynamicListYaml],
      projection.attributeItemType,
      projection.dynamicListPropertyKey
    )
    acceptPresentProperty(
      collector,
      attribute,
      projection.additionalColumnsYaml,
      [...attributePath, projection.additionalColumnsYaml],
      projection.attributeItemType,
      projection.additionalColumnsPropertyKey
    )
    for (const [columnName, rawColumn] of Object.entries(asRecord(attribute?.[projection.columnsYaml]) ?? {})) {
      const columnPath = [...attributePath, projection.columnsYaml, columnName]
      collector.acceptItem({
        itemType: projection.columnItemType,
        name: columnName,
        yamlPath: columnPath,
        rulePath: [
          { propertyKey: "attributes", nestedItemType: projection.attributeItemType },
          { propertyKey: "columns", nestedItemType: projection.columnItemType },
        ],
      })
      acceptPresentProperty(
        collector,
        asRecord(rawColumn),
        projection.typeYaml,
        [...columnPath, projection.typeYaml],
        projection.columnItemType,
        projection.typePropertyKey
      )
    }
  }
  const tabularElements =
    tabularElementsByName ?? projection.collectTabularElementsFromYAML?.(yaml) ??
    new Map<string, FormDataPathTabularElementDeclaration>()
  for (const [name, declaration] of tabularElements) {
    collector.declareTabularElement({ name, ...(declaration.dataPath === undefined ? {} : { dataPath: declaration.dataPath }) })
  }
  return collector.finish()
}

function acceptPresentProperty(
  collector: ReturnType<typeof createFormDataPathMetadataCollector>,
  owner: Record<string, unknown> | undefined,
  yamlProperty: string,
  yamlPath: readonly (string | number)[],
  ownerType: string,
  propertyKey: string
): void {
  if (!Object.prototype.hasOwnProperty.call(owner ?? {}, yamlProperty)) return
  collector.acceptProperty({
    yamlPath,
    rulePath: [{ propertyKey: "owner", nestedItemType: ownerType }, { propertyKey }],
    value: owner?.[yamlProperty],
  })
}

function typeDescriptionFromYAML(value: unknown): TypeDescriptionView | undefined {
  return indexValueFromYAML<TypeDescriptionView>("TypeDescription", value)
}

function stringSegment(value: string | number | undefined): string | undefined {
  return typeof value === "string" ? value : undefined
}

function copyAdditionalColumns(target: Map<string, Map<string, FormDataPathColumnSource>>, value: unknown): void {
  const groups = asRecord(value)
  for (const [tablePath, rawColumns] of Object.entries(groups ?? {})) {
    const columns = new Map<string, FormDataPathColumnSource>()
    for (const [name, rawColumn] of Object.entries(asRecord(rawColumns) ?? {})) {
      columns.set(name, {
        name,
        typeInfo: typeDescriptionToDataPathTypeInfo(
          indexValueFromYAML<TypeDescriptionView>("TypeDescription", asRecord(rawColumn)?.["Тип"])
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
