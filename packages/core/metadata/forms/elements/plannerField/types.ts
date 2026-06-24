import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PlannerFieldRules } from "./rules"

export type PlannerField = FormTypeByRule<typeof PlannerFieldRules>

export type PlannerFieldPartialYAML = YAMLTypeByRule<typeof PlannerFieldRules>

export type PlannerFieldEnterprise = EnterpriseType<typeof PlannerFieldRules>
