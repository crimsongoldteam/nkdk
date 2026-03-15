import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ChartFieldRules } from "./rules"

export type ChartField = FormTypeByRule<typeof ChartFieldRules>

export type ChartFieldPartialYAML = YAMLTypeByRule<typeof ChartFieldRules>

export type ChartFieldEnterprise = EnterpriseType<typeof ChartFieldRules>

export type ChartFieldYAML = YAMLTypeByRule<typeof ChartFieldRules>
