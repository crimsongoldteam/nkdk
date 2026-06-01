import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { restoreKnownDuplicateErpAdditionalColumns } from "~/metadata/forms/knownAnomalies"
import { ElementXML, exportPropertiesToXML, registerTypeRule } from "~/metadata/orchestration"
import { XML_SOURCE_KEYS } from "~/metadata/orchestration/property/helpers"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import { exportTypedFormAttributeSettingsToXML } from "./settings"
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

  assignPropertiesWithColumns(result, properties, columnsXML, referenceData)

  const typedSettings = exportTypedFormAttributeSettingsToXML(context, data, referenceData)
  if (typedSettings !== undefined) {
    result.Settings = typedSettings
  }

  const shouldPreserveEmptyTypeDescriptionSettings =
    result.Settings === undefined &&
    referenceData !== undefined &&
    hasReferenceXMLSourceKey(referenceData, "valueType") &&
    referenceData.valueType === undefined

  if (typedSettings === undefined && (result.Settings !== undefined || shouldPreserveEmptyTypeDescriptionSettings)) {
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

const hasReferenceXMLSourceKey = (referenceData: FormAttribute, key: string): boolean => {
  const sourceKeys = (referenceData as Record<PropertyKey, unknown>)[XML_SOURCE_KEYS]
  return sourceKeys !== undefined && sourceKeys !== null && typeof sourceKeys === "object"
    ? Object.prototype.hasOwnProperty.call(sourceKeys, key)
    : false
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

const assignPropertiesWithColumns = (
  result: FormAttributeXML,
  properties: Record<string, unknown>,
  columnsXML: FormAttributeColumnsXML | undefined,
  referenceData: FormAttribute | undefined
): void => {
  if (!columnsXML) {
    Object.assign(result, properties)
    return
  }

  const insertIndex = getReferenceColumnsInsertIndex(referenceData, properties)
  if (insertIndex === undefined) {
    result.Columns = columnsXML
    Object.assign(result, properties)
    return
  }

  const propertyEntries = Object.entries(properties)
  const safeInsertIndex = Math.max(0, Math.min(insertIndex, propertyEntries.length))

  for (const [index, [key, value]] of propertyEntries.entries()) {
    if (index === safeInsertIndex) {
      result.Columns = columnsXML
    }
    ;(result as Record<string, unknown>)[key] = value
  }

  if (safeInsertIndex === propertyEntries.length) {
    result.Columns = columnsXML
  }
}

const getReferenceColumnsInsertIndex = (
  referenceData: FormAttribute | undefined,
  properties: Record<string, unknown>
): number | undefined => {
  if (!referenceData) return undefined
  const keys = Object.keys(referenceData)
  const columnsIndex = keys.indexOf("columns")
  if (columnsIndex < 0) return undefined

  return keys.slice(0, columnsIndex).filter((key) => isExportedPropertyKey(key, properties)).length
}

const isExportedPropertyKey = (key: string, properties: Record<string, unknown>): boolean => {
  if (key === "itemType" || key === "id" || key === "name" || key === "columns" || key === "additionalColumns") {
    return false
  }

  const rule = FormAttributeRules.properties[key as keyof typeof FormAttributeRules.properties]
  const xmlKey = rule !== undefined && "xml" in rule && rule.xml !== undefined ? rule.xml : capitalize(key)

  return xmlKey in properties
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
    const restoredColumnNodes = restoreKnownDuplicateErpAdditionalColumns({
      currentXMLPath: context.exportToXML.context?.currentXMLPath,
      table: additionalColumn.table,
      columnName: additionalColumn.columns[0]?.name,
      columnsCount: additionalColumn.columns.length,
      column: columns?.Column?.[0],
    })
    const columnNodes = restoredColumnNodes ?? columns?.Column

    return {
      _table: additionalColumn.table,
      ...(columnNodes ? { Column: columnNodes } : {}),
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
