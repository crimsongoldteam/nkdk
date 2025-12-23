import { Context } from "../../context/types"
import { UserVisible, UserVisibleXML } from "./types"

export const importUserVisibleFromXML = (
  _context: Context,
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
    for (const item of xml["xr:Value"]) {
      result.values.push({
        name: item["_name"].replace(/^Role\./, ""),
        value: item["#text"],
      })
    }
  }
  return result
}
