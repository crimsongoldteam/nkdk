import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataAttributesFromXML } from "~/lib/metadata/commonObjects/metadataAttribute/importFromXML"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "~/lib/metadata/commonObjects/metadataTabularSection/types"
import { importStandardAttributeDescriptionsFromXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const importMetadataTabularSectionFromXML = (
  xml: MetadataTabularSectionXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataTabularSection | undefined => {
  if (!xml) return undefined

  return compactObject({
    attributes: importMetadataAttributesFromXML(xml.Attributes, configurationSettings),
    comment: xml.Comment,
    fillChecking: xml.FillChecking,
    lineNumberLength: xml.LineNumberLength,
    name: xml.Name!,
    objectBelonging: xml.ObjectBelonging,
    standardAttributes: importStandardAttributeDescriptionsFromXML(xml.StandardAttributes, configurationSettings),
    synonym: importI8nTextFromXML(xml.Synonym, configurationSettings),
    tooltip: importI8nTextFromXML(xml.Tooltip, configurationSettings),
    use: xml.Use,
  })
}

export const importMetadataTabularSectionsFromXML = (
  xml: MetadataTabularSectionsXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataTabularSections | undefined => {
  if (!xml) return undefined

  return xml.map(
    (value: MetadataTabularSectionXML) => importMetadataTabularSectionFromXML(value, configurationSettings)!
  )
}
