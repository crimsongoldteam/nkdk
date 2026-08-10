import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { GanttChartFieldRules } from "./rules"

export type GanttChartField = FormTypeByRule<typeof GanttChartFieldRules>

export type GanttChartFieldPartialYAML = YAMLTypeByRule<typeof GanttChartFieldRules>

export type GanttChartFieldEnterprise = EnterpriseType<typeof GanttChartFieldRules>
