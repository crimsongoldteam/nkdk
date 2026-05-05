import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { CommandBarRules } from "./rules"

export type CommandBar = FormTypeByRule<typeof CommandBarRules>

export type CommandBarPartialYAML = YAMLTypeByRule<typeof CommandBarRules>

export type CommandBarEnterprise = EnterpriseType<typeof CommandBarRules>
