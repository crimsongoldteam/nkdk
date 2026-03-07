import { TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportPropertiesToYAML, registerTypeRule } from "~/metadata/orchestration"
import {
  MetadataAttribute,
  MetadataAttributeYAML,
  MetadataAttributes,
  MetadataAttributesYAML,
} from "./types"
import { MetadataAttributeRules } from "./rules"

export const exportMetadataAttributesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributes | undefined
): MetadataAttributesYAML | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataAttribute) => [value.name, exportMetadataAttributeToYAML(context, value)!])
  )
}

const exportMetadataAttributeToYAML = (
  context: ConfigurationContext,
  data: MetadataAttribute
): MetadataAttributeYAML | TypeDescriptionYAML => {
  return exportPropertiesToYAML({
    context,
    data,
    rule: MetadataAttributeRules,
  })!
}

registerTypeRule("MetadataAttributes", "exportToYAML", exportMetadataAttributesToYAML)
