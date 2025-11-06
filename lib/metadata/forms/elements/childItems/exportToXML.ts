import { ZChildItems, TChildItemsXML } from "./types"
import { exportElementToXML } from "~/lib/xml/export/exporterFactory"
import z from "zod"

export const exportChildItemsToXML = (
  data: z.infer<typeof ZChildItems> | undefined
): TChildItemsXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: TChildItemsXML = []
  for (const item of data) {
    result.push(exportElementToXML(item))
  }

  return result
}
