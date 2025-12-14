import { I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"

export interface ChoiceParameterLinkDataPathObject {
  "#text"?: string
  "_xsi:type"?: string
}

export type ChoiceParameterLinkDataPath = string | ChoiceParameterLinkDataPathObject

export interface ChoiceParameterLinkXML {
  "xr:Name": string
  "xr:DataPath": ChoiceParameterLinkDataPath
  "xr:ValueChange"?: string
}

export interface ChoiceParameterLinkValue {
  "_xsi:type"?: string
  Presentation?: I8nTextXML
  Value: {
    "_xsi:type": "xs:string" | "xs:boolean"
    "#text": string | boolean
  }
}

export interface ChoiceParameterAppItemXML {
  _name: string
  "app:value": ChoiceParameterLinkValue
}

export interface ChoiceParameterLink {
  name: string
  dataPath: string
  valueChange?: string
}

export interface ChoiceParameterLinksXMLItem {
  "xr:Link": ChoiceParameterLinkXML | ChoiceParameterLinkXML[]
}

export interface ChoiceParameterLinksXMLAppItem {
  "app:item": ChoiceParameterAppItemXML | ChoiceParameterAppItemXML[]
}

export type ChoiceParameterLinksXML =
  | ChoiceParameterLinksXMLItem[]
  | ChoiceParameterLinksXMLAppItem
  | ChoiceParameterLinksXMLAppItem[]

export type ChoiceParameterLinks = ChoiceParameterLink[] | undefined

export type ChoiceParameterLinksEnterprise = string
