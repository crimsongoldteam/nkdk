import { TI8nText } from "~/lib/metadata/types"
import { TI8nTextXML } from "../types"

export default function exportI8nXmlTextToXML(xml: TI8nText | undefined): TI8nTextXML | undefined {
  if (!xml) return undefined

  const result: TI8nTextXML = []

  Object.entries(xml).forEach(([lang, content]) => {
    result.push({ "v8:item": { "v8:lang": lang, "v8:content": content } })
  })

  return result
}
