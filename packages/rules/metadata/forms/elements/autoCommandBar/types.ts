import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { AutoCommandBarRules } from "./rules"

export type AutoCommandBar = FormTypeByRule<typeof AutoCommandBarRules>

export type AutoCommandBarYAML = YAMLTypeByRule<typeof AutoCommandBarRules>

export type AutoCommandBarEnterprise = EnterpriseType<typeof AutoCommandBarRules>
