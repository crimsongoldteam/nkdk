import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { RadioButtonFieldRules } from "./rules"

export type RadioButtonField = FormTypeByRule<typeof RadioButtonFieldRules>

export type RadioButtonFieldPartialYAML = YAMLTypeByRule<typeof RadioButtonFieldRules>

export type RadioButtonFieldEnterprise = EnterpriseType<typeof RadioButtonFieldRules>
