import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataAttributesToXML } from "~/lib/metadata/commonObjects/metadataAttribute/exportToXML"
import { exportStandardAttributeDescriptionsToXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

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

registerExport(FormElementType.MetadataTabularSection, exportMetadataTabularSectionToXML)
