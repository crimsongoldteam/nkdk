import { TI8nText, TI8nTextXML } from "./types"

export const exportI8nTextToXML = (data: TI8nText | undefined): TI8nTextXML | undefined => {
  if (!data) return undefined

  const result: TI8nTextXML = {
    _formatted: data.formatted,
    "v8:item": [],
  }

  Object.entries(data.items).forEach(([lang, content]) => {
    result["v8:item"].push({ "v8:lang": lang, "v8:content": content })
  })

  return result
}
