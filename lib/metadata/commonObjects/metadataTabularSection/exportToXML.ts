import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataAttributesToXML } from "~/lib/metadata/commonObjects/metadataAttribute/exportToXML"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "~/lib/metadata/commonObjects/metadataTabularSection/types"
import { exportStandardAttributeDescriptionsToXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToXML"

export const exportMetadataTabularSectionToXML = (
  data: MetadataTabularSection | undefined
): MetadataTabularSectionXML | undefined => {
  if (!data) return undefined

  return {
    Attributes: exportMetadataAttributesToXML(data.attributes),
    Comment: data.comment,
    FillChecking: data.fillChecking,
    LineNumberLength: data.lineNumberLength,
    Name: data.name,
    ObjectBelonging: data.objectBelonging,
    StandardAttributes: exportStandardAttributeDescriptionsToXML(data.standardAttributes),
    Synonym: exportI8nTextToXML(data.synonym),
    Tooltip: exportI8nTextToXML(data.tooltip),
    Use: data.use,
  }
}

export const exportMetadataTabularSectionsToXML = (
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataTabularSection) => exportMetadataTabularSectionToXML(value)!)
}
