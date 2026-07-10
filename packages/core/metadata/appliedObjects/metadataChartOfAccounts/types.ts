import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataChartOfAccountsRules } from "./rules"

export type MetadataChartOfAccounts = MetadataTypeByRule<typeof MetadataChartOfAccountsRules>
export type MetadataChartOfAccountsYAML = YAMLTypeByRule<typeof MetadataChartOfAccountsRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfAccounts",
  itemRule: MetadataChartOfAccountsRules,
})
