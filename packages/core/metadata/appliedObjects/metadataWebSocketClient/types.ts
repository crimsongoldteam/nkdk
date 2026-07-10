import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataWebSocketClientRules } from "./rules"

export type MetadataWebSocketClient = MetadataTypeByRule<typeof MetadataWebSocketClientRules>
export type MetadataWebSocketClientYAML = YAMLTypeByRule<typeof MetadataWebSocketClientRules>

registerMetadataItemRule({
  propertyType: "MetadataWebSocketClient",
  itemRule: MetadataWebSocketClientRules,
})
