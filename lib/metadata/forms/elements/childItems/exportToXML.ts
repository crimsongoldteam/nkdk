import { exportElementToXML } from "~/lib/xml/export/exporterFactory"
import { TChildItemsXML } from "./types"
import { TChildItems } from "./typesExt"

export const exportChildItemsToXML = (
  data: TChildItems | undefined
): TChildItemsXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: TChildItemsXML = []
  for (const item of data) {
    result.push(exportElementToXML(item))
  }

  return result
}
