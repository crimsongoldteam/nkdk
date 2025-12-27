import { MetadataField } from "../metadataField/types"

export interface TypeLinkXML {
  "xr:DataPath": string
  "xr:LinkItem": number
}

export interface TypeLink {
  dataPath: MetadataField
  linkItem: number
}

export type TypeLinkEnterprise = string
