import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { TableRules } from "./rules"

export type Table = FormTypeByRule<typeof TableRules>

export type TablePartialYAML = YAMLTypeByRule<typeof TableRules>

export type TableEnterprise = EnterpriseType<typeof TableRules>
