import { I8nText, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"

export interface ChoiceListItemValueXML {
  "_xsi:type": "FormChoiceListDesTimeValue"
  Presentation?: I8nTextXML
  Value: {
    "_xsi:type": "xs:string" | "xs:boolean"
    "#text": string | boolean
  }
}

export interface ChoiceListLineItemXML {
  "xr:Presentation"?: I8nTextXML
  "xr:CheckState": number
  "xr:Value": ChoiceListItemValueXML
}

export interface ChoiceListItemXML {
  "xr:Item": ChoiceListLineItemXML
}

export type ChoiceListXML = ChoiceListItemXML[]

export interface ChoiceListItem {
  presentation?: I8nText
  checkState: number
  value: string
}

export interface ChoiceList {
  items: ChoiceListItem[]
}

export type ChoiceListEnterprise = string
