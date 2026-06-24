import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { LabelDecorationRules } from "./rules"

export type LabelDecoration = FormTypeByRule<typeof LabelDecorationRules>

export type LabelDecorationPartialYAML = YAMLTypeByRule<typeof LabelDecorationRules>

export type LabelDecorationEnterprise = EnterpriseType<typeof LabelDecorationRules>
