import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { GeographicalSchemaFieldRules } from "./rules"

export type GeographicalSchemaField = FormTypeByRule<typeof GeographicalSchemaFieldRules>

export type GeographicalSchemaFieldPartialYAML = YAMLTypeByRule<typeof GeographicalSchemaFieldRules>

export type GeographicalSchemaFieldEnterprise = EnterpriseType<typeof GeographicalSchemaFieldRules>
