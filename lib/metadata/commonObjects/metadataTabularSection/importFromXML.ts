import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataAttributesFromXML } from "~/lib/metadata/commonObjects/metadataAttribute/importFromXML"
import { importStandardAttributeDescriptionsFromXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importMetadataTabularSectionFromXML = (
  xml: MetadataTabularSectionXML | undefined
): MetadataTabularSection | undefined => {
  if (!xml) return undefined

  return {
    elementType: FormElementType.MetadataTabularSection,

    attributes: importMetadataAttributesFromXML(xml.Attributes),
    comment: xml.Comment,
    fillChecking: xml.FillChecking,
    lineNumberLength: xml.LineNumberLength,
    name: xml.Name,
    objectBelonging: xml.ObjectBelonging,
    standardAttributes: importStandardAttributeDescriptionsFromXML(xml.StandardAttributes),
    synonym: importI8nTextFromXML(xml.Synonym),
    tooltip: importI8nTextFromXML(xml.Tooltip),
    use: xml.Use,
  }
}

registerImport(FormElementType.MetadataTabularSection, importMetadataTabularSectionFromXML)
