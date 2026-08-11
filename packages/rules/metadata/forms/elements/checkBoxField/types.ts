import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { CheckBoxFieldRules, TableCheckBoxFieldRules } from "./rules"

export type CheckBoxField = FormTypeByRule<typeof CheckBoxFieldRules>
export type TableCheckBoxField = FormTypeByRule<typeof TableCheckBoxFieldRules>

export type CheckBoxFieldPartialYAML = YAMLTypeByRule<typeof CheckBoxFieldRules>
export type TableCheckBoxFieldPartialYAML = YAMLTypeByRule<typeof TableCheckBoxFieldRules>

export interface TableCheckBoxFieldTypedYAML extends TableCheckBoxFieldPartialYAML {
  Тип: "ПолеФлажок"
  ПутьКДанным?: string
}

export type CheckBoxFieldEnterprise = EnterpriseType<typeof CheckBoxFieldRules>
export type TableCheckBoxFieldEnterprise = EnterpriseType<typeof TableCheckBoxFieldRules>
