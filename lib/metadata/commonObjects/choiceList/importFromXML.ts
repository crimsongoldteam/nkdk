import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { TChoiceList, TChoiceListXML } from "./types"

export const importChoiceListFromXML = (xml: TChoiceListXML | undefined): TChoiceList | undefined => {
  if (!xml) return undefined

  const rawItems = xml["xr:Item"] ?? []

  const items = rawItems.map((item) => {
    const checkStateRaw = item["xr:CheckState"]
    const valueNode = item["xr:Value"]
    const presentation = importI8nTextFromXML(valueNode.Presentation)

    const value = valueNode.Value["#text"]

    return {
      presentation,
      checkState: checkStateRaw,
      value,
    }
  })

  return { items }
}
