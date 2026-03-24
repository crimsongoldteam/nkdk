import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importMetadataItemFromXML, registerTypeRule } from "~/metadata/orchestration"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import {
  FormAttribute,
  FormAttributeAdditionalColumns,
  FormAttributeAdditionalColumnXML,
  FormAttributeColumn,
  FormAttributeColumns,
  FormAttributeColumnsXML,
  FormAttributeColumnXML,
  FormAttributes,
  FormAttributesXML,
  FormAttributeXML,
} from "./types"

export const importFormAttributesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: { Attribute: FormAttributesXML } | undefined
): FormAttributes | undefined => {
  if (!xml || !xml.Attribute) return undefined

  const items = Array.isArray(xml.Attribute) ? xml.Attribute : [xml.Attribute]
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
  const properties = importMetadataItemFromXML({
    context: context,
    xml,
    rule: FormAttributeRules,
  })

  const result: FormAttribute = {
    itemType: FormAttributeRules.itemType,
    name: xml._name,
    title: properties!.title!,
    columns: [],
    ...properties,
  }

  return result
}

const importFormAttributeColumnsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: FormAttributeColumnsXML | undefined
): FormAttributeColumns | undefined => {
  if (!xml) return undefined

  const isAdditional = xml.AdditionalColumns !== undefined

  if (isAdditional) return importAdditionalColumnsFromXML(context, xml.AdditionalColumns)

  return importColumnsFromXML(context, xml.Column)
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

    const column: FormAttributeColumn = {
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

registerTypeRule("FormAttributes", "importFromXML", importFormAttributesFromXML)
registerTypeRule("FormAttributeColumns", "importFromXML", importFormAttributeColumnsFromXML)
