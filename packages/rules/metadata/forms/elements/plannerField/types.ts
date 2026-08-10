import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { PlannerFieldRules } from "./rules"

export type PlannerField = FormTypeByRule<typeof PlannerFieldRules>

export type PlannerFieldPartialYAML = YAMLTypeByRule<typeof PlannerFieldRules>

export type PlannerFieldEnterprise = EnterpriseType<typeof PlannerFieldRules>
