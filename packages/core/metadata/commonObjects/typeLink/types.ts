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

export const TypeLinkJSONSchema = Type.String()

export type TypeLinkYAML = Static<typeof TypeLinkJSONSchema>
