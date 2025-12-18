import { ConfigurationSettings } from "../../configurationSettings/types"
import { I8nText, I8nTextXML } from "./types"

export const importI8nTextFromXML = (
  xml: I8nTextXML | undefined,
  _configurationSettings: ConfigurationSettings
): I8nText | undefined => {
  if (!xml) return undefined

  const result: I8nText = {
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
