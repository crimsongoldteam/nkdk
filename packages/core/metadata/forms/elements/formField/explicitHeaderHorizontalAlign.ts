import { registerExplicitXMLProperty } from "../../../ruleRuntime/property/explicitXMLPropertyRegistry"
import { EMPTY_XML_TAG_VALUE } from "../../../../yaml/scalarTags"

export function registerExplicitHeaderHorizontalAlign(itemType: string): void {
  registerExplicitXMLProperty({
    itemType,
    propertyKey: "headerHorizontalAlign",
    xmlValue: "Auto",
    yamlValue: EMPTY_XML_TAG_VALUE,
  })
}
