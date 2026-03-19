import { Static, Type } from "@sinclair/typebox"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"

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
  "xr:DataPath": MetadataPrimitiveValueXML
  "xr:ValueChange"?: SE.LinkedValueChangeMode
}

export interface ChoiceParameterLinksXML {
  "xr:Link": ChoiceParameterLinkXML[]
}

//#endregion

//#region ChoiceParameterLinkYAML

export type ChoiceParameterLinkYAML = string

export const ChoiceParameterLinksJSONSchema = Type.String()
export type ChoiceParameterLinksYAML = Static<typeof ChoiceParameterLinksJSONSchema>

//#endregion
