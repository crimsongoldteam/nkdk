import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { PageRules } from "./rules"

export type Page = FormTypeByRule<typeof PageRules>

export type PagePartialYAML = YAMLTypeByRule<typeof PageRules>

export type PageEnterprise = EnterpriseType<typeof PageRules>
