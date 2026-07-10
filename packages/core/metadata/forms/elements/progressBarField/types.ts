import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { ProgressBarFieldRules } from "./rules"

export type ProgressBarField = FormTypeByRule<typeof ProgressBarFieldRules>

export type ProgressBarFieldPartialYAML = YAMLTypeByRule<typeof ProgressBarFieldRules>

export type ProgressBarFieldEnterprise = EnterpriseType<typeof ProgressBarFieldRules>
