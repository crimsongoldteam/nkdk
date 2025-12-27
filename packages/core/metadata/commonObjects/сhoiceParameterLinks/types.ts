import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataField, MetadataFieldXML } from "../metadataField/types"

export interface ChoiceParameterLinkXML {
  "xr:Name": string
  "xr:DataPath": MetadataField
  "xr:ValueChange"?: SE.LinkedValueChangeMode
}

export interface ChoiceParameterLinkValueXML {
  "_xsi:type"?: string
  Presentation?: I8nTextXML
  Value: MetadataFieldXML
}

export interface ChoiceParameterAppItemXML {
  _name: string
  "app:value": ChoiceParameterLinkValueXML
}

export interface ChoiceParameterLink {
  name: string
  dataPath: string
  valueChange?: SE.LinkedValueChangeMode
}

export interface ChoiceParameterLinksXMLItem {
  "xr:Link": ChoiceParameterLinkXML[]
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
