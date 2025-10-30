import { TChildItems, TChildItemsXML } from "./types"
import { importElementFromXML } from "~/lib/xml/import/importerFactory"

export const importChildItemsFromXML = (xml: TChildItemsXML | undefined): TChildItems => {
  if (!xml) return []
  return xml.map((item) => importElementFromXML(item))
}
