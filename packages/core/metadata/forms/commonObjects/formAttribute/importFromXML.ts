import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importPropertiesFromXML, registerTypeRule } from "~/metadata/metadataFactory"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
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

  return items.map((item) => importFormAttributeFromXML(context, item as FormAttributeXML))
}

const importFormAttributeFromXML = (context: ConfigurationContext, xml: FormAttributeXML): FormAttribute => {
  // const title = importI8nTextFromXML(context, { type: "I8nText" }, props.Title) ?? {
  //   items: { [context.defaultLanguage]: "" },
  // }

  const properties = importPropertiesFromXML({
    context: context,
    xml,
    rule: FormAttributeRules,
  })

  const result: FormAttribute = {
    itemType: "FormAttribute",
    name: xml._name,
    ...properties,
  }

  // const valueType = importTypeDescriptionFromXML(context, undefined, props.Type)!
  // result.valueType = valueType

  // const mainAttribute = importBooleanFromXML(context, undefined, props.MainAttribute)
  // if (mainAttribute !== undefined) result.mainAttribute = mainAttribute

  // const storedData = importBooleanFromXML(context, undefined, props.SavedData)
  // if (storedData !== undefined) result.storedData = storedData

  // if (props.FillCheck !== undefined) result.fillCheck = props.FillCheck

  // const view = importUserVisibleFromXML(context, undefined, props.View ?? props.Use)
  // if (view) result.view = view

  // const edit = importUserVisibleFromXML(context, undefined, props.Edit ?? props.Use)
  // if (edit) result.edit = edit

  // // Check if Settings is a DynamicList (has _xsi:type indicating DynamicList) or TypeDescription
  // if (props.Settings !== undefined) {
  //   const settingsAsAny = props.Settings as any
  //   if (settingsAsAny["_xsi:type"] === "DynamicList" || settingsAsAny["_xsi:type"] === "v8:DynamicList") {
  //     const dynamicList = importDynamicListFromXML(context, undefined, props.Settings as DynamicListXML)
  //     if (dynamicList !== undefined) result.settings = dynamicList
  //   } else {
  //     const settings = importTypeDescriptionFromXML(context, undefined, props.Settings)
  //     if (settings !== undefined) result.settings = settings
  //   }
  // }

  // if (props.Columns !== undefined) {
  //   result.columns = importFormAttributeColumnsFromXML(context, undefined, props.Columns.Column)
  //   if (props.Columns.AdditionalColumns !== undefined) {
  //     result.additionalColumns = importFormAttributeAdditionalColumnsFromXML(
  //       context,
  //       undefined,
  //       props.Columns.AdditionalColumns
  //     )
  //   }
  // }

  // const functionalOptions = importFunctionalOptionsFromXML(context, undefined, props.FunctionalOptions)
  // if (functionalOptions !== undefined) result.functionalOptions = functionalOptions

  // const fieldsList = importFieldsListFromXML(context, undefined, props.UseAlways)
  // if (fieldsList !== undefined) result.fieldsList = fieldsList

  // const save = importFieldsListFromXML(context, undefined, props.Save)
  // if (save !== undefined) result.save = save

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

registerTypeRule("FormAttributes", "importFromXML", importFormAttributesFromXML)
registerTypeRule("FormAttributeColumns", "importFromXML", importFormAttributeColumnsFromXML)
// registerTypeRule("FormAttributeAdditionalColumns", "importFromXML", exportFormAttributeAdditionalColumnsToXML)
// registerTypeRule("FormAttributeSettings", "importFromXML", exportFormAttributeSettingsToXML as ExportToXMLFunctionNew)
