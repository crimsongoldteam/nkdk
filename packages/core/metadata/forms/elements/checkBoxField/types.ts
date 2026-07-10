import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
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
