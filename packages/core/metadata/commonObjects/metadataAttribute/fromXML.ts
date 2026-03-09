import {
  MetadataAttribute,
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributeXML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { importMetadataValueFromXMLAsPrimitive } from "~/metadata/commonObjects/metadataValue/fromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importPropertiesFromXML, registerTypeRule } from "~/metadata/orchestration"
import { getDefaultsAttribute } from "./defaults"
import { MetadataAttributeRules } from "./rules"

export const importMetadataAttributesFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: MetadataAttributesXML | undefined
): MetadataAttributes | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]
  const attributes = items.map((item) => importMetadataAttributeFromXML(context, item as MetadataAttributeXML))

  return attributes
}

const importMetadataAttributeFromXML = (
  context: ConfigurationContext,
  xml: MetadataAttributeXML
): MetadataAttribute => {
  const props = xml.Properties
  if (!props) {
    return {
      itemType: "MetadataAttribute",
      name: "",
      type: { type: ["string"] },
      synonym: { items: { [context.defaultLanguage]: "" } },
    }
  }

  const properties = importPropertiesFromXML({
    context,
    xml: props,
    rule: MetadataAttributeRules,
  })

  let minValue: number | undefined
  const minValueRaw = props.MinValue
  if (
    minValueRaw != null &&
    typeof minValueRaw === "object" &&
    ("_xsi:type" in minValueRaw || "#text" in minValueRaw)
  ) {
    minValue = importMetadataValueFromXMLAsPrimitive(context, undefined, minValueRaw, "decimal") as number | undefined
  }

  let maxValue: number | undefined
  const maxValueRaw = props.MaxValue
  if (
    maxValueRaw != null &&
    typeof maxValueRaw === "object" &&
    ("_xsi:type" in maxValueRaw || "#text" in maxValueRaw)
  ) {
    maxValue = importMetadataValueFromXMLAsPrimitive(context, undefined, maxValueRaw, "decimal") as number | undefined
  }

  const result: MetadataAttribute = {
    itemType: "MetadataAttribute",
    name: properties!.name!,
    type: properties!.type!,
    synonym: properties!.synonym ?? { items: { [context.defaultLanguage]: "" } },
    ...properties,
    ...(minValue !== undefined && { minValue }),
    ...(maxValue !== undefined && { maxValue }),
  }

  const defaults = getDefaultsAttribute(context, result)
  return removeDefaults(result, defaults)
}

registerTypeRule("MetadataAttributes", "importFromXML", importMetadataAttributesFromXML)
