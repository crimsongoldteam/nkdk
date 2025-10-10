import { TAttribute, TAttributeXML } from "../types"
import importTypeDescriptionFromXML from "~/lib/metadata/typeDescription/importTypeDescriptionFromXML"
import importI8nXmlText from "~/lib/xml/import/importI8nTextFromXML"

export default function importAttributeFromXML(xml: TAttributeXML): TAttribute {
  return {
    name: xml.Attribute._name,
    id: xml.Attribute._id,
    type: importTypeDescriptionFromXML(xml.Attribute.Type),
    mainAttribute: xml.Attribute.MainAttribute,
    storedData: xml.Attribute.StoredData,
    title: importI8nXmlText(xml.Attribute.Title),
  }
}
