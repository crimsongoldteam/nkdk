import type { ConfigurationContext, ConfigurationContextFromXML } from "../../../../context/types"
import { importStringFromXML } from "../../../string/fromXML"
import { registerTypeRule } from "../../../../orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "../../../../orchestration/property/types"

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

registerTypeRule("DcsField", "exportToXML", exportDcsFieldToXML as any)
registerTypeRule("DcsField", "importFromXML", importDcsFieldFromXML as any)
registerTypeRule("DcsField", "exportToYAML", exportDcsFieldToYAML as any)
registerTypeRule("DcsField", "importFromYAML", importDcsFieldFromYAML as any)
