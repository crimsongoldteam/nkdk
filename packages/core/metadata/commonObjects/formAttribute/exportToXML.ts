import { defaults } from "~/metadata/appliedObjects/metadataCatalog"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { TypeDescription } from "~/metadata/commonObjects/typeDescription/types"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { DynamicList } from "../dynamicList/types"
import { exportFunctionalOptionsToXML } from "../functionalOptionsProperty/exportToXML"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "../i8nText/exportToXML"
import {
  FormAttribute,
  FormAttributeColumn,
  FormAttributeColumnXML,
  FormAttributes,
  FormAttributesXML,
  FormAttributeXML,
} from "./types"

export const exportFormAttributesToXML = (
  context: ConfigurationContext,
  data: FormAttributes | undefined
): FormAttributesXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result = data.map((value: FormAttribute) => exportFormAttributeToXML(context, value))

  return result
}

const exportFormAttributeToXML = (context: ConfigurationContext, data: FormAttribute): FormAttributeXML => {
  const mergedData = { ...defaults, ...data }

  const result: FormAttributeXML = {
    _name: mergedData.name,
    _id: getElementId(context),
  }

  if (mergedData.mainAttribute !== undefined) result.MainAttribute = mergedData.mainAttribute

  const isValueListType = mergedData.valueType?.type.includes("ValueListType")
  const isDynamicListValueType = mergedData.valueType?.type.includes("DynamicList")

  const settings = mergedData.settings
  const isDynamicListSettings =
    settings !== undefined && ("@attributes" in settings || (isDynamicListValueType && !("type" in settings)))

  if (isDynamicListSettings) {
    const settingsCopy = { ...(settings as DynamicList) }
    // Remove @attributes if present, we'll set _xsi:type directly
    if ("@attributes" in settingsCopy) {
      delete settingsCopy["@attributes"]
    }
    result.Settings = {
      "_xsi:type": "DynamicList",
      ...settingsCopy,
    }
  } else {
    const typeDescriptionSettings = exportTypeDescriptionToXML(context, settings as TypeDescription | undefined)
    if (typeDescriptionSettings || isValueListType) {
      result.Settings = {
        "_xsi:type": "v8:TypeDescription",
        ...typeDescriptionSettings,
      }
    }
  }
  if (mergedData.columns && mergedData.columns.length > 0) {
    result.Columns = {
      Column: exportFormAttributeColumnsToXML(context, mergedData.columns),
    }
  }

  if (mergedData.storedData !== undefined) result.SavedData = mergedData.storedData

  const title = exportI8nTextToXMLWithDefaultLanguage(context, mergedData.title)
  if (title) result.Title = title

  const type = exportTypeDescriptionToXML(context, mergedData.valueType)
  if (type) result.Type = type

  const use = exportUserVisibleToXML(context, mergedData.use)
  if (use) result.Use = use

  const functionalOptions = exportFunctionalOptionsToXML(context, mergedData.functionalOptions)
  if (functionalOptions) result.FunctionalOptions = functionalOptions

  return result
}

const exportFormAttributeColumnsToXML = (
  context: ConfigurationContext,
  columns: FormAttributeColumn[]
): FormAttributeColumnXML | FormAttributeColumnXML[] => {
  const result = columns.map((column) => {
    const res: FormAttributeColumnXML = {
      _name: column.name,
      _id: column.id || getElementId(context),
    }

    const title = exportI8nTextToXML(context, column.title)
    if (title) res.Title = title

    const type = exportTypeDescriptionToXML(context, column.type)
    if (type) res.Type = type

    const view = exportUserVisibleToXML(context, column.view)
    if (view) res.View = view

    const edit = exportUserVisibleToXML(context, column.edit)
    if (edit) res.Edit = edit

    if (column.fillCheck) {
      res.FillCheck = column.fillCheck
    }

    if (column.columns && column.columns.length > 0) {
      res.Column = exportFormAttributeColumnsToXML(context, column.columns)
    }

    const functionalOptions = exportFunctionalOptionsToXML(context, column.functionalOptions)
    if (functionalOptions) res.FunctionalOptions = functionalOptions

    return res
  })

  return result.length === 1 ? result[0] : result
}
