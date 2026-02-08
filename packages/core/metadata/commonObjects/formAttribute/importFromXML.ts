import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { importDynamicListFromXML } from "../dynamicList/importFromXML"
import { DynamicListXML } from "../dynamicList/types"
import { importFieldsListFromXML } from "../fieldsList/importFromXML"
import { importFunctionalOptionsFromXML } from "../functionalOptionsProperty/importFromXML"
import {
  FormAttribute,
  FormAttributeAdditionalColumn,
  FormAttributeColumn,
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

  return items.map((item) => importFormAttributeFromXML(context, undefined, item as FormAttributeXML))
}

const importFormAttributeFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  props: FormAttributeXML
): FormAttribute => {
  const title = importI8nTextFromXML(context, undefined, props.Title) ?? { items: { [context.defaultLanguage]: "" } }

  const result: FormAttribute = {
    name: props._name,
    title,
  }

  const valueType = importTypeDescriptionFromXML(context, undefined, props.Type)!
  result.valueType = valueType

  const mainAttribute = importBooleanFromXML(context, undefined, props.MainAttribute)
  if (mainAttribute !== undefined) result.mainAttribute = mainAttribute

  const storedData = importBooleanFromXML(context, undefined, props.SavedData)
  if (storedData !== undefined) result.storedData = storedData

  if (props.FillCheck !== undefined) result.fillCheck = props.FillCheck

  const view = importUserVisibleFromXML(context, undefined, props.View ?? props.Use)
  if (view) result.view = view

  const edit = importUserVisibleFromXML(context, undefined, props.Edit ?? props.Use)
  if (edit) result.edit = edit

  // Check if Settings is a DynamicList (has _xsi:type indicating DynamicList) or TypeDescription
  if (props.Settings !== undefined) {
    const settingsAsAny = props.Settings as any
    if (settingsAsAny["_xsi:type"] === "DynamicList" || settingsAsAny["_xsi:type"] === "v8:DynamicList") {
      const dynamicList = importDynamicListFromXML(context, undefined, props.Settings as DynamicListXML)
      if (dynamicList !== undefined) result.settings = dynamicList
    } else {
      const settings = importTypeDescriptionFromXML(context, undefined, props.Settings)
      if (settings !== undefined) result.settings = settings
    }
  }

  if (props.Columns !== undefined) {
    result.columns = importFormAttributeColumnsFromXML(context, undefined, props.Columns.Column)
    if (props.Columns.AdditionalColumns !== undefined) {
      result.additionalColumns = importFormAttributeAdditionalColumnsFromXML(
        context,
        undefined,
        props.Columns.AdditionalColumns
      )
    }
  }

  const functionalOptions = importFunctionalOptionsFromXML(context, undefined, props.FunctionalOptions)
  if (functionalOptions !== undefined) result.functionalOptions = functionalOptions

  const fieldsList = importFieldsListFromXML(context, undefined, props.UseAlways)
  if (fieldsList !== undefined) result.fieldsList = fieldsList

  const save = importFieldsListFromXML(context, undefined, props.Save)
  if (save !== undefined) result.save = save

  return result
}

const importFormAttributeColumnsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: FormAttributeColumnXML | FormAttributeColumnXML[] | undefined
): FormAttributeColumn[] | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => {
    const column: FormAttributeColumn = {
      name: item._name,
      id: item._id,
    }

    const title = importI8nTextFromXML(context, undefined, item.Title)
    if (title) column.title = title

    const type = importTypeDescriptionFromXML(context, undefined, item.Type)
    if (type) column.type = type

    const view = importUserVisibleFromXML(context, undefined, item.View)
    if (view) column.view = view

    const edit = importUserVisibleFromXML(context, undefined, item.Edit)
    if (edit) column.edit = edit

    if (item.FillCheck) {
      column.fillCheck = item.FillCheck
    }

    if (item.Column) {
      column.columns = importFormAttributeColumnsFromXML(context, undefined, item.Column)
    }

    const functionalOptions = importFunctionalOptionsFromXML(context, undefined, item.FunctionalOptions)
    if (functionalOptions !== undefined) column.functionalOptions = functionalOptions

    return column
  })
}

const importFormAttributeAdditionalColumnsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml:
    | { _table: string; Column: FormAttributeColumnXML | FormAttributeColumnXML[] }
    | { _table: string; Column: FormAttributeColumnXML | FormAttributeColumnXML[] }[]
    | undefined
): FormAttributeAdditionalColumn[] | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => ({
    table: item._table,
    columns: importFormAttributeColumnsFromXML(context, undefined, item.Column)!,
  }))
}
