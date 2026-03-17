import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { InputFieldRules } from "./rules"

export type InputField = FormTypeByRule<typeof InputFieldRules>

export type InputFieldEnterprise = EnterpriseType<typeof InputFieldRules>

export type InputFieldPartialYAML = YAMLTypeByRule<typeof InputFieldRules>

export interface InputFieldTypedYAML extends InputFieldPartialYAML {
  Тип: "ПолеВвода"
  ПутьКДанным: string
}
