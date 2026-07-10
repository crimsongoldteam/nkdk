import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { DendrogramFieldRules } from "./rules"

export type DendrogramField = FormTypeByRule<typeof DendrogramFieldRules>

export type DendrogramFieldPartialYAML = YAMLTypeByRule<typeof DendrogramFieldRules>

export type DendrogramFieldEnterprise = EnterpriseType<typeof DendrogramFieldRules>
