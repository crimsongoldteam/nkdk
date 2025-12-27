import { importI8nTextFromXML } from "~/packages/core/metadata/commonObjects/i8nText/importFromXML"
import { importTypeDescriptionFromXML } from "~/packages/core/metadata/commonObjects/typeDescription/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { ConditionalAppearanceXML, FormAttribute, FormAttributes, FormAttributesXML, FormAttributeXML } from "./types"

export const importFormAttributeFromXML = (context: Context, xml: FormAttributeXML): FormAttribute | undefined => {
  if (!xml.Attribute) {
    return undefined
  }

  return {
    name: xml.Attribute._name,
    id: xml.Attribute._id,
    valueType: importTypeDescriptionFromXML(context, xml.Attribute.Type),
    mainAttribute: xml.Attribute.MainAttribute,
    storedData: xml.Attribute.StoredData,
    title: importI8nTextFromXML(context, xml.Attribute.Title),
  }
}

export const importFormAttributesFromXML = (context: Context, xml: FormAttributesXML): FormAttributes => {
  return xml
    .map((item: FormAttributeXML | ConditionalAppearanceXML) => {
      if ("Attribute" in item) {
        return importFormAttributeFromXML(context, item as FormAttributeXML)
      }
      return undefined
    })
    .filter((item): item is FormAttribute => item !== undefined)
}
