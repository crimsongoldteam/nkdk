import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { registerExportToXML } from "./registerExportToXML"
import { registerExportToYAML } from "./registerExportToYAML"
import { registerImportFromXML } from "./registerImportFromXML"
import { registerImportFromYAML } from "./registerImportFromYAML"

type MetadataItemRuleParams<Rule extends MetadataItemRule, PropertyType extends PropertyRuleType> = {
  propertyType: PropertyType
  itemRule: Rule
}

export const registerMetadataItemRule = <
  Rule extends MetadataItemRule,
  PropertyType extends PropertyRuleType,
>(
  params: MetadataItemRuleParams<Rule, PropertyType>
): void => {
  const { propertyType, itemRule } = params

  registerImportFromXML(propertyType, itemRule)
  registerImportFromYAML(propertyType, itemRule)
  registerExportToYAML(propertyType, itemRule)
  registerExportToXML(propertyType, itemRule)
}
