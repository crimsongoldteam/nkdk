import importTypeDescriptionFromXML from "~/lib/metadata/typeDescription/importTypeDescriptionFromXML"
import { TAttribute, TAttributeXML } from "../types"
import importI8nXmlTextFromXML from "~/lib/metadata/i8nText/importI8nTextFromXML"

export default function importAttributeFromXML(xml: TAttributeXML): TAttribute {
  return {
    name: xml.Attribute._name,
    id: xml.Attribute._id,
    type: importTypeDescriptionFromXML(xml.Attribute.Type),
    mainAttribute: xml.Attribute.MainAttribute,
    storedData: xml.Attribute.StoredData,
    title: importI8nXmlTextFromXML(xml.Attribute.Title),
  }
}
