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

export function registeredMissingExplicitXMLTestRule(): MetadataItemRule {
  const itemType = "ExplicitXMLMissingProbe"
  const rule = {
    itemType,
    properties: {
      value: { type: "string", xml: "Value", yaml: "Поле", defaultValueXML: "default" },
    },
  } as MetadataItemRule
  registerExplicitXMLProperty({
    itemType,
    propertyKey: "value",
    action: "omit",
    yamlValue: "",
  })
  return rule
}
