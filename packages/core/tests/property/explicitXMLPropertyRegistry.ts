import { registerExplicitXMLProperty } from "../../metadata/orchestration/property/explicitXMLPropertyRegistry"
import type { MetadataItemRule } from "../../metadata/orchestration/property/types"

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
