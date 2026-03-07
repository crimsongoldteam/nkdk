import {
  MetadataAttribute,
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributeXML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { exportMetadataSimpleValueToXML } from "~/metadata/commonObjects/metadataValue/toXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getUUID } from "../../helpers/uuid"
import { exportPropertiesToXML, registerTypeRule } from "~/metadata/orchestration"
import { getDefaultsAttribute, getDefaultsTabularSectionAttribute } from "./defaults"
import { MetadataAttributeRules } from "./rules"

export const exportMetadataAttributesToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributes | undefined
): MetadataAttributesXML | undefined => {
  if (!data) return undefined

  const result = data.map(
    (value: MetadataAttribute) =>
      exportMetadataAttributeToXML(context, value, getDefaultsAttribute(context, value))!
  )

  return result
}

export const exportMetadataTabularSectionAttributesToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributes | undefined
): MetadataAttributesXML | undefined => {
  if (!data) return undefined

  const result = data.map(
    (value: MetadataAttribute) =>
      exportMetadataAttributeToXML(context, value, getDefaultsTabularSectionAttribute(context, value))!
  )

  return result
}

const exportMetadataAttributeToXML = (
  context: ConfigurationContext,
  data: MetadataAttribute,
  defaults: Partial<MetadataAttribute>
): MetadataAttributeXML => {
  const mergedData = { ...defaults, ...data }

  const propertiesFlat = exportPropertiesToXML({
    context,
    metadataItem: mergedData,
    rule: MetadataAttributeRules,
  })

  const Properties = { ...propertiesFlat } as MetadataAttributeXML["Properties"]

  const minValue = exportMetadataSimpleValueToXML(context, undefined, mergedData.minValue, "string")
  if (minValue !== undefined) Properties.MinValue = minValue

  const maxValue = exportMetadataSimpleValueToXML(context, undefined, mergedData.maxValue, "string")
  if (maxValue !== undefined) Properties.MaxValue = maxValue

  const result: MetadataAttributeXML = {
    _uuid: getUUID(context),
    Properties: sortObject(Properties),
  }

  return result
}

registerTypeRule("MetadataAttributes", "exportToXML", exportMetadataAttributesToXML)
