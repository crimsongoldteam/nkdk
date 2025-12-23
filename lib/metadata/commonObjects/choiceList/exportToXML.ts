import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { ConfigurationSettings } from "../../configurationSettings/types"
import { ChoiceList, ChoiceListXML } from "./types"

export const exportChoiceListToXML = (
  configurationSettings: ConfigurationSettings,
  choiceList: ChoiceList | undefined
): ChoiceListXML | undefined => {
  if (!choiceList) return undefined

  return choiceList.items.map((item) => ({
    "xr:Item": {
      "xr:Presentation": undefined,
      "xr:CheckState": item.checkState,
      "xr:Value": {
        "_xsi:type": "FormChoiceListDesTimeValue",
        Presentation: exportI8nTextToXML(configurationSettings, item.presentation),
        Value: {
          "_xsi:type": "xs:string",
          "#text": item.value,
        },
      },
    },
  }))
}
