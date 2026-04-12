import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { GroupItemFieldRules } from "./rules"

export type GroupItemField = MetadataTypeByRule<typeof GroupItemFieldRules>
export type GroupItemFieldYAML = string
