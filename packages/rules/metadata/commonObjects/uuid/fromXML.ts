import { isXmlElementNode, xmlTextValue, type XmlElementNode, type ConfigurationContextFromXML } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"

export const importUUIDFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: string | XmlElementNode | undefined
): string | undefined => {
  if (value === undefined) return undefined
  if (isXmlElementNode(value)) return xmlTextValue(value) || undefined
  return String(value)
}

export const metadataPropertyRule000 = definePropertyTypeRule("uuid", "importFromXML", importUUIDFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("uuid", "configurationIndexValueFromXML", {
  identityKind: "uuid",
})
