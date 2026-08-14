import { registerExplicitXMLProperty } from "../../metadata/ruleRuntime/property/explicitXMLPropertyRegistry"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { XML_ABSENT_TAG_VALUE, XML_PRESENT_TAG_VALUE } from "@nkdk/runtime"

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
    yamlValue: XML_PRESENT_TAG_VALUE,
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
    yamlValue: XML_ABSENT_TAG_VALUE,
  })
  return rule
}
import { registerCommonObjects } from "../../metadata/commonObjects"

registerCommonObjects()
