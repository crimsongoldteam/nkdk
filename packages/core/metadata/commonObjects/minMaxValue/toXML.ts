import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { getMinMaxValueXsiType } from "./types"

export const exportMinMaxValueToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: number | Number | undefined,
  referenceValue?: unknown
): { "_xsi:type": "xs:string" | "xs:decimal"; "#text": string } | undefined => {
  if (value === undefined) return undefined

  return {
    "_xsi:type": getMinMaxValueXsiType(referenceValue) ?? "xs:decimal",
    "#text": String(value),
  }
}

registerTypeRule("MinMaxValue", "exportToXML", exportMinMaxValueToXML)
