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
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportInternalInfoToXML } from "../internalInfo/exportToXML"

export const exportMetadataTabularSectionToXML = (
  configurationSettings: ConfigurationSettings,
  data: MetadataTabularSection | undefined
): MetadataTabularSectionXML | undefined => {
  if (!data) return undefined

  return compactObject<MetadataTabularSectionXML>({
    InternalInfo: exportInternalInfoToXML([
      { name: `CatalogTabularSection.${data.name}`, category: "TabularSection" },
      { name: `CatalogTabularSectionRow.${data.name}`, category: "TabularSectionRow" },
    ]),
    Properties: {
      Comment: data.comment,
      FillChecking: data.fillChecking,
      LineNumberLength: data.lineNumberLength,
      Name: data.name!,
      ObjectBelonging: data.objectBelonging,
      StandardAttributes: exportStandardAttributeDescriptionsToXML(configurationSettings, data.standardAttributes),
      Synonym: exportI8nTextToXML(configurationSettings, data.synonym),
      Tooltip: exportI8nTextToXML(configurationSettings, data.tooltip),
      Use: data.use,
    },
    ChildObjects: {
      Attribute: exportMetadataAttributesToXML(configurationSettings, data.attributes),
    },
  })
}

export const exportMetadataTabularSectionsToXML = (
  configurationSettings: ConfigurationSettings,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataTabularSection) => exportMetadataTabularSectionToXML(configurationSettings, value)!)
}
