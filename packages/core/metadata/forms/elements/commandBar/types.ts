import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { CommandBarRules } from "./rules"

export type CommandBar = FormTypeByRule<typeof CommandBarRules>

export type CommandBarPartialYAML = YAMLTypeByRule<typeof CommandBarRules>

export type CommandBarEnterprise = EnterpriseType<typeof CommandBarRules>
