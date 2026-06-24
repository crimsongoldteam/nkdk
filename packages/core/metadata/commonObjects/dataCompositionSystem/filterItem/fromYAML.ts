import { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import { FilterItemYAML } from "./types"
import "./inlineTypes"
import "./typedValues"

const importFilterItemElementFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: FilterItemYAML[number] | undefined
) => {
  if (!value || typeof value !== "object") return undefined

  if ("ТипГруппы" in value) {
    return importMetadataItemFromYAML({ context, rule: FilterItemGroupRules, yaml: value as any })
  }

  return importMetadataItemFromYAML({ context, rule: FilterItemComparisonRules, yaml: value as any })
}

export const importFilterItemFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: FilterItemYAML | undefined
) => {
  if (!value || !Array.isArray(value)) return undefined
  const imported = value.flatMap((item) => {
    const importedItem = importFilterItemElementFromYAML(context, rule, item)
    return importedItem ? [importedItem] : []
  })
  return imported.length > 0 ? imported : undefined
}
