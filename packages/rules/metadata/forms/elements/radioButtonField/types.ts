import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { RadioButtonFieldRules } from "./rules"

export type RadioButtonField = FormTypeByRule<typeof RadioButtonFieldRules>

export type RadioButtonFieldPartialYAML = YAMLTypeByRule<typeof RadioButtonFieldRules>

export type RadioButtonFieldEnterprise = EnterpriseType<typeof RadioButtonFieldRules>
