import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { GanttChartFieldRules } from "./rules"

export type GanttChartField = FormTypeByRule<typeof GanttChartFieldRules>

export type GanttChartFieldPartialYAML = YAMLTypeByRule<typeof GanttChartFieldRules>

export type GanttChartFieldEnterprise = EnterpriseType<typeof GanttChartFieldRules>
