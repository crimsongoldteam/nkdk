import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { DendrogramFieldRules } from "./rules"

export type DendrogramField = FormTypeByRule<typeof DendrogramFieldRules>

export type DendrogramFieldPartialYAML = YAMLTypeByRule<typeof DendrogramFieldRules>

export type DendrogramFieldEnterprise = EnterpriseType<typeof DendrogramFieldRules>
