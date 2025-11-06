import { TUserVisible, TUserVisibleXML } from "./types"

export const importUserVisibleFromXML = (
  xml: TUserVisibleXML | undefined
): TUserVisible | undefined => {
  if (!xml) return undefined

  let items: Array<{ _name: string; "#text": boolean }> = []

  if (Array.isArray(xml.Value)) {
    items = xml.Value
  } else if (
    xml.Value &&
    typeof xml.Value === "object" &&
    "Item" in xml.Value
  ) {
    const itemValue = xml.Value.Item
    items = Array.isArray(itemValue) ? itemValue : [itemValue]
  } else if (
    xml.Value &&
    typeof xml.Value === "object" &&
    Object.keys(xml.Value).length === 0
  ) {
    // empty object <Value />
    items = []
  } else if (xml.Value === undefined) {
    // undefined for <Value />
    items = []
  }

  const result: TUserVisible = {
    common: xml.Common,
    values: items.map((item) => ({
      name: item._name.replace(/^Role\./, ""),
      value: item["#text"],
    })),
  }

  return result
}
