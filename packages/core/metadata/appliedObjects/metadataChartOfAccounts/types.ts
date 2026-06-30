import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataChartOfAccountsRules } from "./rules"

export type MetadataChartOfAccounts = MetadataTypeByRule<typeof MetadataChartOfAccountsRules>
export type MetadataChartOfAccountsYAML = YAMLTypeByRule<typeof MetadataChartOfAccountsRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfAccounts",
  itemRule: MetadataChartOfAccountsRules,
})
