import { defaults } from "~/metadata/appliedObjects/metadataCatalog"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { DynamicList } from "../dynamicList/types"
import { exportFieldsListToXML } from "../fieldsList/exportToXML"
import { exportFunctionalOptionsToXML } from "../functionalOptionsProperty/exportToXML"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "../i8nText/exportToXML"
import { TypeDescription } from "../typeDescription/types"
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

  if (mergedData.columns && mergedData.columns.length > 0) {
    result.Columns = {
      Column: exportFormAttributeColumnsToXML(context, mergedData.columns),
    }
  }

  const edit = exportUserVisibleToXML(context, mergedData.edit)
  if (edit) result.Edit = edit

  if (mergedData.fillCheck !== undefined) result.FillCheck = mergedData.fillCheck

  const functionalOptions = exportFunctionalOptionsToXML(context, mergedData.functionalOptions)
  if (functionalOptions) result.FunctionalOptions = functionalOptions

  if (mergedData.mainAttribute !== undefined) result.MainAttribute = mergedData.mainAttribute

  const save = exportFieldsListToXML(context, mergedData.save)
  if (save) result.Save = save

  if (mergedData.storedData !== undefined) result.SavedData = mergedData.storedData

  const settings = exportFormAttributeSettingsToXML(context, mergedData.settings, mergedData.valueType)
  if (settings) {
    result.Settings = settings
  }

  const title = exportI8nTextToXMLWithDefaultLanguage(context, mergedData.title)
  if (title) result.Title = title

  const type = exportTypeDescriptionToXML(context, mergedData.valueType)
  if (type) result.Type = type

  const fieldsList = exportFieldsListToXML(context, mergedData.fieldsList)
  if (fieldsList) result.UseAlways = fieldsList

  const view = exportUserVisibleToXML(context, mergedData.view)
  if (view) result.View = view

  return result
}

const exportFormAttributeSettingsToXML = (
  context: ConfigurationContext,
  settings: FormAttribute["settings"],
  valueType: FormAttribute["valueType"]
): FormAttributeXML["Settings"] => {
  const isValueListType = valueType?.type.includes("ValueListType")
  const isDynamicListValueType = valueType?.type.includes("DynamicList")

  const isDynamicListSettings =
    settings !== undefined && ("@attributes" in settings || (isDynamicListValueType && !("type" in settings)))

  if (isDynamicListSettings) {
    const settingsCopy = { ...(settings as DynamicList) }
    // Remove @attributes if present, we'll set _xsi:type directly
    if ("@attributes" in settingsCopy) {
      delete settingsCopy["@attributes"]
    }
    return {
      "_xsi:type": "DynamicList",
      ...settingsCopy,
    }
  } else {
    const typeDescriptionSettings = exportTypeDescriptionToXML(context, settings as TypeDescription | undefined)
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
  columns: FormAttributeColumn[]
): FormAttributeColumnXML | FormAttributeColumnXML[] => {
  const result = columns.map((column) => {
    const res: FormAttributeColumnXML = {
      _name: column.name,
      _id: getElementId(context),
    }

    if (column.columns && column.columns.length > 0) {
      res.Column = exportFormAttributeColumnsToXML(context, column.columns)
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

    const functionalOptions = exportFunctionalOptionsToXML(context, column.functionalOptions)
    if (functionalOptions) res.FunctionalOptions = functionalOptions

    return res
  })

  return result.length === 1 ? result[0] : result
}
