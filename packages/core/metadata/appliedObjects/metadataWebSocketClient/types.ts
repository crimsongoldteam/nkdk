import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataWebSocketClientRules } from "./rules"

export type MetadataWebSocketClient = MetadataTypeByRule<typeof MetadataWebSocketClientRules>
export type MetadataWebSocketClientYAML = YAMLTypeByRule<typeof MetadataWebSocketClientRules>

registerMetadataItemRule({
  propertyType: "MetadataWebSocketClient",
  itemRule: MetadataWebSocketClientRules,
})
