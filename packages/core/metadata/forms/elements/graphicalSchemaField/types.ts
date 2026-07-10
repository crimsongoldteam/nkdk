import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { GraphicalSchemaFieldRules } from "./rules"

export type GraphicalSchemaField = FormTypeByRule<typeof GraphicalSchemaFieldRules>

export type GraphicalSchemaFieldPartialYAML = YAMLTypeByRule<typeof GraphicalSchemaFieldRules>

export type GraphicalSchemaFieldEnterprise = EnterpriseType<typeof GraphicalSchemaFieldRules>
