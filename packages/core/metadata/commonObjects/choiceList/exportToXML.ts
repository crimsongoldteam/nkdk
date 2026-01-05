import { ConfigurationContext } from "../../context/types"
import { exportFormChoiceListValueToXML } from "../metadataValue/exportToXML"
import { ChoiceList, ChoiceListItemXML, ChoiceListXML } from "./types"

export const exportChoiceListToXML = (
  context: ConfigurationContext,
  choiceList: ChoiceList | undefined
): ChoiceListXML | undefined => {
  if (!choiceList || choiceList.length === 0) return undefined

  const items: ChoiceListItemXML[] = choiceList.map((item) => ({
    "xr:Presentation": "",
    "xr:CheckState": 0,
    "xr:Value": exportFormChoiceListValueToXML(context, item)!,
  }))

  return {
    "xr:Item": items,
  }
}
