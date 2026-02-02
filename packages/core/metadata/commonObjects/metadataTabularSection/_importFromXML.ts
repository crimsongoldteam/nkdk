import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataAttributesFromXML } from "~/metadata/commonObjects/metadataAttribute/importFromXML"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import { importStandardAttributeDescriptionsFromXML } from "~/metadata/commonObjects/standardAttributeDescription/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { getDefaults } from "./defaults"

export const _importMetadataTabularSectionsFromXML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  xml: MetadataTabularSectionsXML | MetadataTabularSectionXML | undefined
): MetadataTabularSections | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((value: MetadataTabularSectionXML) => importMetadataTabularSectionFromXML(context, rule, value)!)
}

const importMetadataTabularSectionFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  xml: MetadataTabularSectionXML
): MetadataTabularSection => {
  const props = xml.Properties

  const result: MetadataTabularSection = {
    name: props.Name!,
    synonym: importI8nTextFromXML(context, props.Synonym)!,
  }

  if (xml.ChildObjects?.Attribute) {
    result.attributes = importMetadataAttributesFromXML(context, xml.ChildObjects.Attribute)
  }

  if (props.Comment !== undefined) result.comment = props.Comment
  if (props.FillChecking !== undefined) result.fillChecking = props.FillChecking
  if (props.LineNumberLength !== undefined) result.lineNumberLength = props.LineNumberLength
  // if (props.ObjectBelonging !== undefined) result.objectBelonging = props.ObjectBelonging

  const standardAttributes = importStandardAttributeDescriptionsFromXML(context, props.StandardAttributes)
  if (standardAttributes) result.standardAttributes = standardAttributes

  const toolTip = importI8nTextFromXML(context, props.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (props.Use !== undefined) result.use = props.Use

  const defaults = getDefaults(context, result)
  return removeDefaults(result, defaults)
}
