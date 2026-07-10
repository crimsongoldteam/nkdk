import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { LabelDecorationRules } from "./rules"

export type LabelDecoration = FormTypeByRule<typeof LabelDecorationRules>

export type LabelDecorationPartialYAML = YAMLTypeByRule<typeof LabelDecorationRules>

export type LabelDecorationEnterprise = EnterpriseType<typeof LabelDecorationRules>
