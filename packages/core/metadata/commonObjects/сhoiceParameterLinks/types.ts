import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataSimpleValueXML } from "../metadataValue/types"

//#region ChoiceParameterLink

export interface ChoiceParameterLink {
  name: string
  dataPath: string
  valueChange?: SE.LinkedValueChangeMode
}

export type ChoiceParameterLinks = ChoiceParameterLink[]
//#endregion

//#region ChoiceParameterLinkXML

export interface ChoiceParameterLinkXML {
  "xr:Name": string
  "xr:DataPath": MetadataSimpleValueXML
  "xr:ValueChange"?: SE.LinkedValueChangeMode
}

export interface ChoiceParameterLinksXML {
  "xr:Link": ChoiceParameterLinkXML[]
}

//#endregion

//#region ChoiceParameterLinkEnterprise

export type ChoiceParameterLinkEnterprise = string

export type ChoiceParameterLinksEnterprise = string

//#endregion
