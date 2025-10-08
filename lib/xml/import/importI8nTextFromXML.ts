import { TI8nText } from "~/lib/metadata/types"
import { TI8nTextXML } from "../types"

export default function importI8nXmlTextFromXML(xml: TI8nTextXML | undefined): TI8nText | undefined {
  if (!xml) return undefined

  const result: TI8nText = {}

  xml.forEach((langItem) => {
    const item = langItem["v8:item"]
    result[item["v8:lang"]] = item["v8:content"]
  })

  return result
}
