import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { CommandBarRules } from "./rules"

export type CommandBar = FormTypeByRule<typeof CommandBarRules>

export type CommandBarPartialYAML = YAMLTypeByRule<typeof CommandBarRules>

export type CommandBarEnterprise = EnterpriseType<typeof CommandBarRules>
