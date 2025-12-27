import { v4 } from "uuid"
import { exportI8nTextToXML } from "~/packages/core/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataAttributesToXML } from "~/packages/core/metadata/commonObjects/metadataAttribute/exportToXML"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "~/packages/core/metadata/commonObjects/metadataTabularSection/types"
import { exportStandardAttributeDescriptionsToXML } from "~/packages/core/metadata/commonObjects/standardAttributeDescription/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { exportInternalInfoToXML } from "../internalInfo/exportToXML"
import { getDefaults } from "./defaults"

export const exportMetadataTabularSectionToXML = (
  context: Context,
  data: MetadataTabularSection | undefined
): MetadataTabularSectionXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data }

  const parentName = context.context

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
      StandardAttributes: exportStandardAttributeDescriptionsToXML(context, mergedData.standardAttributes),
      Synonym: exportI8nTextToXML(context, mergedData.synonym),
      Tooltip: exportI8nTextToXML(context, mergedData.tooltip),
      Use: mergedData.use,
    },
    ChildObjects: {
      Attribute: exportMetadataAttributesToXML(context, mergedData.attributes),
    },
  })
}

export const exportMetadataTabularSectionsToXML = (
  context: Context,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataTabularSection) => exportMetadataTabularSectionToXML(context, value)!)
}
