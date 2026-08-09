import { MetadataTypeByRule } from "../../../../../ruleRuntime/metadataItem/element"
import { GroupItemAutoRules } from "./rules"

export type GroupItemAuto = MetadataTypeByRule<typeof GroupItemAutoRules>

export type GroupItemAutoYAML = "[Авто]" | "([Авто])"
