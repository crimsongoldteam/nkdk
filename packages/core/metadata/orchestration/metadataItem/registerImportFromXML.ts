import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../property/typeRuleRegistry"
import { importMetadataItemFromXML } from "./fromXML"
import { ToMetadata } from "./registry"

export const registerImportFromXML = <Rule extends MetadataItemRule>(
  propertyType: PropertyRuleType,
  itemRule: Rule
): void => {
  registerTypeRule(
    propertyType,
    "importFromXML",
    (
      context: ConfigurationContextFromXML,
      _rule: PropertyRule,
      xml: unknown
    ): ToMetadata<Rule["itemType"]> | undefined => {
      return importMetadataItemFromXML({
        context,
        xml,
        rule: itemRule,
      })
    }
  )
}
