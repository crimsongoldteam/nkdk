import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importMetadataItemFromXML, registerTypeRule } from "~/metadata/orchestration"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import {
  FormAttribute,
  FormAttributeAdditionalColumns,
  FormAttributeAdditionalColumnXML,
  FormAttributeColumn,
  FormAttributeColumnXML,
  FormAttributes,
  FormAttributesXML,
  FormAttributeWithAdditionalColumns,
  FormAttributeXML,
} from "./types"

const isAttributesContainerWithoutAttributes = (xml: unknown): boolean => {
  if (xml === null || xml === undefined || Array.isArray(xml) || typeof xml !== "object") return false

  const xmlObject = xml as Record<string, unknown>
  return !("Attribute" in xmlObject) && !("_name" in xmlObject) && "ConditionalAppearance" in xmlObject
}

export const importFormAttributesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: { Attribute: FormAttributesXML } | FormAttributeXML | FormAttributesXML | undefined
): FormAttributes | undefined => {
  if (!xml) return undefined

  if (isAttributesContainerWithoutAttributes(xml)) return []

  const xmlAttributes = "Attribute" in xml ? xml.Attribute : xml
  const items = Array.isArray(xmlAttributes) ? xmlAttributes : [xmlAttributes]
  const attributes = items.map((item) => importFormAttributeFromXML(context, item as FormAttributeXML))

  return attributes
}

export const importFormAttributeColumnFromXML = (
  context: ConfigurationContextFromXML,
  xml: FormAttributeColumnXML | undefined
): FormAttributeColumn | undefined => {
  if (!xml) return undefined

  const columns = importColumnsFromXML(context, xml)

  return columns[0]
}

const importFormAttributeFromXML = (context: ConfigurationContextFromXML, xml: FormAttributeXML): FormAttribute => {
  const importedProperties = importMetadataItemFromXML({
    context: context,
    xml,
    rule: FormAttributeRules,
  })

  const columns = importColumnsFromXML(context, xml.Columns?.Column)
  const additionalColumns = importAdditionalColumnsFromXML(context, xml.Columns?.AdditionalColumns)
  const {
    columns: _importedColumns,
    additionalColumns: _importedAdditionalColumns,
    ...properties
  } = importedProperties ?? {}

  if (context.fromXML.forReference) {
    const result = { itemType: FormAttributeRules.itemType } as FormAttributeWithAdditionalColumns
    for (const key of Object.keys(importedProperties ?? {})) {
      if (key === "columns") {
        result.columns = columns
        if (additionalColumns.length > 0) {
          result.additionalColumns = additionalColumns
        }
        continue
      }

      if (key === "additionalColumns") {
        if (additionalColumns.length > 0) {
          result.additionalColumns = additionalColumns
        }
        continue
      }

      ;(result as Record<string, unknown>)[key] = (properties as Record<string, unknown>)[key]
    }
    result.name = xml._name
    if (result.columns === undefined) result.columns = columns
    if (result.additionalColumns === undefined && additionalColumns.length > 0)
      result.additionalColumns = additionalColumns

    return result as FormAttribute
  }

  const useLegacyAdditionalColumns =
    columns.length === 0 && additionalColumns.length > 0 && !isFormObject(properties.type)

  const result: FormAttributeWithAdditionalColumns = {
    itemType: FormAttributeRules.itemType,
    name: xml._name,
    title: properties.title!,
    columns: useLegacyAdditionalColumns ? (additionalColumns as unknown as FormAttributeColumn[]) : columns,
    ...properties,
  }

  if (!useLegacyAdditionalColumns && additionalColumns.length > 0) {
    result.additionalColumns = additionalColumns
  }

  return result
}

const isFormObject = (type: FormAttribute["type"] | undefined): boolean => {
  const formObjectTypes = ["ValueTable", "ValueTree", "ChoiceList"]
  return type?.type.some((t) => formObjectTypes.includes(t)) ?? false
}

const importFormAttributeColumnsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: FormAttributeColumnXML | FormAttributeColumnXML[] | undefined
): FormAttributeColumn[] | undefined => {
  return importColumnsFromXML(context, xml)
}

const importColumnsFromXML = (
  context: ConfigurationContextFromXML,
  xml: FormAttributeColumnXML | FormAttributeColumnXML[] | undefined
): FormAttributeColumn[] => {
  if (!xml) return []

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => {
    const properties = importMetadataItemFromXML({
      context: context,
      xml: item,
      rule: FormAttributeColumnRules,
    })

    const column: FormAttributeColumn = context.fromXML.forReference
      ? ({
          itemType: FormAttributeColumnRules.itemType,
          ...properties,
          name: item._name,
        } as FormAttributeColumn)
      : {
          itemType: FormAttributeColumnRules.itemType,
          name: item._name,
          ...properties,
        }

    return column
  })
}

const importAdditionalColumnsFromXML = (
  context: ConfigurationContextFromXML,
  xml: FormAttributeAdditionalColumnXML | FormAttributeAdditionalColumnXML[] | undefined
): FormAttributeAdditionalColumns[] => {
  if (!xml) return []

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => ({
    table: item._table,
    columns: importColumnsFromXML(context, item.Column ?? [])!,
  }))
}

const importFormAttributeAdditionalColumnsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: FormAttributeAdditionalColumnXML | FormAttributeAdditionalColumnXML[] | undefined
): FormAttributeAdditionalColumns[] | undefined => {
  return importAdditionalColumnsFromXML(context, xml)
}

registerTypeRule("FormAttributes", "importFromXML", importFormAttributesFromXML)
registerTypeRule("FormAttributeColumns", "importFromXML", importFormAttributeColumnsFromXML)
registerTypeRule("FormAttributeAdditionalColumns", "importFromXML", importFormAttributeAdditionalColumnsFromXML)
