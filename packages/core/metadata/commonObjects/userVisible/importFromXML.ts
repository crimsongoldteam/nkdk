import { ConfigurationContext } from "../../context/types"
import { UserVisible, UserVisibleXML } from "./types"

export const importUserVisibleFromXML = (
  _context: ConfigurationContext,
  xml: UserVisibleXML | undefined
): UserVisible | undefined => {
  if (!xml) return undefined

  const result: UserVisible = {
    common: false,
    values: [],
  }

  if (xml["xr:Common"] !== undefined) {
    result.common = xml["xr:Common"]
  }

  if (xml["xr:Value"] !== undefined) {
    const xrValues = Array.isArray(xml["xr:Value"]) ? xml["xr:Value"] : [xml["xr:Value"]]
    for (const item of xrValues) {
      result.values.push({
        name: item["_name"].replace(/^Role\./, ""),
        value: item["#text"],
      })
    }
  }
  return result
}
