import { MetadataField } from "../metadataField/types"
import { MetadataValueXML } from "../metadataValue/types"

export interface TypeLinkXML {
  "xr:DataPath": string | MetadataValueXML
  "xr:LinkItem": number
}

export interface TypeLink {
  dataPath: MetadataField
  linkItem: number
}

export type TypeLinkEnterprise = string
