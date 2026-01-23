import { defaults } from "~/metadata/appliedObjects/metadataCatalog"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { exportI8nTextToXMLWithDefaultLanguage } from "../i8nText/exportToXML"
import { FormAttribute, FormAttributes, FormAttributesXML, FormAttributeXML } from "./types"

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

  const isValueListType = mergedData.valueType?.type.includes("ValueListType")

  const settings = exportTypeDescriptionToXML(context, mergedData.settings)
  if (settings || isValueListType) {
    result.Settings = {
      "_xsi:type": "v8:TypeDescription",
      ...settings,
    }
  }

  if (mergedData.mainAttribute !== undefined) result.MainAttribute = mergedData.mainAttribute

  if (mergedData.storedData !== undefined) result.SavedData = mergedData.storedData

  const title = exportI8nTextToXMLWithDefaultLanguage(context, mergedData.title)
  if (title) result.Title = title

  const type = exportTypeDescriptionToXML(context, mergedData.valueType)
  if (type) result.Type = type

  const use = exportUserVisibleToXML(context, mergedData.use)
  if (use) result.Use = use

  return result
}
