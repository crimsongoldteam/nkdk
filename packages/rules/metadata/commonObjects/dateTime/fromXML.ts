import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { isEmptyXmlElement, isXmlElementNode, xmlTextValue, type XmlElementNode, type ConfigurationContext } from "@nkdk/runtime"

type DateTimeXML = string | { "#text"?: string; "_xsi:type"?: string } | undefined

export const importDateTimeFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: DateTimeXML | XmlElementNode
): string | undefined => {
  if (value === undefined) return undefined
  if (isXmlElementNode(value)) {
    const text = xmlTextValue(value)
    if (text !== "") return text
    // Сохраняет прежнее строковое приведение непустого объекта без #text.
    return isEmptyXmlElement(value) ? undefined : "[object Object]"
  }

  const rawValue = typeof value === "object" && value !== null && "#text" in value ? value["#text"] : value
  if (rawValue === undefined || rawValue === "") return undefined

  return String(rawValue)
}

export const metadataPropertyRule000 = definePropertyTypeRule("dateTime", "importFromXML", importDateTimeFromXML)
