import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { exportFormChoiceListValueToXML } from "../metadataValue/toXML"
import { ChoiceList, ChoiceListItemXML, ChoiceListXML } from "./types"

export const exportChoiceListToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  choiceList: ChoiceList | undefined
): ChoiceListXML | undefined => {
  if (!choiceList || choiceList.length === 0) return undefined

  const items: ChoiceListItemXML[] = choiceList.map((item) => ({
    "xr:CheckState": 0,
    "xr:Value": exportFormChoiceListValueToXML(context, undefined, item)!,
  }))

  return {
    "xr:Item": items,
  }
}

registerTypeRule("ChoiceList", "exportToXML", exportChoiceListToXML)
