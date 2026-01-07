import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { getDefaultsFormAttribute } from "./defaults"
import { FormAttribute, FormAttributes, FormAttributesXML, FormAttributeXML } from "./types"

export const exportFormAttributesToXML = (
  context: ConfigurationContext,
  data: FormAttributes | undefined
): FormAttributesXML | undefined => {
  if (!data) return undefined

  const result = data.map(
    (value: FormAttribute) => exportFormAttributeToXML(context, value, getDefaultsFormAttribute(context, value))!
  )

  return result
}

const exportFormAttributeToXML = (
  context: ConfigurationContext,
  data: FormAttribute,
  defaults: Partial<FormAttribute>
): FormAttributeXML => {
  const mergedData = { ...defaults, ...data }

  const result: FormAttributeXML = {
    Attribute: {} as FormAttributeXML["Attribute"],
  }

  result.Attribute._name = mergedData.name
  result.Attribute._id = mergedData.id

  const title = exportI8nTextToXML(context, mergedData.title)
  if (title) result.Attribute.Title = title

  const type = exportTypeDescriptionToXML(context, mergedData.valueType)
  if (type) result.Attribute.Type = type

  if (mergedData.mainAttribute !== undefined) result.Attribute.MainAttribute = mergedData.mainAttribute

  if (mergedData.storedData !== undefined) result.Attribute.StoredData = mergedData.storedData

  const use = exportUserVisibleToXML(context, mergedData.use)
  if (use) result.Attribute.Use = use

  return result
}
