import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ElementXML, exportPropertiesToXML, registerTypeRule } from "~/metadata/orchestration"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import {
  FormAttribute,
  FormAttributeAdditionalColumns,
  FormAttributeAdditionalColumnXML,
  FormAttributeColumn,
  FormAttributeColumnsXML,
  FormAttributeColumnXML,
  FormAttributes,
  FormAttributeWithAdditionalColumns,
  FormAttributeXML,
} from "./types"

export const exportFormAttributesToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  data: FormAttributes | undefined,
  referenceData?: FormAttributes | undefined
): { Attribute: ElementXML[] } | undefined => {
  if (data === undefined || data === null) return undefined
  if (data.length === 0) return { Attribute: [] }

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

  const columns = exportColumnsToXML(context, data.columns, referenceData?.columns, data)
  const additionalColumns = exportAdditionalColumnsToXML(
    context,
    (data as FormAttributeWithAdditionalColumns).additionalColumns ?? [],
    (referenceData as FormAttributeWithAdditionalColumns | undefined)?.additionalColumns,
    data
  )

  const columnsXML =
    columns || additionalColumns
      ? {
          ...(columns ? { Column: columns.Column } : {}),
          ...(additionalColumns ? { AdditionalColumns: additionalColumns.AdditionalColumns } : {}),
        }
      : undefined

  if (columnsXML && !shouldPlaceColumnsAfterProperties(referenceData)) {
    result.Columns = {
      ...columnsXML,
    }
  }

  Object.assign(result, properties)

  if (columnsXML && shouldPlaceColumnsAfterProperties(referenceData)) {
    result.Columns = {
      ...columnsXML,
    }
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

  return result
}

const findReferenceAttribute = (
  data: FormAttribute,
  referenceData: FormAttributes | undefined
): FormAttribute | undefined => {
  if (!referenceData) return undefined
  return referenceData.find((referenceItem) => referenceItem.name === data.name)
}

const findReferenceColumn = (
  data: FormAttributeColumn,
  referenceData: FormAttributeColumn[] | undefined
): FormAttributeColumn | undefined => {
  if (!referenceData) return undefined
  return referenceData.find((referenceItem) => referenceItem.name === data.name)
}

const shouldPlaceColumnsAfterProperties = (referenceData: FormAttribute | undefined): boolean => {
  if (!referenceData) return false

  const keys = Object.keys(referenceData)
  const columnsIndex = keys.indexOf("columns")
  if (columnsIndex < 0) return false

  return keys.slice(0, columnsIndex).some((key) => key !== "itemType" && key !== "id" && key !== "name")
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
  _rule: PropertyRule | undefined,
  columns: FormAttributeColumn[] | undefined,
  referenceColumns?: FormAttributeColumn[] | undefined
): FormAttributeColumnsXML | undefined => {
  return exportColumnsToXML(context, columns ?? [], referenceColumns)
}

const exportColumnsToXML = (
  context: ConfigurationContextWithExportToXML,
  columns: FormAttributeColumn[],
  referenceColumns?: FormAttributeColumn[] | undefined,
  numberingScope?: unknown
): { Column: FormAttributeColumnXML[] } | undefined => {
  const result = columns.map((column) => {
    const referenceColumn = findReferenceColumn(column, referenceColumns)
    const result: FormAttributeColumnXML = {
      _name: column.name,
      _id: "",
    }

    context.exportToXML?.context?.metadataForNumbering.push({
      element: column,
      referenceElement: referenceColumn,
      xmlElement: result,
      numberingScope,
    })

    const properties = exportPropertiesToXML({
      context,
      metadata: column,
      referenceMetadata: referenceColumn,
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
  additionalColumns: FormAttributeAdditionalColumns[],
  referenceAdditionalColumns?: FormAttributeAdditionalColumns[] | undefined,
  numberingScope?: unknown
): { AdditionalColumns: FormAttributeAdditionalColumnXML[] } | undefined => {
  const result: FormAttributeAdditionalColumnXML[] = additionalColumns.map((additionalColumn) => {
    const referenceAdditionalColumn = referenceAdditionalColumns?.find(
      (referenceItem) => referenceItem.table === additionalColumn.table
    )
    const columns = exportColumnsToXML(
      context,
      additionalColumn.columns,
      referenceAdditionalColumn?.columns,
      numberingScope
    )

    return {
      _table: additionalColumn.table,
      ...(columns ? { Column: columns.Column } : {}),
    }
  })

  if (result.length === 0) return undefined

  return { AdditionalColumns: result }
}

const exportFormAttributeAdditionalColumnsToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  additionalColumns: FormAttributeAdditionalColumns[] | undefined,
  referenceAdditionalColumns?: FormAttributeAdditionalColumns[] | undefined
): { AdditionalColumns: FormAttributeAdditionalColumnXML[] } | undefined => {
  return exportAdditionalColumnsToXML(context, additionalColumns ?? [], referenceAdditionalColumns)
}

registerTypeRule("FormAttributes", "exportToXML", exportFormAttributesToXML)
registerTypeRule("FormAttributeColumns", "exportToXML", exportFormAttributeColumnsToXML)
registerTypeRule("FormAttributeAdditionalColumns", "exportToXML", exportFormAttributeAdditionalColumnsToXML)
// registerTypeRule("FormAttributeSettings", "exportToXML", exportFormAttributeSettingsToXML)
