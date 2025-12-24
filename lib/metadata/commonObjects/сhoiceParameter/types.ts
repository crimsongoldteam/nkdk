import { I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { MetadataFieldXML } from "../metadataField/types"

//#region ChoiceParameter

export interface ChoiceParameter {
  name: string
  dataPath: string
  valueChange?: SE.LinkedValueChangeMode
}

//#endregion

//#region ChoiceParameterValueXML

export interface ChoiceParameterSimpleValueXML {
  "_xsi:type": "xs:string" | "xs:boolean" | "xr:DesignTimeRef"
  "#text": string
}

export interface ChoiceParameterFixedArrayValueXML {
  "_xsi:type": "v8:FixedArray"
  "v8:Value": MetadataFieldXML | MetadataFieldXML[]
}

export interface ChoiceParameterFormChoiceListValueXML {
  "_xsi:type": "FormChoiceListDesTimeValue"
  Presentation?: I8nTextXML
  Value: MetadataFieldXML
}

export type ChoiceParameterLinkValueXML =
  | ChoiceParameterSimpleValueXML
  | ChoiceParameterFixedArrayValueXML
  | ChoiceParameterFormChoiceListValueXML

//#endregion

//#region ChoiceParameterEnterprise

export type ChoiceParameterLinksEnterprise = string

//#endregion
