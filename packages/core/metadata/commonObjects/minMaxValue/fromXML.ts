import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { attachMinMaxValueXsiType, MinMaxValueXsiType } from "./types"

const MIN_MAX_VALUE_XSI_TYPES = new Set<MinMaxValueXsiType>(["xs:string", "xs:decimal"])

type MinMaxValueXML =
  | number
  | string
  | { "#text"?: number | string; "_xsi:type"?: string }
  | undefined

export const importMinMaxValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: MinMaxValueXML
): number | Number | undefined => {
  const rawValue = getMinMaxValueText(value)

  if (rawValue === undefined || rawValue === "") return undefined

  const result = typeof rawValue === "number" ? rawValue : Number(rawValue.replace(",", "."))
  const xsiType = typeof value === "object" && value !== null ? value["_xsi:type"] : undefined

  if (context.fromXML.forReference && isMinMaxValueXsiType(xsiType)) {
    return attachMinMaxValueXsiType(result, xsiType, String(rawValue))
  }

  return result
}

const getMinMaxValueText = (value: MinMaxValueXML): number | string | undefined => {
  if (typeof value === "object" && value !== null) {
    return value["#text"]
  }

  if (typeof value === "number" || typeof value === "string") {
    return value
  }

  return undefined
}

const isMinMaxValueXsiType = (value: string | undefined): value is MinMaxValueXsiType => {
  return value !== undefined && MIN_MAX_VALUE_XSI_TYPES.has(value as MinMaxValueXsiType)
}

registerTypeRule("MinMaxValue", "importFromXML", importMinMaxValueFromXML)
