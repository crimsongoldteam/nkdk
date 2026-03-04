import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { importFormChoiceListValueFromXML } from "../metadataValue/fromXML"
import { ChoiceList, ChoiceListXML } from "./types"

export const importChoiceListFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ChoiceListXML | undefined
): ChoiceList | undefined => {
  if (!xml || !xml["xr:Item"]) return undefined

  const xrItem = xml["xr:Item"]

  const items = Array.isArray(xrItem) ? xrItem : [xrItem]

  const result = items.map((item) => {
    return importFormChoiceListValueFromXML(context, undefined, item["xr:Value"])!
  })

  return result
}

registerTypeRule("ChoiceList", "importFromXML", importChoiceListFromXML)
