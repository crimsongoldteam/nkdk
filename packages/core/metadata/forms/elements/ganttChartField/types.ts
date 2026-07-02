import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { GanttChartFieldRules } from "./rules"

export type GanttChartField = FormTypeByRule<typeof GanttChartFieldRules>

export type GanttChartFieldPartialYAML = YAMLTypeByRule<typeof GanttChartFieldRules>

export type GanttChartFieldEnterprise = EnterpriseType<typeof GanttChartFieldRules>
