import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importStringFromXML } from "~/metadata/commonObjects/string/fromXML"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "~/metadata/orchestration/property/types"

const exportDcsBooleanToXML = (
  _context: unknown,
  _rule: PropertyRule | undefined,
  value: string | undefined
) => {
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

