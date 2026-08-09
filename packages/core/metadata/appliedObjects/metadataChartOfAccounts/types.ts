import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataChartOfAccountsRules } from "./rules"

export type MetadataChartOfAccounts = MetadataTypeByRule<typeof MetadataChartOfAccountsRules>
export type MetadataChartOfAccountsYAML = YAMLTypeByRule<typeof MetadataChartOfAccountsRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfAccounts",
  itemRule: MetadataChartOfAccountsRules,
})
