import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { ProgressBarFieldRules } from "./rules"

export type ProgressBarField = FormTypeByRule<typeof ProgressBarFieldRules>

export type ProgressBarFieldPartialYAML = YAMLTypeByRule<typeof ProgressBarFieldRules>

export type ProgressBarFieldEnterprise = EnterpriseType<typeof ProgressBarFieldRules>
