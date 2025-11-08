import { TI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { TI8nTextXML } from "./types"

export const importI8nTextFromXML = (
  xml: TI8nTextXML | undefined
): TI8nText | undefined => {
  if (!xml) return undefined

  const result: TI8nText = {
    formatted: undefined,
    items: {},
  }

  for (const item of xml) {
    if (item["@attributes"]?.formatted !== undefined) {
      result.formatted = item["@attributes"].formatted
    }
    const value = item["v8:item"]
    if (value !== undefined) {
      const { "v8:lang": lang, "v8:content": content } = value
      result.items[lang] = content
    }
  }

  return result
}
