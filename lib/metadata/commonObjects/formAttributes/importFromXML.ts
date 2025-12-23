import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ConditionalAppearanceXML, FormAttribute, FormAttributes, FormAttributesXML, FormAttributeXML } from "./types"

export const importFormAttributeFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: FormAttributeXML
): FormAttribute | undefined => {
  if (!xml.Attribute) {
    return undefined
  }

  return {
    name: xml.Attribute._name,
    id: xml.Attribute._id,
    valueType: importTypeDescriptionFromXML(configurationSettings, xml.Attribute.Type),
    mainAttribute: xml.Attribute.MainAttribute,
    storedData: xml.Attribute.StoredData,
    title: importI8nTextFromXML(configurationSettings, xml.Attribute.Title),
  }
}

export const importFormAttributesFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: FormAttributesXML
): FormAttributes => {
  return xml
    .map((item: FormAttributeXML | ConditionalAppearanceXML) => {
      if ("Attribute" in item) {
        return importFormAttributeFromXML(configurationSettings, item as FormAttributeXML)
      }
      return undefined
    })
    .filter((item): item is FormAttribute => item !== undefined)
}
