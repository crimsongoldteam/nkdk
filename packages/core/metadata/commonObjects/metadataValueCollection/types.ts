//#region MetadataValueCollection

import { MetadataSimpleValueXML } from "../metadataValue/types"

export type MetadataValueCollectionItem = string

export type MetadataValueCollection = MetadataValueCollectionItem[]

//#endregion

//#region MetadataValueCollectionXML

export type MetadataValueCollectionItemXML = string

export type MetadataValueCollectionXML = {
  "xr:Item": MetadataSimpleValueXML | MetadataSimpleValueXML[]
}

//#endregion

//#region MetadataValueCollectionYAML

export type MetadataValueCollectionItemYAML = string

export type MetadataValueCollectionYAML = MetadataValueCollectionItemYAML[]

//#endregion
