import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importMetadataTabularSectionFromXML = (
  xml: MetadataTabularSectionXML | undefined
): MetadataTabularSection | undefined => {
  if (!xml) return undefined

  return {
    elementType: FormElementType.MetadataTabularSection,

    attributes: xml.Attributes,
    comment: xml.Comment,
    extendedConfigurationObject: xml.ExtendedConfigurationObject,
    fillChecking: xml.FillChecking,
    lineNumberLength: xml.LineNumberLength,
    objectBelonging: xml.ObjectBelonging,
    standardAttributes: xml.StandardAttributes,
    synonym: xml.Synonym,
    tooltip: xml.Tooltip,
    use: xml.Use,
  }
}

registerImport(FormElementType.MetadataTabularSection, importMetadataTabularSectionFromXML)
