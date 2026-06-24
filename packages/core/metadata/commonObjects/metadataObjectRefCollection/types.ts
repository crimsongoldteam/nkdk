//#region MetadataObjectRefCollection

import { Static, Type } from "@sinclair/typebox"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"

export type MetadataObjectRefCollectionItem = string

export type MetadataObjectRefCollection = MetadataObjectRefCollectionItem[]

//#endregion

//#region MetadataObjectRefCollectionXML

export type MetadataObjectRefCollectionItemXML = string

export type MetadataObjectRefCollectionXML = {
  "xr:Item": MetadataPrimitiveValueXML | MetadataPrimitiveValueXML[]
}

//#endregion

//#region MetadataObjectRefCollectionYAML

export type MetadataObjectRefCollectionItemYAML = string

export const MetadataObjectRefCollectionJSONSchema = Type.Array(Type.String())
export type MetadataObjectRefCollectionYAML = Static<typeof MetadataObjectRefCollectionJSONSchema>

//#endregion
