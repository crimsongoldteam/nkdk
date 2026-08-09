import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { LabelDecorationRules } from "./rules"

export type LabelDecoration = FormTypeByRule<typeof LabelDecorationRules>

export type LabelDecorationPartialYAML = YAMLTypeByRule<typeof LabelDecorationRules>

export type LabelDecorationEnterprise = EnterpriseType<typeof LabelDecorationRules>
