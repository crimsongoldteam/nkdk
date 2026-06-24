import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PeriodFieldRules } from "./rules"

export type PeriodField = FormTypeByRule<typeof PeriodFieldRules>

export type PeriodFieldPartialYAML = YAMLTypeByRule<typeof PeriodFieldRules>

export interface PeriodFieldTypedYAML extends PeriodFieldPartialYAML {
  Тип: "ПолеПериода"
}

export type PeriodFieldEnterprise = EnterpriseType<typeof PeriodFieldRules>
