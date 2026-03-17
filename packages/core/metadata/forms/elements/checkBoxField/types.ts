import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
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
