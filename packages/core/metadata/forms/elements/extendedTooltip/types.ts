import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { ExtendedTooltipRules } from "./rules"

export type ExtendedTooltip = FormTypeByRule<typeof ExtendedTooltipRules>

export type ExtendedTooltipYAML = YAMLTypeByRule<typeof ExtendedTooltipRules>

export type ExtendedTooltipEnterprise = EnterpriseType<typeof ExtendedTooltipRules>
