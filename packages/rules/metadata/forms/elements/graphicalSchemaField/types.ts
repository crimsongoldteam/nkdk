import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { GraphicalSchemaFieldRules } from "./rules"

export type GraphicalSchemaField = FormTypeByRule<typeof GraphicalSchemaFieldRules>

export type GraphicalSchemaFieldPartialYAML = YAMLTypeByRule<typeof GraphicalSchemaFieldRules>

export type GraphicalSchemaFieldEnterprise = EnterpriseType<typeof GraphicalSchemaFieldRules>
