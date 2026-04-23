import { Static, Type } from "@sinclair/typebox"

export type MetadataItemLink = string

export interface MetadataItemLinkXML {
  "_xsi:type": "xr:MDObjectRef"
  "#text": string
}

export type MetadataItemLinkYAML = string

export type MetadataItemLinks = MetadataItemLink[]
export interface MetadataItemLinksXML {
  "xr:Item"?: MetadataItemLinkXML | MetadataItemLinkXML[]
}
export const MetadataItemLinksJSONSchema = Type.Array(Type.String())
export type MetadataItemLinksYAML = Static<typeof MetadataItemLinksJSONSchema>
