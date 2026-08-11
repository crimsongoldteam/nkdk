import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { ExtendedTooltipRules } from "./rules"

export type ExtendedTooltip = FormTypeByRule<typeof ExtendedTooltipRules>

export type ExtendedTooltipYAML = YAMLTypeByRule<typeof ExtendedTooltipRules>

export type ExtendedTooltipEnterprise = EnterpriseType<typeof ExtendedTooltipRules>
