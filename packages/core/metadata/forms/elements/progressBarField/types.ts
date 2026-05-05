import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ProgressBarFieldRules } from "./rules"

export type ProgressBarField = FormTypeByRule<typeof ProgressBarFieldRules>

export type ProgressBarFieldPartialYAML = YAMLTypeByRule<typeof ProgressBarFieldRules>

export type ProgressBarFieldEnterprise = EnterpriseType<typeof ProgressBarFieldRules>
