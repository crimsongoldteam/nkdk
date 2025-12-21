import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ConditionalAppearanceXML, FormAttribute, FormAttributes, FormAttributesXML, FormAttributeXML } from "./types"

export const importFormAttributeFromXML = (
  xml: FormAttributeXML,
  configurationSettings: ConfigurationSettings
): FormAttribute | undefined => {
  if (!xml.Attribute) {
    return undefined
  }

  return {
    name: xml.Attribute._name,
    id: xml.Attribute._id,
    valueType: importTypeDescriptionFromXML(xml.Attribute.Type, configurationSettings),
    mainAttribute: xml.Attribute.MainAttribute,
    storedData: xml.Attribute.StoredData,
    title: importI8nTextFromXML(xml.Attribute.Title, configurationSettings),
  }
}

export const importFormAttributesFromXML = (
  xml: FormAttributesXML,
  configurationSettings: ConfigurationSettings
): FormAttributes => {
  return xml.map((item: FormAttributeXML | ConditionalAppearanceXML) =>
    importFormAttributeFromXML(item, configurationSettings)
  )
}
