import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { AutoCommandBarRules } from "./rules"

export type AutoCommandBar = FormTypeByRule<typeof AutoCommandBarRules>

export type AutoCommandBarYAML = YAMLTypeByRule<typeof AutoCommandBarRules>

export type AutoCommandBarEnterprise = EnterpriseType<typeof AutoCommandBarRules>
