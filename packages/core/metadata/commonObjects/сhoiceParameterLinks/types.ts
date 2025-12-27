import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataFieldXML } from "../metadataField/types"

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
  "xr:DataPath": MetadataFieldXML | string
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
