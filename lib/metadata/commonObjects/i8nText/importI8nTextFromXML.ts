import { TI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { TI8nTextXML } from "./types"

export const importI8nTextFromXML = (xml: TI8nTextXML | undefined): TI8nText | undefined => {
  if (!xml) return undefined

  const result: TI8nText = {}

  // Handle both array and single object cases
  const items = Array.isArray(xml) ? xml : [xml]

  items.forEach((langItem) => {
    const item = langItem["v8:item"]
    result[item["v8:lang"]] = item["v8:content"]
  })

  return result
}
