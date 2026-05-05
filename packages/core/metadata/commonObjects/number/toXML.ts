import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { NumberPropertyRule } from "./types"

export const exportNumberToXML = (
  _context: ConfigurationContextWithExportToXML,
  rule: PropertyRule | undefined,
  value: number | undefined
): number | { "_xsi:type": "xs:decimal"; "#text": string } | undefined => {
  if (value === undefined) return undefined
  const numberRule = rule as NumberPropertyRule | undefined
  if (numberRule?.typedXML) {
    return { "_xsi:type": "xs:decimal", "#text": String(value) }
  }
  return value
}

registerTypeRule("number", "exportToXML", exportNumberToXML)
