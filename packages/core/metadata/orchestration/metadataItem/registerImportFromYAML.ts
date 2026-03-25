import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../formElement/factory"
import { importMetadataItemFromYAML } from "./fromYAML"
import { ToMetadata, ToYAML } from "./registry"

export const registerImportFromYAML = <Rule extends MetadataItemRule>(
  propertyType: PropertyRuleType,
  itemRule: Rule
): void => {
  registerTypeRule(
    propertyType,
    "importFromYAML",
    (params: {
      context: ConfigurationContext
      rule: PropertyRule
      yaml?: unknown
      source?: unknown
      value: unknown
      name?: string
    }): ToMetadata<Rule["itemType"]> => {
      return importMetadataItemFromYAML({
        context: params.context,
        yaml: params.value as ToYAML<Rule["itemType"]> | undefined,
        rule: itemRule,
        source: params.source as ToMetadata<Rule["itemType"]> | undefined,
        name: params.name,
      })
    }
  )
}
