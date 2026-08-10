import { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { DateTimePropertyRule } from "./types"

export const exportDateTimeToXML = (
  _context: ConfigurationContextWithExportToXML,
  rule: PropertyRule | undefined,
  value: string | undefined
): string | { "_xsi:type": "xs:dateTime"; "#text": string } | undefined => {
  if (value === undefined) return undefined
  const dateTimeRule = rule as DateTimePropertyRule | undefined
  if (dateTimeRule?.typedXML) {
    return { "_xsi:type": "xs:dateTime", "#text": value }
  }
  return value
}

export const metadataPropertyRule000 = definePropertyTypeRule("dateTime", "exportToXML", exportDateTimeToXML)
