import { TChildItems, TChildItemsXML } from "./types"
import { importElementFromXML } from "~/lib/xml/import/importerFactory"

export const importChildItemsFromXML = (xml: TChildItemsXML | undefined): TChildItems => {
  if (!xml) return []
  return xml
    .filter((item) => {
      const keys = Object.keys(item)
      return keys.length > 0
    })
    .map((item) => importElementFromXML(item))
    .filter((item): item is NonNullable<typeof item> => item !== undefined)
}
