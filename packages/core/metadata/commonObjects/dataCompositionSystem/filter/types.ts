import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { FilterRules } from "./rules"

export type Filter = FormTypeByRule<typeof FilterRules>

export type FilterYAML = YAMLTypeByRule<typeof FilterRules>
