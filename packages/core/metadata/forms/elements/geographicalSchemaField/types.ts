import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { GeographicalSchemaFieldRules } from "./rules"

export type GeographicalSchemaField = FormTypeByRule<typeof GeographicalSchemaFieldRules>

export type GeographicalSchemaFieldPartialYAML = YAMLTypeByRule<typeof GeographicalSchemaFieldRules>

export type GeographicalSchemaFieldEnterprise = EnterpriseType<typeof GeographicalSchemaFieldRules>
