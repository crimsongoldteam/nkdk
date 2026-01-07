import { defaults } from "~/metadata/appliedObjects/metadataCatalog"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
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
    _id: mergedData.id!,
  }

  const title = exportI8nTextToXML(context, mergedData.title)
  if (title) result.Title = title

  const type = exportTypeDescriptionToXML(context, mergedData.valueType)
  if (type) result.Type = type

  if (mergedData.mainAttribute !== undefined) result.MainAttribute = mergedData.mainAttribute

  if (mergedData.storedData !== undefined) result.StoredData = mergedData.storedData

  const use = exportUserVisibleToXML(context, mergedData.use)
  if (use) result.Use = use

  return result
}
