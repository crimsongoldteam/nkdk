import { ConfigurationSettings } from "../../configurationSettings/types"
import { I8nText, I8nTextXML } from "./types"

export const exportI8nTextToXML = (
  data: I8nText | undefined,
  _configurationSettings: ConfigurationSettings
): I8nTextXML | undefined => {
  if (!data) return undefined

  const items: I8nTextXML = { _formatted: data.formatted, "v8:item": [] }

  Object.entries(data.items).forEach(([lang, content]) => {
    items["v8:item"]?.push({ "v8:lang": lang, "v8:content": content })
  })

  return items
}
