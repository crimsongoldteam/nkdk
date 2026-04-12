import {
  MetadataAttribute,
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributeXML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { exportMetadataValueToXML } from "~/metadata/commonObjects/metadataValue/toXML"
import { MetadataPrimitiveValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { getUUID } from "~/metadata/helpers/uuid"
import { exportPropertiesToXML, registerTypeRule } from "~/metadata/orchestration"
import { MetadataAttributeRules } from "./rules"

export const exportMetadataAttributesToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  data: MetadataAttributes | undefined,
  referenceData?: MetadataAttributes | undefined
): MetadataAttributesXML | undefined => {
  if (!data) return undefined

  const referenceByName = referenceData ? new Map(referenceData.map((ref) => [ref.name, ref])) : undefined

  const result = data.map((value: MetadataAttribute) => {
    const reference = referenceByName?.get(value.name)
    return exportMetadataAttributeToXML(context, value, reference)!
  })

  return result
}

export const exportMetadataTabularSectionAttributesToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  data: MetadataAttributes | undefined,
  referenceData?: MetadataAttributes | undefined
): MetadataAttributesXML | undefined => {
  if (!data) return undefined

  const referenceByName = referenceData ? new Map(referenceData.map((ref) => [ref.name, ref])) : undefined

  const result = data.map((value: MetadataAttribute) => {
    const reference = referenceByName?.get(value.name)
    return exportMetadataAttributeToXML(context, value, reference)!
  })

  return result
}

const exportMetadataAttributeToXML = (
  context: ConfigurationContextWithExportToXML,
  data: MetadataAttribute,
  referenceData?: MetadataAttribute | undefined
): MetadataAttributeXML => {
  const propertiesFlat = exportPropertiesToXML({
    context: context,
    metadata: data,
    referenceMetadata: referenceData,
    rule: MetadataAttributeRules,
  })

  const Properties = { ...propertiesFlat } as MetadataAttributeXML["Properties"]

  const minValue =
    data.minValue === undefined
      ? undefined
      : (exportMetadataValueToXML({
          context,
          rule: { type: "MetadataValue", valueType: "string" },
          value: data.minValue,
        }) as MetadataPrimitiveValueXML)
  if (minValue !== undefined) Properties.MinValue = minValue

  const maxValue =
    data.maxValue === undefined
      ? undefined
      : (exportMetadataValueToXML({
          context,
          rule: { type: "MetadataValue", valueType: "string" },
          value: data.maxValue,
        }) as MetadataPrimitiveValueXML)
  if (maxValue !== undefined) Properties.MaxValue = maxValue

  const result: MetadataAttributeXML = {
    _uuid: referenceData?.uuid ?? getUUID(context),
    Properties: Properties,
  }

  return result
}

registerTypeRule("MetadataAttributes", "exportToXML", exportMetadataAttributesToXML)
