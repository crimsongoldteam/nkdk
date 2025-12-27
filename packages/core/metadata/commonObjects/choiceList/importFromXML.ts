import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { Context } from "../../context/types"
import { ChoiceList, ChoiceListXML } from "./types"

export const importChoiceListFromXML = (context: Context, xml: ChoiceListXML | undefined): ChoiceList | undefined => {
  if (!xml || xml.length === 0) return undefined

  const items = xml.map((item) => {
    const choiceListItem = item["xr:Item"]
    const checkStateRaw = choiceListItem["xr:CheckState"]
    const valueNode = choiceListItem["xr:Value"]
    const presentation = importI8nTextFromXML(context, valueNode.Presentation)

    const value = valueNode.Value["#text"]
    // Преобразуем boolean в string для совместимости
    const valueString = typeof value === "boolean" ? String(value) : value

    return {
      presentation,
      checkState: checkStateRaw,
      value: valueString,
    }
  })

  return { items }
}
