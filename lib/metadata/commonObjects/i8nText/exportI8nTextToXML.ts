import { I8nText, I8nTextXML } from "./types"

export const exportI8nTextToXML = (
  data: I8nText | undefined
): I8nTextXML | undefined => {
  if (!data) return undefined

  const items: I8nTextXML = []

  Object.entries(data.items).forEach(([lang, content]) => {
    items.push({ "v8:item": { "v8:lang": lang, "v8:content": content } })
  })

  const result =
    data.formatted !== undefined
      ? [{ "@attributes": { formatted: data.formatted } }, ...items]
      : items

  return result
}
