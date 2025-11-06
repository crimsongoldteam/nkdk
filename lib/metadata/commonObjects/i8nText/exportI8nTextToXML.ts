import { TI8nText, TI8nTextXML } from "./types"

export const exportI8nTextToXML = (data: TI8nText | undefined): TI8nTextXML | undefined => {
  if (!data) return undefined

  const items: Array<{ "v8:lang": string; "v8:content": string }> = []

  Object.entries(data.items).forEach(([lang, content]) => {
    items.push({ "v8:lang": lang, "v8:content": content })
  })

  const result: TI8nTextXML = {
    _formatted: data.formatted,
    "v8:item": items,
  }

  return result
}
