import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getElementId } from "~/metadata/helpers/getElementId"
import { ElementXML, exportPropertiesToXML, ExportToXMLFunctionNew, registerTypeRule } from "~/metadata/metadataFactory"
import { DynamicList } from "../dynamicList/types"
import { TypeDescription } from "../typeDescription/types"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import {
  FormAttribute,
  FormAttributeAdditionalColumn,
  FormAttributeAdditionalColumnXML,
  FormAttributeColumn,
  FormAttributes,
  FormAttributeXML,
} from "./types"

export const exportFormAttributesToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttributes | undefined
): { Attribute: ElementXML[] } | undefined => {
  if (!data || data.length === 0) return undefined

  const result = data.map((value: FormAttribute) => exportFormAttributeToXML(context, undefined, value))

  return { Attribute: result }
}

const exportFormAttributeToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttribute
): ElementXML => {
  // const mergedData = { ...defaults, ...data }

  const id = getElementId(context)

  const properties = exportPropertiesToXML({
    context,
    metadataItem: data,
    rule: FormAttributeRules,
  })

  const result: FormAttributeXML = {
    _name: data.name,
    _id: id,
    ...properties,
  }

  // if (mergedData.columns && mergedData.columns.length > 0) {
  //   result.Columns = {
  //     Column: exportFormAttributeColumnsToXML(context, undefined, mergedData.columns),
  //   }
  // }

  // if (mergedData.additionalColumns && mergedData.additionalColumns.length > 0) {
  //   const additionalColumnsXML = exportFormAttributeAdditionalColumnsToXML(
  //     context,
  //     undefined,
  //     mergedData.additionalColumns
  //   )
  //   if (!result.Columns) {
  //     result.Columns = { Column: [] }
  //   }
  //   result.Columns.AdditionalColumns = additionalColumnsXML
  // }

  // const edit = exportUserVisibleToXML(context, undefined, mergedData.edit)
  // if (edit) result.Edit = edit

  // if (mergedData.fillCheck !== undefined) result.FillCheck = mergedData.fillCheck

  // const functionalOptions = exportFunctionalOptionsToXML(context, undefined, mergedData.functionalOptions)
  // if (functionalOptions) result.FunctionalOptions = functionalOptions

  // if (mergedData.mainAttribute !== undefined) result.MainAttribute = mergedData.mainAttribute

  // const save = exportFieldsListToXML(context, undefined, mergedData.save)
  // if (save) result.Save = save

  // if (mergedData.storedData !== undefined) result.SavedData = mergedData.storedData

  // const settings = exportFormAttributeSettingsToXML(context, undefined, mergedData.settings, mergedData.valueType)
  // if (settings) {
  //   result.Settings = settings
  // }

  // const title = exportI8nTextToXMLWithDefaultLanguage(context, undefined, mergedData.title)
  // if (title) result.Title = title

  // const type = exportTypeDescriptionToXML(context, undefined, mergedData.valueType)
  // if (type) result.Type = type

  // const fieldsList = exportFieldsListToXML(context, undefined, mergedData.fieldsList)
  // if (fieldsList) result.UseAlways = fieldsList

  // const view = exportUserVisibleToXML(context, undefined, mergedData.view)
  // if (view) result.View = view

  return sortObject(result)
}

const exportFormAttributeSettingsToXML = (params: {
  context: ConfigurationContext
  rule: PropertyRule<any> | undefined
  value: FormAttribute["settings"]
  metadataItem: FormAttribute
}): FormAttributeXML["Settings"] => {
  const { context, value, metadataItem } = params

  const valueType = metadataItem.valueType

  const isValueListType = valueType?.type.includes("ValueListType")
  const isDynamicListValueType = valueType?.type.includes("DynamicList")

  const isDynamicListSettings =
    value !== undefined && ("@attributes" in value || (isDynamicListValueType && !("type" in value)))

  if (isDynamicListSettings) {
    const settingsCopy = { ...(value as DynamicList) }
    if ("@attributes" in settingsCopy) {
      delete settingsCopy["@attributes"]
    }
    return {
      "_xsi:type": "DynamicList",
      ...settingsCopy,
    }
  } else {
    const typeDescriptionSettings = exportTypeDescriptionToXML(context, undefined, value as TypeDescription | undefined)
    if (typeDescriptionSettings || isValueListType) {
      return {
        "_xsi:type": "v8:TypeDescription",
        ...typeDescriptionSettings,
      }
    }
  }

  return undefined
}

const exportFormAttributeColumnsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  columns: FormAttributeColumn[]
): { Column: ElementXML[] } | undefined => {
  const result = columns.map((column) => {
    const id = getElementId(context)

    const properties = exportPropertiesToXML({
      context,
      metadataItem: column,
      rule: FormAttributeColumnRules,
    })

    return {
      _name: column.name,
      _id: id,
      ...properties,
    }
  })

  if (result.length === 0) return undefined

  return { Column: result }
}

const exportFormAttributeAdditionalColumnsToXML = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  additionalColumns: FormAttributeAdditionalColumn[]
): { AdditionalColumns: FormAttributeAdditionalColumnXML[] } | undefined => {
  const result: FormAttributeAdditionalColumnXML[] = additionalColumns.map((additionalColumn) => {
    const columns = exportFormAttributeColumnsToXML(context, rule, additionalColumn.columns)

    return {
      _table: additionalColumn.table,
      ...(columns ? { Column: columns.Column } : {}),
    }
  })

  if (result.length === 0) return undefined

  return { AdditionalColumns: result }
}

registerTypeRule("FormAttributes", "exportToXML", exportFormAttributesToXML)
registerTypeRule("FormAttributeColumns", "exportToXML", exportFormAttributeColumnsToXML)
registerTypeRule("FormAttributeAdditionalColumns", "exportToXML", exportFormAttributeAdditionalColumnsToXML)
registerTypeRule("FormAttributeSettings", "exportToXML", exportFormAttributeSettingsToXML as ExportToXMLFunctionNew)
