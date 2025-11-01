import { TChildItems, TChildItemsXML } from "./types"
import { exportElementToXML } from "~/lib/xml/export/exporterFactory"

export const exportChildItemsToXML = (data: TChildItems | undefined): TChildItemsXML => {
  if (!data || data.length === 0) return []
  return data.map((item) => exportElementToXML(item))
}
