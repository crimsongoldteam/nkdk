import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataWebSocketClientRules } from "./rules"

export type MetadataWebSocketClient = MetadataTypeByRule<typeof MetadataWebSocketClientRules>
export type MetadataWebSocketClientYAML = YAMLTypeByRule<typeof MetadataWebSocketClientRules>

registerMetadataItemRule({
  propertyType: "MetadataWebSocketClient",
  itemRule: MetadataWebSocketClientRules,
})
