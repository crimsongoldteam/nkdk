import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataAttributesToXML } from "~/lib/metadata/commonObjects/metadataAttribute/exportToXML"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "~/lib/metadata/commonObjects/metadataTabularSection/types"
import { exportStandardAttributeDescriptionsToXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const exportMetadataTabularSectionToXML = (
  data: MetadataTabularSection | undefined,
  configurationSettings: ConfigurationSettings
): MetadataTabularSectionXML | undefined => {
  if (!data) return undefined

  return {
    Attributes: exportMetadataAttributesToXML(data.attributes, configurationSettings),
    Comment: data.comment,
    FillChecking: data.fillChecking,
    LineNumberLength: data.lineNumberLength,
    Name: data.name,
    ObjectBelonging: data.objectBelonging,
    StandardAttributes: exportStandardAttributeDescriptionsToXML(data.standardAttributes, configurationSettings),
    Synonym: exportI8nTextToXML(data.synonym, configurationSettings),
    Tooltip: exportI8nTextToXML(data.tooltip, configurationSettings),
    Use: data.use,
  }
}

export const exportMetadataTabularSectionsToXML = (
  data: MetadataTabularSections | undefined,
  configurationSettings: ConfigurationSettings
): MetadataTabularSectionsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataTabularSection) => exportMetadataTabularSectionToXML(value, configurationSettings)!)
}
