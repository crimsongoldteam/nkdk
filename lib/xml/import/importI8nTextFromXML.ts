import { TI8nText } from "~/lib/metadata/types"
import { TI8nTextXML } from "../types"

export default function importI8nXmlTextFromXML(xml: TI8nTextXML | undefined): TI8nText | undefined {
  if (!xml) return undefined

  const result: TI8nText = {}

  xml.item.forEach((item) => {
    result[item.lang] = item.content
  })

  return result
}
