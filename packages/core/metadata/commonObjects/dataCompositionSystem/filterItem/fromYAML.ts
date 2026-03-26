import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import { FilterItemYAML } from "./types"
import "./inlineTypes"
import "./typedValues"

const importFilterItemFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: FilterItemYAML | undefined
) => {
  if (!value || typeof value !== "object") return undefined

  if ("ТипГруппы" in value) {
    return importMetadataItemFromYAML({ context, rule: FilterItemGroupRules, yaml: value as any })
  }

  return importMetadataItemFromYAML({ context, rule: FilterItemComparisonRules, yaml: value as any })
}

registerTypeRule("FilterItem", "importFromYAML", importFilterItemFromYAML)
