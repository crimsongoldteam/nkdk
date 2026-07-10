import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { GeographicalSchemaFieldRules } from "./rules"

export type GeographicalSchemaField = FormTypeByRule<typeof GeographicalSchemaFieldRules>

export type GeographicalSchemaFieldPartialYAML = YAMLTypeByRule<typeof GeographicalSchemaFieldRules>

export type GeographicalSchemaFieldEnterprise = EnterpriseType<typeof GeographicalSchemaFieldRules>
