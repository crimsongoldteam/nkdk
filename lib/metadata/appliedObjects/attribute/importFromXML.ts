import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { IAttribute, IAttributeXML } from "../types"

export default function importAttributeFromXML(xml: IAttributeXML): IAttribute | undefined {
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
