import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { PlannerFieldRules } from "./rules"

export type PlannerField = FormTypeByRule<typeof PlannerFieldRules>

export type PlannerFieldPartialYAML = YAMLTypeByRule<typeof PlannerFieldRules>

export type PlannerFieldEnterprise = EnterpriseType<typeof PlannerFieldRules>
