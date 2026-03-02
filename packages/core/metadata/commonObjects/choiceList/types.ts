import { Type } from "@sinclair/typebox"
import {
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataFormChoiceListValueYAML,
  MetadataValueJSONSchema,
} from "../metadataValue/types"

//#region ChoiceList
export type ChoiceList = MetadataFormChoiceListValue[]

//#endregion

//#region ChoiceListXML

export interface ChoiceListItemXML {
  // "xr:Presentation": ""
  "xr:CheckState": 0
  "xr:Value": MetadataFormChoiceListValueXML
}

export interface ChoiceListXML {
  "xr:Item": ChoiceListItemXML | ChoiceListItemXML[]
}

//#endregion

//#region ChoiceListYAML

export const ChoiceListJSONSchema = Type.Array(
  MetadataFormChoiceListValueJSONSchema)
)
export type ChoiceListYAML = MetadataFormChoiceListValueYAML[]

//#endregion
