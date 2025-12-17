import { importElementFromXML } from "~/lib/xml/import/importerFactory"
import { ChildItems, ChildItemsXML } from "./types"

export const importChildItemsFromXML = (xml: ChildItemsXML | undefined): ChildItems => {
  if (!xml) return []
  return xml
    .filter((item) => {
      const keys = Object.keys(item)
      return keys.length > 0
    })
    .map((item) => importElementFromXML(item))
    .filter((item): item is NonNullable<typeof item> => item !== undefined)
}
