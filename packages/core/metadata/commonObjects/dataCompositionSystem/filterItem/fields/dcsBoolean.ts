import type { ConfigurationContextFromXML } from "../../../../context/types"
import { importStringFromXML } from "../../../string/fromXML"
import { registerTypeRule } from "../../../../orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "../../../../orchestration/property/types"

const exportDcsBooleanToXML = (_context: unknown, _rule: PropertyRule | undefined, value: string | undefined) => {
  if (value === undefined) return undefined
  return { "_xsi:type": "xs:boolean", "#text": String(value) }
}

const importDcsBooleanFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: unknown
) => {
  return importStringFromXML(context, rule as any, xml as any)
}

registerTypeRule("DcsBoolean", "exportToXML", exportDcsBooleanToXML as any)
registerTypeRule("DcsBoolean", "importFromXML", importDcsBooleanFromXML as any)
