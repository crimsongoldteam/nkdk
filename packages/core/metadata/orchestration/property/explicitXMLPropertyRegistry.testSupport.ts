import { registerExplicitXMLProperty } from "./explicitXMLPropertyRegistry"
import type { MetadataItemRule } from "./types"

export function registeredExplicitXMLTestRule(itemType: string): MetadataItemRule {
  const rule = {
    itemType,
    properties: {
      mode: { type: "string", xml: "Mode", yaml: "Режим", implicitValueYAML: "Auto" },
    },
  } as MetadataItemRule
  registerExplicitXMLProperty({
    itemType,
    propertyKey: "mode",
    xmlValue: "Auto",
    yamlValue: "Auto",
  })
  return rule
}
