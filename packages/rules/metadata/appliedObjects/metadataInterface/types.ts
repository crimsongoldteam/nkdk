import { defineMetadataItemRule } from "../../ruleRuntime"
import type { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import type { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataInterfaceRules } from "./rules"

export type MetadataInterface = MetadataTypeByRule<typeof MetadataInterfaceRules>
export type MetadataInterfaceYAML = YAMLTypeByRule<typeof MetadataInterfaceRules>

export const metadataRuleLayer000 = defineMetadataItemRule({ propertyType: "MetadataInterface", itemRule: MetadataInterfaceRules })
