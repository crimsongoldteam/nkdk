import { MetadataValue, MetadataValueEnterprise, MetadataValueXML } from "../metadataValue/types"

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

//#region ChoiceParametersEnterprise

export type ChoiceParameterEnterprise = string

export type ChoiceParametersEnterprise = Record<string, MetadataValueEnterprise | undefined>

//#endregion
