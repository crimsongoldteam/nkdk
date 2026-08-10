import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { PeriodFieldRules } from "./rules"

export type PeriodField = FormTypeByRule<typeof PeriodFieldRules>

export type PeriodFieldPartialYAML = YAMLTypeByRule<typeof PeriodFieldRules>

export interface PeriodFieldTypedYAML extends PeriodFieldPartialYAML {
  Тип: "ПолеПериода"
}

export type PeriodFieldEnterprise = EnterpriseType<typeof PeriodFieldRules>
