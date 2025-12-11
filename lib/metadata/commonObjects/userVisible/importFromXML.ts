import { UserVisible, UserVisibleXML } from "./types"

export const importUserVisibleFromXML = (
  xml: UserVisibleXML | undefined
): UserVisible | undefined => {
  if (!xml) return undefined

  const result: UserVisible = {
    common: false,
    values: [],
  }

  for (const item of xml) {
    if (item["xr:Value"] !== undefined) {
      result.values.push({
        name: item["xr:Value"]["_name"].replace(/^Role\./, ""),
        value: item["xr:Value"]["#text"],
      })
    }

    if (item["xr:Common"] !== undefined) {
      result.common = item["xr:Common"]
    }
  }

  return result
}
