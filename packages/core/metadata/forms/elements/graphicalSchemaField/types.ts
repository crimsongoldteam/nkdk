import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { GraphicalSchemaFieldRules } from "./rules"

export type GraphicalSchemaField = FormTypeByRule<typeof GraphicalSchemaFieldRules>

export type GraphicalSchemaFieldPartialYAML = YAMLTypeByRule<typeof GraphicalSchemaFieldRules>

export type GraphicalSchemaFieldEnterprise = EnterpriseType<typeof GraphicalSchemaFieldRules>
