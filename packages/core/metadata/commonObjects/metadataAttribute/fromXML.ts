import {
  MetadataAttribute,
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributeXML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { importMetadataValueFromXML } from "~/metadata/commonObjects/metadataValue/fromXML"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importPropertiesFromXML, registerTypeRule } from "~/metadata/orchestration"
import { getDefaultsAttribute } from "./defaults"
import { MetadataAttributeRules } from "./rules"

export const importMetadataAttributesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataAttributesXML | undefined
): MetadataAttributes | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]
  const attributes = items.map((item) => importMetadataAttributeFromXML(context, item as MetadataAttributeXML))

  return attributes
}

const importMetadataAttributeFromXML = (
  context: ConfigurationContextFromXML,
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
    minValue = (
      importMetadataValueFromXML({
        context,
        rule: undefined,
        value: minValueRaw,
        type: "decimal",
      }) as any
    )?.value as number | undefined
  }

  let maxValue: number | undefined
  const maxValueRaw = props.MaxValue
  if (
    maxValueRaw != null &&
    typeof maxValueRaw === "object" &&
    ("_xsi:type" in maxValueRaw || "#text" in maxValueRaw)
  ) {
    maxValue = (
      importMetadataValueFromXML({
        context,
        rule: undefined,
        value: maxValueRaw,
        type: "decimal",
      }) as any
    )?.value as number | undefined
  }

  const result: MetadataAttribute = {
    itemType: "MetadataAttribute",
    ...properties,
    name: properties!.name!,
    type: properties!.type!,
    synonym: properties!.synonym ?? { items: { [context.defaultLanguage]: "" } },
    ...(minValue !== undefined && { minValue }),
    ...(maxValue !== undefined && { maxValue }),
  }

  if (context.fromXML.forReference) {
    return result
  }
  const defaults = getDefaultsAttribute(context, result)
  return removeDefaults(result, defaults)
}

registerTypeRule("MetadataAttributes", "importFromXML", importMetadataAttributesFromXML)
