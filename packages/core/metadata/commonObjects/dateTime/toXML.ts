import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { DateTimePropertyRule } from "./types"

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

registerTypeRule("dateTime", "exportToXML", exportDateTimeToXML)
