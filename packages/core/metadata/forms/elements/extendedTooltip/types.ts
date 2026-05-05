import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ExtendedTooltipRules } from "./rules"

export type ExtendedTooltip = FormTypeByRule<typeof ExtendedTooltipRules>

export type ExtendedTooltipYAML = YAMLTypeByRule<typeof ExtendedTooltipRules>

export type ExtendedTooltipEnterprise = EnterpriseType<typeof ExtendedTooltipRules>
