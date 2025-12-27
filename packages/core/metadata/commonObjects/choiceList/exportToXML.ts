import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { Context } from "../../context/types"
import { ChoiceList, ChoiceListXML } from "./types"

export const exportChoiceListToXML = (
  context: Context,
  choiceList: ChoiceList | undefined
): ChoiceListXML | undefined => {
  if (!choiceList) return undefined

  return choiceList.items.map((item) => ({
    "xr:Item": {
      "xr:Presentation": undefined,
      "xr:CheckState": item.checkState,
      "xr:Value": {
        "_xsi:type": "FormChoiceListDesTimeValue",
        Presentation: exportI8nTextToXML(context, item.presentation),
        Value: {
          "_xsi:type": "xs:string",
          "#text": item.value,
        },
      },
    },
  }))
}
