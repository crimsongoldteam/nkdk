import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { RecalculationRules } from "./rules"

export type Recalculation = MetadataTypeByRule<typeof RecalculationRules>
export type RecalculationYAML = YAMLTypeByRule<typeof RecalculationRules>
