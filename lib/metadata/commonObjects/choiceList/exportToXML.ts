import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { TChoiceList, TChoiceListXML } from "./types"

export const exportChoiceListToXML = (choiceList: TChoiceList | undefined): TChoiceListXML | undefined => {
  if (!choiceList) return undefined

  return {
    "xr:Item": choiceList.items.map((item) => ({
      "xr:Presentation": { "v8:item": [] },
      "xr:CheckState": item.checkState,
      "xr:Value": {
        "_xsi:type": "FormChoiceListDesTimeValue",
        Presentation: exportI8nTextToXML(item.presentation),
        Value: {
          "_xsi:type": "xs:string",
          "#text": item.value,
        },
      },
    })),
  }
}

