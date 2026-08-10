import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { ChartFieldRules } from "./rules"

export type ChartField = FormTypeByRule<typeof ChartFieldRules>

export type ChartFieldPartialYAML = YAMLTypeByRule<typeof ChartFieldRules>

export type ChartFieldEnterprise = EnterpriseType<typeof ChartFieldRules>
