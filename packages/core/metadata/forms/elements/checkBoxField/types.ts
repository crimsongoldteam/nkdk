import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { CheckBoxFieldRules } from "./rules"

export type CheckBoxField = FormTypeByRule<typeof CheckBoxFieldRules>

export type CheckBoxFieldPartialYAML = YAMLTypeByRule<typeof CheckBoxFieldRules>

export interface CheckBoxFieldTypedYAML extends CheckBoxFieldPartialYAML {
  Тип: "ПолеФлажок"
}

export type CheckBoxFieldEnterprise = EnterpriseType<typeof CheckBoxFieldRules>
