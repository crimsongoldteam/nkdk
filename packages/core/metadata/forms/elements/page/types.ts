import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PageRules } from "./rules"

export type Page = FormTypeByRule<typeof PageRules>

export type PagePartialYAML = YAMLTypeByRule<typeof PageRules>

export type PageEnterprise = EnterpriseType<typeof PageRules>
