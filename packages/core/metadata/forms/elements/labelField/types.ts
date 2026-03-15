import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { LabelFieldRules } from "./rules"

export type LabelField = FormTypeByRule<typeof LabelFieldRules>

export type LabelFieldPartialYAML = YAMLTypeByRule<typeof LabelFieldRules>

export interface LabelFieldTypedYAML extends LabelFieldPartialYAML {
  Тип: "ПолеНадписи"
}

export type LabelFieldEnterprise = EnterpriseType<typeof LabelFieldRules>
