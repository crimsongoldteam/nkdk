import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { TableRules } from "./rules"

export type Table = FormTypeByRule<typeof TableRules>

export type TablePartialYAML = YAMLTypeByRule<typeof TableRules>

export type TableEnterprise = EnterpriseType<typeof TableRules>
