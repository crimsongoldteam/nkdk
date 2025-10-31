import { importTypeDescriptionFromXML } from "~/lib/metadata/typeDescription/importFromXML"
import { TAttribute, TAttributeXML } from "../types"
import { importI8nTextFromXML } from "~/lib/metadata/i8nText/importI8nTextFromXML"

export default function importAttributeFromXML(xml: TAttributeXML): TAttribute | undefined {
  if (!xml.Attribute) {
    return undefined
  }

  return {
    name: xml.Attribute._name,
    id: xml.Attribute._id,
    type: importTypeDescriptionFromXML(xml.Attribute.Type),
    mainAttribute: xml.Attribute.MainAttribute,
    storedData: xml.Attribute.StoredData,
    title: importI8nTextFromXML(xml.Attribute.Title),
  }
}
