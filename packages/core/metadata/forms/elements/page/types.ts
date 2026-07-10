import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { PageRules } from "./rules"

export type Page = FormTypeByRule<typeof PageRules>

export type PagePartialYAML = YAMLTypeByRule<typeof PageRules>

export type PageEnterprise = EnterpriseType<typeof PageRules>
