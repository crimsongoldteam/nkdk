import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/toXML"
import { TypeDescription } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getElementId } from "~/metadata/helpers/getElementId"
import { ElementXML, exportPropertiesToXML, ExportToXMLFunctionNew, registerTypeRule } from "~/metadata/metadataFactory"
import { DynamicList } from "../dynamicList/types"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import {
  FormAttribute,
  FormAttributeAdditionalColumn,
  FormAttributeAdditionalColumnXML,
  FormAttributeColumn,
  FormAttributeColumns,
  FormAttributeColumnsXML,
  FormAttributeColumnXML,
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

  if (data.type?.type.includes("ValueListType") || result.Settings !== undefined) {
    result.Settings = {
      "_xsi:type": "v8:TypeDescription",
      ...result.Settings,
    }
  }

  // const settings = exportFormAttributeSettingsToXML(context, undefined, mergedData.settings, mergedData.valueType)
  // if (settings) {
  //   result.Settings = settings
  // }

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
  columns: FormAttributeColumns
): FormAttributeColumnsXML | undefined => {
  if (columns.length === 0) return undefined

  const isAdditionalColumns = "table" in columns[0]

  if (isAdditionalColumns) {
    return exportAdditionalColumnsToXML(context, columns as FormAttributeAdditionalColumn[])
  }

  return exportColumnsToXML(context, columns as FormAttributeColumn[])
}

const exportColumnsToXML = (
  context: ConfigurationContext,
  columns: FormAttributeColumn[]
): { Column: FormAttributeColumnXML[] } | undefined => {
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

const exportAdditionalColumnsToXML = (
  context: ConfigurationContext,
  additionalColumns: FormAttributeAdditionalColumn[]
): { AdditionalColumns: FormAttributeAdditionalColumnXML[] } | undefined => {
  const result: FormAttributeAdditionalColumnXML[] = additionalColumns.map((additionalColumn) => {
    const columns = exportColumnsToXML(context, additionalColumn.columns)

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
registerTypeRule("FormAttributeSettings", "exportToXML", exportFormAttributeSettingsToXML as ExportToXMLFunctionNew)
