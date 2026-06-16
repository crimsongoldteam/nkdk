import { ConfigurationContext } from "~/metadata/context/types"
import {
  exportMetadataItemToYAML,
  importMetadataItemFromYAML,
  PropertyRule,
  registerTypeRule,
} from "~/metadata/orchestration"
import { MetadataEnumerationValueRules } from "./rules"
import {
  MetadataEnumerationValue,
  MetadataEnumerationValues,
  MetadataEnumerationValueYAML,
  MetadataEnumerationValuesYAML,
} from "./types"

export const importMetadataEnumerationValuesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataEnumerationValuesYAML | undefined
): MetadataEnumerationValues | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]): MetadataEnumerationValue => {
    const imported = importMetadataItemFromYAML({
      context,
      yaml: value,
      rule: MetadataEnumerationValueRules,
      name,
    }) as MetadataEnumerationValue
    return { ...imported, name }
  })

  return results.length > 0 ? results : undefined
}

const exportMetadataEnumerationValuesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataEnumerationValues | undefined
): MetadataEnumerationValuesYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return Object.fromEntries(
    data.map((value) => {
      const { name, ...valueWithoutName } = value
      const valueForYAML = valueWithoutName as MetadataEnumerationValue
      const yaml = exportMetadataItemToYAML({
        context,
        rule: MetadataEnumerationValueRules,
        data: valueForYAML,
      }) as MetadataEnumerationValueYAML | undefined

      return [name, yaml ?? {}]
    })
  )
}

registerTypeRule("MetadataEnumerationValues", "importFromYAML", importMetadataEnumerationValuesFromYAML)
registerTypeRule("MetadataEnumerationValues", "exportToYAML", exportMetadataEnumerationValuesToYAML)
