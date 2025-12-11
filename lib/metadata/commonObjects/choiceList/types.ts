import { I8nText, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"

export interface ChoiceListItemValueXML {
  "_xsi:type": "FormChoiceListDesTimeValue"
  Presentation?: I8nTextXML
  Value: {
    "_xsi:type": "xs:string" | "xs:boolean"
    "#text": string | boolean
  }
}

export interface ChoiceListItemXML {
  "xr:Presentation"?: I8nTextXML
  "xr:CheckState": number
  "xr:Value": ChoiceListItemValueXML
}

export interface ChoiceListXMLItem {
  "xr:Item": ChoiceListItemXML
}

export type ChoiceListXML = ChoiceListXMLItem[]

export interface ChoiceListItem {
  presentation?: I8nText
  checkState: number
  value: string
}

export interface ChoiceList {
  items: ChoiceListItem[]
}
