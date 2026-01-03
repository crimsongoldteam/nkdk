import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import { exportStandardAttributeDescriptionsToXML } from "~/metadata/commonObjects/standardAttributeDescription/exportToXML"
import { Context } from "~/metadata/context/types"
import { mergeIgnoringUndefined } from "~/metadata/helpers/compactObject"
import { getUUID } from "../../helpers/uuid"
import { exportInternalInfoToXML } from "../internalInfo/exportToXML"
import { exportMetadataTabularSectionAttributesToXML } from "../metadataAttribute/exportToXML"
import { getDefaults } from "./defaults"

export const exportMetadataTabularSectionsToXML = (
  context: Context,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataTabularSection) => exportMetadataTabularSectionToXML(context, value)!)
}

export const exportMetadataTabularSectionToXML = (
  context: Context,
  data: MetadataTabularSection
): MetadataTabularSectionXML => {
  const defaults = getDefaults(context, data)
  const mergedData = mergeIgnoringUndefined(data, defaults)

  const parentName = (context.context as { parentName?: string }).parentName ?? ""

  const properties: MetadataTabularSectionXML["Properties"] = {} as MetadataTabularSectionXML["Properties"]

  if (mergedData.comment !== undefined) {
    properties.Comment = mergedData.comment
  }

  properties.FillChecking = mergedData.fillChecking

  properties.LineNumberLength = mergedData.lineNumberLength

  properties.Name = mergedData.name!
  if (mergedData.objectBelonging !== undefined) {
    properties.ObjectBelonging = mergedData.objectBelonging
  }

  properties.StandardAttributes = exportStandardAttributeDescriptionsToXML(context, mergedData.standardAttributes, [
    "LineNumber",
  ])

  if (mergedData.synonym !== undefined) {
    properties.Synonym = exportI8nTextToXML(context, mergedData.synonym)
  }
  if (mergedData.toolTip !== undefined) {
    properties.ToolTip = exportI8nTextToXML(context, mergedData.toolTip)
  }

  properties.Use = mergedData.use

  const result: MetadataTabularSectionXML = {
    _uuid: getUUID(context),
    InternalInfo: exportInternalInfoToXML(context, [
      { name: `CatalogTabularSection.${parentName}.${mergedData.name}`, category: "TabularSection" },
      { name: `CatalogTabularSectionRow.${parentName}.${mergedData.name}`, category: "TabularSectionRow" },
    ]),
    Properties: properties,
  }

  if (mergedData.attributes !== undefined) {
    const attributes = exportMetadataTabularSectionAttributesToXML(context, mergedData.attributes)
    if (attributes !== undefined) {
      result.ChildObjects = {
        Attribute: attributes,
      }
    }
  }

  return result
}
