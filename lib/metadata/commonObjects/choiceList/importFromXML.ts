import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { TChoiceList, TChoiceListXML } from "./types"

export const importChoiceListFromXML = (
  xml: TChoiceListXML | undefined
): TChoiceList | undefined => {
  if (!xml || xml.length === 0) return undefined

  const items = xml.map((item) => {
    const choiceListItem = item["xr:Item"]
    const checkStateRaw = choiceListItem["xr:CheckState"]
    const valueNode = choiceListItem["xr:Value"]
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
