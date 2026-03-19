//#region MetadataValueCollection

import { Static, Type } from "@sinclair/typebox"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"

export type MetadataValueCollectionItem = string

export type MetadataValueCollection = MetadataValueCollectionItem[]

//#endregion

//#region MetadataValueCollectionXML

export type MetadataValueCollectionItemXML = string

export type MetadataValueCollectionXML = {
  "xr:Item": MetadataPrimitiveValueXML | MetadataPrimitiveValueXML[]
}

//#endregion

//#region MetadataValueCollectionYAML

export type MetadataValueCollectionItemYAML = string

export const MetadataValueCollectionJSONSchema = Type.Array(Type.String())
export type MetadataValueCollectionYAML = Static<typeof MetadataValueCollectionJSONSchema>

//#endregion
