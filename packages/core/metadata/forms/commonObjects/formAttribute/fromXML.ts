import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importPropertiesFromXML, registerTypeRule } from "~/metadata/metadataFactory"
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
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: FormAttributesXML | undefined
): FormAttributes | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => importFormAttributeFromXML(context, item as FormAttributeXML))
}

const importFormAttributeFromXML = (context: ConfigurationContext, xml: FormAttributeXML): FormAttribute => {
  const properties = importPropertiesFromXML({
    context: context,
    xml,
    rule: FormAttributeRules,
  })

  const result: FormAttribute = {
    itemType: "FormAttribute",
    name: xml._name,
    title: properties!.title!,
    columns: [],
    ...properties,
  }

  return result
}

const importFormAttributeColumnsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: FormAttributeColumnsXML | undefined
): FormAttributeColumns | undefined => {
  if (!xml) return undefined

  const isAdditional = xml.AdditionalColumns !== undefined

  if (isAdditional) return importAdditionalColumnsFromXML(context, xml.AdditionalColumns)

  return importColumnsFromXML(context, xml.Column)
}

const importColumnsFromXML = (
  context: ConfigurationContext,
  xml: FormAttributeColumnXML | FormAttributeColumnXML[] | undefined
): FormAttributeColumn[] => {
  if (!xml) return []

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => {
    const properties = importPropertiesFromXML({
      context: context,
      xml: item,
      rule: FormAttributeColumnRules,
    })

    const column: FormAttributeColumn = {
      itemType: "FormAttributeColumn",
      name: item._name,
      ...properties,
    }

    return column
  })
}

const importAdditionalColumnsFromXML = (
  context: ConfigurationContext,
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
