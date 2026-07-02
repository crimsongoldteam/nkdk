import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { LabelFieldRules, TableLabelFieldRules } from "./rules"

export type LabelField = FormTypeByRule<typeof LabelFieldRules>
export type TableLabelField = FormTypeByRule<typeof TableLabelFieldRules>

export type LabelFieldPartialYAML = YAMLTypeByRule<typeof LabelFieldRules>
export type TableLabelFieldPartialYAML = YAMLTypeByRule<typeof TableLabelFieldRules>

export interface TableLabelFieldTypedYAML extends TableLabelFieldPartialYAML {
  Тип: "ПолеНадписи"
  ПутьКДанным?: string
}

export type LabelFieldEnterprise = EnterpriseType<typeof LabelFieldRules>
export type TableLabelFieldEnterprise = EnterpriseType<typeof TableLabelFieldRules>
