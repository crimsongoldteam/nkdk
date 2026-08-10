import { definePropertyTypeRule } from "../../../../ruleRuntime/property/propertyRuleRegistrySet"
import type { ConfigurationContext, ConfigurationContextFromXML } from "@nkdk/runtime"
import { importStringFromXML } from "../../../string/fromXML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"

const exportDcsFieldToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
) => {
  if (value === undefined) return undefined
  return { "_xsi:type": "dcscor:Field", "#text": String(value) }
}

const importDcsFieldFromXML = (context: ConfigurationContextFromXML, rule: PropertyRule | undefined, xml: unknown) => {
  return importStringFromXML(context, rule as any, xml as any)
}

const exportDcsFieldToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
) => {
  if (value === undefined) return undefined
  // В FilterItem левые значения в YAML идут как ".Поле"
  return `.${value}`
}

const importDcsFieldFromYAML = (_context: ConfigurationContext, _rule: PropertyRule | undefined, value: unknown) => {
  if (typeof value !== "string") return undefined
  return value.startsWith(".") ? value.slice(1) : value
}

export const metadataPropertyRule000 = definePropertyTypeRule("DcsField", "exportToXML", exportDcsFieldToXML as any)
export const metadataPropertyRule001 = definePropertyTypeRule("DcsField", "importFromXML", importDcsFieldFromXML as any)
export const metadataPropertyRule002 = definePropertyTypeRule("DcsField", "exportToYAML", exportDcsFieldToYAML as any)
export const metadataPropertyRule003 = definePropertyTypeRule("DcsField", "importFromYAML", importDcsFieldFromYAML as any)
