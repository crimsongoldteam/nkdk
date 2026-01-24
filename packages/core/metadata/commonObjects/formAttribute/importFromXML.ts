import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { importDynamicListFromXML } from "../dynamicList/importFromXML"
import { DynamicListXML } from "../dynamicList/types"
import { importFunctionalOptionsFromXML } from "../functionalOptionsProperty/importFromXML"
import {
  FormAttribute,
  FormAttributeColumn,
  FormAttributeColumnXML,
  FormAttributes,
  FormAttributesXML,
  FormAttributeXML,
} from "./types"
import { importUseAlwaysFromXML } from "../useAlways/importFromXML"

export const importFormAttributesFromXML = (
  context: ConfigurationContext,
  xml: FormAttributesXML | undefined
): FormAttributes | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => importFormAttributeFromXML(context, item as FormAttributeXML))
}

const importFormAttributeFromXML = (context: ConfigurationContext, props: FormAttributeXML): FormAttribute => {
  const title = importI8nTextFromXML(context, props.Title) ?? { items: { [context.defaultLanguage]: "" } }

  const result: FormAttribute = {
    name: props._name,
    title,
  }

  const valueType = importTypeDescriptionFromXML(context, props.Type)!
  result.valueType = valueType

  const mainAttribute = importBooleanFromXML(context, props.MainAttribute)
  if (mainAttribute !== undefined) result.mainAttribute = mainAttribute

  const storedData = importBooleanFromXML(context, props.SavedData)
  if (storedData !== undefined) result.storedData = storedData

  if (props.FillCheck !== undefined) result.fillCheck = props.FillCheck

  // Check if Settings is a DynamicList (has _xsi:type indicating DynamicList) or TypeDescription
  if (props.Settings !== undefined) {
    const settingsAsAny = props.Settings as any
    if (settingsAsAny["_xsi:type"] === "DynamicList" || settingsAsAny["_xsi:type"] === "v8:DynamicList") {
      const dynamicList = importDynamicListFromXML(context, props.Settings as DynamicListXML)
      if (dynamicList !== undefined) result.settings = dynamicList
    } else {
      const settings = importTypeDescriptionFromXML(context, props.Settings)
      if (settings !== undefined) result.settings = settings
    }
  }

  const use = importUserVisibleFromXML(context, props.Use)
  if (use !== undefined) result.use = use

  if (props.Columns !== undefined) {
    result.columns = importFormAttributeColumnsFromXML(context, props.Columns.Column)
  }

  const functionalOptions = importFunctionalOptionsFromXML(context, props.FunctionalOptions)
  if (functionalOptions !== undefined) result.functionalOptions = functionalOptions

  const useAlways = importUseAlwaysFromXML(context, props.UseAlways)
  if (useAlways !== undefined) result.useAlways = useAlways

  return result
}

const importFormAttributeColumnsFromXML = (
  context: ConfigurationContext,
  xml: FormAttributeColumnXML | FormAttributeColumnXML[] | undefined
): FormAttributeColumn[] | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => {
    const column: FormAttributeColumn = {
      name: item._name,
      id: item._id,
    }

    const title = importI8nTextFromXML(context, item.Title)
    if (title) column.title = title

    const type = importTypeDescriptionFromXML(context, item.Type)
    if (type) column.type = type

    const view = importUserVisibleFromXML(context, item.View)
    if (view) column.view = view

    const edit = importUserVisibleFromXML(context, item.Edit)
    if (edit) column.edit = edit

    if (item.FillCheck) {
      column.fillCheck = item.FillCheck
    }

    if (item.Column) {
      column.columns = importFormAttributeColumnsFromXML(context, item.Column)
    }

    const functionalOptions = importFunctionalOptionsFromXML(context, item.FunctionalOptions)
    if (functionalOptions !== undefined) column.functionalOptions = functionalOptions

    return column
  })
}
