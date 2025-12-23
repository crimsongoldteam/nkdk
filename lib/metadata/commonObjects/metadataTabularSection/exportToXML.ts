import { v4 } from "uuid"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataAttributesToXML } from "~/lib/metadata/commonObjects/metadataAttribute/exportToXML"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "~/lib/metadata/commonObjects/metadataTabularSection/types"
import { exportStandardAttributeDescriptionsToXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportInternalInfoToXML } from "../internalInfo/exportToXML"
import { getDefaults } from "./defaults"

export const exportMetadataTabularSectionToXML = (
  configurationSettings: Context,
  data: MetadataTabularSection | undefined
): MetadataTabularSectionXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, configurationSettings)
  const mergedData = { ...defaults, ...data }

  const parentName = configurationSettings.context

  return compactObject<MetadataTabularSectionXML>({
    _uuid: v4(),
    InternalInfo: exportInternalInfoToXML([
      { name: `CatalogTabularSection.${parentName}.${mergedData.name}`, category: "TabularSection" },
      { name: `CatalogTabularSectionRow.${parentName}.${mergedData.name}`, category: "TabularSectionRow" },
    ]),
    Properties: {
      Comment: mergedData.comment,
      FillChecking: mergedData.fillChecking,
      LineNumberLength: mergedData.lineNumberLength,
      Name: mergedData.name!,
      ObjectBelonging: mergedData.objectBelonging,
      StandardAttributes: exportStandardAttributeDescriptionsToXML(
        configurationSettings,
        mergedData.standardAttributes
      ),
      Synonym: exportI8nTextToXML(configurationSettings, mergedData.synonym),
      Tooltip: exportI8nTextToXML(configurationSettings, mergedData.tooltip),
      Use: mergedData.use,
    },
    ChildObjects: {
      Attribute: exportMetadataAttributesToXML(configurationSettings, mergedData.attributes),
    },
  })
}

export const exportMetadataTabularSectionsToXML = (
  configurationSettings: Context,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataTabularSection) => exportMetadataTabularSectionToXML(configurationSettings, value)!)
}
