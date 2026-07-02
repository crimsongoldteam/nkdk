import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { TableRules } from "./rules"

export type Table = FormTypeByRule<typeof TableRules>

export type TablePartialYAML = YAMLTypeByRule<typeof TableRules>

export type TableEnterprise = EnterpriseType<typeof TableRules>
