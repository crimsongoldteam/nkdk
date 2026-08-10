import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataChartOfAccountsRules } from "./rules"

export type MetadataChartOfAccounts = MetadataTypeByRule<typeof MetadataChartOfAccountsRules>
export type MetadataChartOfAccountsYAML = YAMLTypeByRule<typeof MetadataChartOfAccountsRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataChartOfAccounts",
  itemRule: MetadataChartOfAccountsRules,
})
