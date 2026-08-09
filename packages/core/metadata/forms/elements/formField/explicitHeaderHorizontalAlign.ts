import { registerExplicitXMLProperty } from "../../../ruleRuntime/property/explicitXMLPropertyRegistry"

export function registerExplicitHeaderHorizontalAlign(itemType: string): void {
  registerExplicitXMLProperty({
    itemType,
    propertyKey: "headerHorizontalAlign",
    xmlValue: "Auto",
    yamlValue: "Авто",
  })
}
