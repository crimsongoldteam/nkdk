import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { InputFieldRules, TableInputFieldRules } from "./rules"

export type InputField = FormTypeByRule<typeof InputFieldRules>
export type TableInputField = FormTypeByRule<typeof TableInputFieldRules>

export type InputFieldEnterprise = EnterpriseType<typeof InputFieldRules>
export type TableInputFieldEnterprise = EnterpriseType<typeof TableInputFieldRules>

export type InputFieldPartialYAML = YAMLTypeByRule<typeof InputFieldRules>
export type TableInputFieldPartialYAML = YAMLTypeByRule<typeof TableInputFieldRules>

export interface TableInputFieldTypedYAML extends TableInputFieldPartialYAML {
  Тип: "ПолеВвода"
  ПутьКДанным?: string
}
