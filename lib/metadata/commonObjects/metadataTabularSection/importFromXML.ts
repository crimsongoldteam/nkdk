import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataAttributesFromXML } from "~/lib/metadata/commonObjects/metadataAttribute/importFromXML"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "~/lib/metadata/commonObjects/metadataTabularSection/types"
import { importStandardAttributeDescriptionsFromXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/importFromXML"

export const importMetadataTabularSectionFromXML = (
  xml: MetadataTabularSectionXML | undefined
): MetadataTabularSection | undefined => {
  if (!xml) return undefined

  return {
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

export const importMetadataTabularSectionsFromXML = (
  xml: MetadataTabularSectionsXML | undefined
): MetadataTabularSections | undefined => {
  if (!xml) return undefined

  return xml.map((value: MetadataTabularSectionXML) => importMetadataTabularSectionFromXML(value)!)
}
