import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../formElement/factory"
import { ToMetadata } from "./registry"
import { exportMetadataItemToXML } from "./toXML"

export const registerExportToXML = <Rule extends MetadataItemRule>(
  propertyType: PropertyRuleType,
  itemRule: Rule
): void => {
  registerTypeRule(
    propertyType,
    "exportToXML",
    (params: {
      context: ConfigurationContextWithExportToXML
      rule: PropertyRule
      value: unknown
      metadataItem?: unknown
      referenceMetadata?: unknown
    }) => {
      return exportMetadataItemToXML({
        context: params.context,
        data: params.value as ToMetadata<Rule["itemType"]> | undefined,
        rule: itemRule,
        referenceData: params.referenceMetadata as ToMetadata<Rule["itemType"]> | undefined,
        ownerMetadataItem: params.metadataItem,
      })
    }
  )
}
