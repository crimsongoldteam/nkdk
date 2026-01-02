import {
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueEnterprise,
  MetadataFormChoiceListValueXML,
} from "../metadataValue/types"

//#region ChoiceList
export type ChoiceList = MetadataFormChoiceListValue[]

//#endregion

//#region ChoiceListXML

export interface ChoiceListItemXML {
  "xr:Presentation": ""
  "xr:CheckState": 0
  "xr:Value": MetadataFormChoiceListValueXML
}

export interface ChoiceListXML {
  "xr:Item": ChoiceListItemXML | ChoiceListItemXML[]
}

//#endregion

//#region ChoiceListEnterprise

export type ChoiceListEnterprise = MetadataFormChoiceListValueEnterprise[]

//#endregion
