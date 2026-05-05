import { Static, Type } from "@sinclair/typebox"
import { MetadataField } from "../metadataField/types"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"

export interface TypeLinkXML {
  "xr:DataPath": string | MetadataPrimitiveValueXML
  "xr:LinkItem": number
}

export interface TypeLink {
  dataPath: MetadataField
  linkItem: number
}

//#region TypeLink DCS (dcscor)

/** Корень фрагмента для `xmlExport`: узел `dcscor:value` с типом TypeLink. */
export interface TypeLinkDcsValueRootXML {
  "dcscor:value": {
    "_xsi:type": "dcscor:TypeLink"
    "dcscor:field": string | { "#text"?: string }
    "dcscor:linkItem": number | string | { "#text"?: string }
  }
}

//#endregion

export const TypeLinkJSONSchema = Type.String()

export type TypeLinkYAML = Static<typeof TypeLinkJSONSchema>
