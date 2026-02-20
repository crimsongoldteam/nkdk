import { MetadataValue, MetadataValueXML, MetadataValueYAML } from "../metadataValue/types"

//#region ChoiceParameter

export interface ChoiceParameter {
  name: string
  value?: MetadataValue
}

export type ChoiceParameters = ChoiceParameter[]

//#endregion

//#region ChoiceParameterXML

export interface ChoiceParameterXML {
  _name: string
  "app:value": MetadataValueXML
}

export interface ChoiceParametersXML {
  "app:item": ChoiceParameterXML | ChoiceParameterXML[]
}

//#endregion

//#region ChoiceParametersYAML

export type ChoiceParameterYAML = string

export type ChoiceParametersYAML = Record<string, MetadataValueYAML | undefined>

//#endregion
