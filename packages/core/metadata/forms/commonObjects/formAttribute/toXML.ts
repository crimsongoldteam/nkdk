import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ElementXML, exportPropertiesToXML, registerTypeRule } from "~/metadata/orchestration"
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
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  data: FormAttributes | undefined,
  referenceData?: FormAttributes | undefined
): { Attribute: ElementXML[] } | undefined => {
  if (!data || data.length === 0) return undefined

  const result = data.map((value: FormAttribute) => {
    const referenceAttribute = findReferenceAttribute(value, referenceData)
    return exportFormAttributeToXML(context, undefined, value, referenceAttribute)
  })

  return { Attribute: result }
}

export const exportFormAttributeColumnToXML = (
  context: ConfigurationContextWithExportToXML,
  data: FormAttributeColumn | undefined
): FormAttributeColumnXML | undefined => {
  if (!data) return undefined

  const columns = exportColumnsToXML(context, [data])

  return columns?.Column?.[0]
}

const exportFormAttributeToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  data: FormAttribute,
  referenceData?: FormAttribute
): ElementXML => {
  const result: FormAttributeXML = {
    _name: data.name,
    _id: "",
  }

  context.exportToXML?.context?.metadataForNumbering.push({
    element: data,
    referenceElement: referenceData,
    xmlElement: result,
  })

  const properties = exportPropertiesToXML({
    context,
    metadata: data,
    referenceMetadata: referenceData,
    rule: FormAttributeRules,
  })

  Object.assign(result, properties)

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

  return result
}

const findReferenceAttribute = (
  data: FormAttribute,
  referenceData: FormAttributes | undefined
): FormAttribute | undefined => {
  if (!referenceData) return undefined
  return referenceData.find((referenceItem) => referenceItem.name === data.name)
}

// const exportFormAttributeSettingsToXML = (params: {
//   context: ConfigurationContext
//   rule: PropertyRule | undefined
//   value: FormAttribute["valueType"]
//   metadataItem: FormAttribute
// }): FormAttributeXML["Settings"] => {
//   const { context, value, metadataItem } = params

//   const valueType = metadataItem.valueType

//   const isValueListType = valueType?.type.includes("ValueListType")
//   const isDynamicListValueType = valueType?.type.includes("DynamicList")

//   const isDynamicListSettings =
//     value !== undefined && ("@attributes" in value || (isDynamicListValueType && !("type" in value)))

//   if (isDynamicListSettings) {
//     const settingsCopy = { ...(value as unknown as DynamicList) }
//     if ("@attributes" in settingsCopy) {
//       delete settingsCopy["@attributes"]
//     }
//     return {
//       "_xsi:type": "DynamicList",
//       ...settingsCopy,
//     }
//   } else {
//     const typeDescriptionSettings = exportTypeDescriptionToXML(context, undefined, value as TypeDescription | undefined)
//     if (typeDescriptionSettings || isValueListType) {
//       return {
//         "_xsi:type": "v8:TypeDescription",
//         ...typeDescriptionSettings,
//       }
//     }
//   }

//   return undefined
// }

const exportFormAttributeColumnsToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
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
  context: ConfigurationContextWithExportToXML,
  columns: FormAttributeColumn[]
): { Column: FormAttributeColumnXML[] } | undefined => {
  const result = columns.map((column) => {
    const result: FormAttributeColumnXML = {
      _name: column.name,
      _id: "",
    }

    context.exportToXML?.context?.metadataForNumbering.push({
      element: column,
      referenceElement: undefined,
      xmlElement: result,
    })

    const properties = exportPropertiesToXML({
      context,
      metadata: column,
      rule: FormAttributeColumnRules,
    })

    Object.assign(result, properties)

    return result
  })

  if (result.length === 0) return undefined

  return { Column: result }
}

const exportAdditionalColumnsToXML = (
  context: ConfigurationContextWithExportToXML,
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
// registerTypeRule("FormAttributeSettings", "exportToXML", exportFormAttributeSettingsToXML)
