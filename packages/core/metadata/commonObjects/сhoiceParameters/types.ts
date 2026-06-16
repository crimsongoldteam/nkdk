import { Static, Type } from "@sinclair/typebox"
import { MetadataValue, MetadataValueJSONSchema, MetadataValueXML } from "../metadataValue/types"

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
  "app:value"?: MetadataValueXML<{ type: "MetadataValue" }, MetadataValue>
}

export interface ChoiceParametersXML {
  "app:item": ChoiceParameterXML | ChoiceParameterXML[]
}

//#endregion

//#region ChoiceParameter DCS (dcscor)

/** Один `dcscor:item` внутри `dcscor:value xsi:type="dcscor:ChoiceParameters"`. */
export interface ChoiceParameterDcsItemXML {
  "dcscor:choiceParameter": string | { "#text"?: string }
  /** Сериализованное значение метаданных (`exportMetadataValueToXML`). */
  "dcscor:value"?: unknown
}

/** Корень фрагмента для `xmlExport`: узел `dcscor:value` с типом ChoiceParameters. */
export interface ChoiceParameterDcsValueRootXML {
  "dcscor:value": {
    "_xsi:type": "dcscor:ChoiceParameters"
    "dcscor:item": ChoiceParameterDcsItemXML | ChoiceParameterDcsItemXML[]
  }
}

//#endregion

//#region ChoiceParametersYAML

export const ChoiceParametersJSONSchema = Type.Record(
  Type.String(),
  Type.Union([MetadataValueJSONSchema, Type.Undefined(), Type.Null()])
)

export type ChoiceParametersYAML = Static<typeof ChoiceParametersJSONSchema>

//#endregion
