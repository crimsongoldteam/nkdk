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

//#region MetadataValueCollectionEnterprise

export type MetadataValueCollectionItemEnterprise = string

export type MetadataValueCollectionEnterprise = MetadataValueCollectionItemEnterprise[]

//#endregion
