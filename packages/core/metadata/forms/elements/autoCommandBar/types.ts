import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { AutoCommandBarRules } from "./rules"

export type AutoCommandBar = FormTypeByRule<typeof AutoCommandBarRules>

export type AutoCommandBarYAML = YAMLTypeByRule<typeof AutoCommandBarRules>

export type AutoCommandBarEnterprise = EnterpriseType<typeof AutoCommandBarRules>
