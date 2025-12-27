import { Context } from "~/metadata/context/types"
import { I8nText, I8nTextLanguageXML, I8nTextXML } from "./types"

export const exportI8nTextToXML = (_context: Context, data: I8nText | undefined): I8nTextXML | undefined => {
  if (!data) return undefined

  const v8Items: I8nTextLanguageXML[] = []
  Object.entries(data.items).forEach(([lang, content]) => {
    v8Items.push({ "v8:lang": lang, "v8:content": content })
  })

  return { _formatted: data.formatted, "v8:item": v8Items }
}
