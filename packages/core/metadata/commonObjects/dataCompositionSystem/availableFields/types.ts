import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { AvailableFieldsRules } from "./rules"

export type AvailableFields = FormTypeByRule<typeof AvailableFieldsRules>

export type AvailableFieldsYAML = YAMLTypeByRule<typeof AvailableFieldsRules>
