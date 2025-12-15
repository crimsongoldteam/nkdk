import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportMetadataTabularSectionToXML = (
  data: MetadataTabularSection | undefined
): MetadataTabularSectionXML | undefined => {
  if (!data) return undefined

  return {
    Attributes: data.attributes,
    Comment: data.comment,
    ExtendedConfigurationObject: data.extendedConfigurationObject,
    FillChecking: data.fillChecking,
    LineNumberLength: data.lineNumberLength,
    ObjectBelonging: data.objectBelonging,
    StandardAttributes: data.standardAttributes,
    Synonym: data.synonym,
    Tooltip: data.tooltip,
    Use: data.use,
  }
}

registerExport(FormElementType.MetadataTabularSection, exportMetadataTabularSectionToXML)
