import type { TypeDescription } from "../../commonObjects/typeDescription/types"
import { indexValueFromYAML } from "../../orchestration/property/indexValueFromYAMLRegistry"
import type { LocalYamlFact } from "../../orchestration/property/importYamlTypes"
import type { LocalYamlItemFact } from "../../project/localIndexes"
import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"
import { createFormDataPathIndexCollector } from "../../validation/dataPath/formYamlIndex"

export function createFormDataPathMetadataCollector(params: { filePath: string }) {
  const index = createFormDataPathIndexCollector(params)

  const acceptItem = (fact: LocalYamlItemFact): void => {
    if (fact.itemType === "FormAttribute") {
      const name = fact.name ?? stringSegment(fact.yamlPath.at(-1))
      if (name !== undefined) index.declareAttribute(name)
      return
    }
    if (fact.itemType !== "FormAttributeColumn") return
    const attributeName = stringSegment(fact.yamlPath.at(-3))
    const columnName = fact.name ?? stringSegment(fact.yamlPath.at(-1))
    if (attributeName !== undefined && columnName !== undefined) index.declareColumn(attributeName, columnName)
  }

  const acceptProperty = (fact: LocalYamlFact): void => {
    const property = fact.rulePath.at(-1)?.propertyKey
    const ownerType = fact.rulePath.at(-2)?.nestedItemType
    if (property === "dataPath" && ownerType === "Table") {
      const name = stringSegment(fact.yamlPath.at(-2))
      if (name !== undefined && typeof fact.value === "string") {
        index.acceptTableDataPath({ name, dataPath: fact.value })
      }
      return
    }
    if (ownerType === "FormAttribute") {
      const name = stringSegment(fact.yamlPath.at(-2))
      if (name === undefined) return
      if (property === "type") index.setAttributeType(name, typeDescriptionFromYAML(fact.value))
      else if (property === "dynamicList") index.setDynamicList(name)
      else if (property === "additionalColumns") index.setAdditionalColumns(fact.value)
      return
    }
    if (ownerType !== "FormAttributeColumn" || property !== "type") return
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
    acceptTableDataPath: index.acceptTableDataPath,
    finish: index.finish,
  }
}

export function createFormDataPathIndexFromYAML(
  yaml: unknown,
  tableDataPathByElementName: ReadonlyMap<string, string> = new Map()
): FormDataPathIndex {
  const collector = createFormDataPathMetadataCollector({ filePath: "" })
  const attributes = asRecord(asRecord(yaml)?.["Реквизиты"])
  for (const [attributeName, rawAttribute] of Object.entries(attributes ?? {})) {
    const attributePath = ["Реквизиты", attributeName] as const
    collector.acceptItem({
      itemType: "FormAttribute",
      name: attributeName,
      yamlPath: attributePath,
      rulePath: [{ propertyKey: "attributes", nestedItemType: "FormAttribute" }],
    })
    const attribute = asRecord(rawAttribute)
    acceptPresentProperty(collector, attribute, "Тип", [...attributePath, "Тип"], "FormAttribute", "type")
    acceptPresentProperty(
      collector,
      attribute,
      "ДинамическийСписок",
      [...attributePath, "ДинамическийСписок"],
      "FormAttribute",
      "dynamicList"
    )
    acceptPresentProperty(
      collector,
      attribute,
      "ДополнительныеКолонки",
      [...attributePath, "ДополнительныеКолонки"],
      "FormAttribute",
      "additionalColumns"
    )
    for (const [columnName, rawColumn] of Object.entries(asRecord(attribute?.["Колонки"]) ?? {})) {
      const columnPath = [...attributePath, "Колонки", columnName]
      collector.acceptItem({
        itemType: "FormAttributeColumn",
        name: columnName,
        yamlPath: columnPath,
        rulePath: [
          { propertyKey: "attributes", nestedItemType: "FormAttribute" },
          { propertyKey: "columns", nestedItemType: "FormAttributeColumn" },
        ],
      })
      acceptPresentProperty(
        collector,
        asRecord(rawColumn),
        "Тип",
        [...columnPath, "Тип"],
        "FormAttributeColumn",
        "type"
      )
    }
  }
  for (const [name, dataPath] of tableDataPathByElementName) collector.acceptTableDataPath({ name, dataPath })
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
    rule: { type: "ValidationFormIndex" as never, yaml: yamlProperty },
    value: owner?.[yamlProperty],
  })
}

function typeDescriptionFromYAML(value: unknown): TypeDescription | undefined {
  return indexValueFromYAML<TypeDescription>("TypeDescription", value)
}

function stringSegment(value: string | number | undefined): string | undefined {
  return typeof value === "string" ? value : undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
