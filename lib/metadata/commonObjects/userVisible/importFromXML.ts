import { TUserVisible, TUserVisibleXML } from "./types"

export const importUserVisibleFromXML = (
  xml: TUserVisibleXML | undefined
): TUserVisible | undefined => {
  if (!xml) return undefined

  let items: Array<{ _name: string; "#text": boolean }> = []

  const value = xml["xr:Value"]

  if (value !== undefined) {
    items = Array.isArray(value) ? value : [value]
  }

  const result: TUserVisible = {
    common: xml["xr:Common"],
    values: items.map((item) => ({
      name: item._name.replace(/^Role\./, ""),
      value: item["#text"],
    })),
  }

  return result
}
