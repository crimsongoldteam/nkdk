import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { ChartFieldRules } from "./rules"

export type ChartField = FormTypeByRule<typeof ChartFieldRules>

export type ChartFieldPartialYAML = YAMLTypeByRule<typeof ChartFieldRules>

export type ChartFieldEnterprise = EnterpriseType<typeof ChartFieldRules>
