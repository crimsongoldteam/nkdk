import { Context } from "../../context/types"
import { importFormChoiceListValueFromXML } from "../metadataValue/importFromXML"
import { ChoiceList, ChoiceListXML } from "./types"

export const importChoiceListFromXML = (context: Context, xml: ChoiceListXML | undefined): ChoiceList | undefined => {
  if (!xml || !xml["xr:Item"]) return undefined

  const xrItem = xml["xr:Item"]

  const items = Array.isArray(xrItem) ? xrItem : [xrItem]

  const result = items.map((item) => {
    return importFormChoiceListValueFromXML(context, item["xr:Value"])!
  })

  return result
}
