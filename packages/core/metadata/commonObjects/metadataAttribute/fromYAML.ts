import {
  MetadataAttribute,
  MetadataAttributeYAML,
  MetadataAttributes,
  MetadataAttributesYAML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { importTypeDescriptionFromYAML } from "~/metadata/commonObjects/typeDescription/fromYAML"
import { TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importPropertiesFromYAML, registerTypeRule } from "~/metadata/orchestration"
import { getDefaultsAttribute } from "./defaults"
import { MetadataAttributeRules } from "./rules"

export const importMetadataAttributesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributesYAML | undefined
): MetadataAttributes | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) =>
    importMetadataAttributeFromYAML(context, value as MetadataAttributeYAML, name)
  )

  return results.length > 0 ? results : undefined
}

const importMetadataAttributeFromYAML = (
  context: ConfigurationContext,
  yaml: MetadataAttributeYAML | TypeDescriptionYAML,
  name: string
): MetadataAttribute => {
  if (typeof yaml === "string" || Array.isArray(yaml)) {
    const type = importTypeDescriptionFromYAML(context, undefined, yaml)
    if (!type) throw new Error("Type is required")

    return {
      itemType: "MetadataAttribute",
      name,
      type,
      synonym: { items: { [context.defaultLanguage]: splitPascalCase(name) } },
    }
  }

  const properties = importPropertiesFromYAML({
    context,
    yaml: yaml as MetadataAttributeYAML,
    metadataRule: MetadataAttributeRules,
    name,
  })

  const result: MetadataAttribute = {
    ...properties,
    itemType: "MetadataAttribute",
    name,
  }

  const defaults = getDefaultsAttribute(context, result)
  return removeDefaults(result, defaults)
}

registerTypeRule("MetadataAttributes", "importFromYAML", importMetadataAttributesFromYAML)
