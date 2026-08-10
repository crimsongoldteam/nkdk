import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { DendrogramFieldRules } from "./rules"

export type DendrogramField = FormTypeByRule<typeof DendrogramFieldRules>

export type DendrogramFieldPartialYAML = YAMLTypeByRule<typeof DendrogramFieldRules>

export type DendrogramFieldEnterprise = EnterpriseType<typeof DendrogramFieldRules>
