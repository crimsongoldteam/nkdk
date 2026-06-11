import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { importBooleanFromXML } from "../boolean/fromXML"
import { UserVisible, UserVisibleXML } from "./types"

export const importUserVisibleFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: UserVisibleXML | undefined
): UserVisible | undefined => {
  if (!xml) return undefined

  const result: UserVisible = {
    common: false,
    values: [],
  }

  if (xml["xr:Common"] !== undefined) {
    const common = importBooleanFromXML(_context, undefined, xml["xr:Common"])
    if (common !== undefined) {
      result.common = common
    }
  }

  if (xml["xr:Value"] !== undefined) {
    const xrValues = Array.isArray(xml["xr:Value"]) ? xml["xr:Value"] : [xml["xr:Value"]]
    for (const item of xrValues) {
      const value = importBooleanFromXML(_context, undefined, item["#text"])
      if (value === undefined) continue
      result.values.push({
        name: item["_name"],
        value,
      })
    }
  }
  return result
}

registerTypeRule("UserVisible", "importFromXML", importUserVisibleFromXML)
