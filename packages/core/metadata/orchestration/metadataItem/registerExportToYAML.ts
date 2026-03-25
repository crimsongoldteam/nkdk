import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../formElement/factory"
import { ToMetadata, ToYAML } from "./registry"
import { exportMetadataItemToYAML } from "./toYAML"

export const registerExportToYAML = <Rule extends MetadataItemRule>(
  propertyType: PropertyRuleType,
  itemRule: Rule
): void => {
  registerTypeRule(
    propertyType,
    "exportToYAML",
    (params: {
      context: ConfigurationContext
      rule: PropertyRule
      value: unknown
      name?: string
    }): ToYAML<Rule["itemType"]> | undefined => {
      return exportMetadataItemToYAML({
        context: params.context,
        data: params.value as ToMetadata<Rule["itemType"]> | undefined,
        rule: itemRule,
      })
    }
  )
}
