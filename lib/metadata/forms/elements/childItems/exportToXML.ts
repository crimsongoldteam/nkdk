import { exportElementToXML } from "~/lib/xml/export/exporterFactory"
import { ChildItems, ChildItemsXML } from "./types"

export const exportChildItemsToXML = (data: ChildItems | undefined): ChildItemsXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ChildItemsXML = []
  for (const item of data) {
    result.push(exportElementToXML(item))
  }

  return result
}
