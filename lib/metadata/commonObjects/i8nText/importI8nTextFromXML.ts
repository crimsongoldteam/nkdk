import { TI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { TI8nTextXML } from "./types"

export const importI8nTextFromXML = (xml: TI8nTextXML | undefined): TI8nText | undefined => {
  if (!xml) return undefined

  const result: TI8nText = {
    formatted: xml._formatted,
    items: {},
  }

  xml["v8:item"].forEach((item) => {
    result.items[item["v8:lang"]] = item["v8:content"]
  })

  return result
}
