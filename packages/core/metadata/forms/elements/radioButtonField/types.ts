import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { RadioButtonFieldRules } from "./rules"

export type RadioButtonField = FormTypeByRule<typeof RadioButtonFieldRules>

export type RadioButtonFieldPartialYAML = YAMLTypeByRule<typeof RadioButtonFieldRules>

export type RadioButtonFieldEnterprise = EnterpriseType<typeof RadioButtonFieldRules>
