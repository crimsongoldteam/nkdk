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
import { compactObject, removeDefaults } from "~/lib/metadata/helpers/compactObject"
import { MetadataAttributes } from "../metadataAttribute/types"
import { getDefaults } from "./defaults"

export const importMetadataTabularSectionFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: MetadataTabularSectionXML | undefined
): MetadataTabularSection | undefined => {
  if (!xml) return undefined

  const props = xml.Properties

  let attributes: MetadataAttributes | undefined
  if (xml.ChildObjects?.Attribute) {
    attributes = importMetadataAttributesFromXML(configurationSettings, xml.ChildObjects.Attribute)
  }

  const result = {
    attributes: attributes,
    comment: props.Comment,
    fillChecking: props.FillChecking,
    lineNumberLength: props.LineNumberLength,
    name: props.Name!,
    objectBelonging: props.ObjectBelonging,
    standardAttributes: importStandardAttributeDescriptionsFromXML(configurationSettings, props.StandardAttributes),
    synonym: importI8nTextFromXML(configurationSettings, props.Synonym),
    tooltip: importI8nTextFromXML(configurationSettings, props.Tooltip),
    use: props.Use,
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, configurationSettings)
  return removeDefaults(compactedResult, defaults)
}

export const importMetadataTabularSectionsFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: MetadataTabularSectionsXML | undefined
): MetadataTabularSections | undefined => {
  if (!xml) return undefined

  return xml.map(
    (value: MetadataTabularSectionXML) => importMetadataTabularSectionFromXML(configurationSettings, value)!
  )
}
