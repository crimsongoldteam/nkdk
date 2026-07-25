import { ConfigurationContext } from "../context/types"
import { getConfigurationIndexCollectionContext } from "../configurationIndex/collector/context"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { registerTypeRule } from "../orchestration/property/typeRuleRegistry"
import * as SE from "./types"

const systemEnumerationTables = SE as unknown as Record<string, Record<string, string>>

export const importSystemEnumerationFromXML = <T extends string>(
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: T | { "#text"?: T; [key: string]: unknown } | undefined
): T | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "object" && value !== null && "#text" in value) {
    return value["#text"]
  }
  return value as T
}

registerTypeRule("SystemEnumeration", "importFromXML", importSystemEnumerationFromXML)
registerTypeRule("SystemEnumeration", "collectConfigurationIndexFromXML", ({ context, rule, xml, propertyKey }) => {
  const collection = getConfigurationIndexCollectionContext(context)
  const value = typeof xml === "string" ? xml : xmlValue(xml)
  if (collection === undefined || value === undefined) return

  const systemEnumerationRule = rule as SE.SystemEnumerationPropertyRule
  const toYAML = systemEnumerationTables[`${systemEnumerationRule.typeSE}ToYAML`]
  const fromYAML = systemEnumerationTables[`${systemEnumerationRule.typeSE}FromYAML`]
  const yamlValue = toYAML?.[value]
  const canonicalValue = yamlValue === undefined ? undefined : fromYAML?.[yamlValue]
  if (canonicalValue === value) return

  collection.collector.setXmlText(`${collection.logicalAddress}.${propertyKey}`, value)
})
registerTypeRule("SystemEnumeration", "configurationIndexValueFromXML", {
  referenceXMLFromValue: (value) => value.xmlText,
})

function xmlValue(value: unknown): string | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined
  const text = (value as Record<string, unknown>)["#text"]
  return typeof text === "string" ? text : undefined
}
