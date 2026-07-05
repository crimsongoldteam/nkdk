import { Type } from "@sinclairtypebox"
import type { Static } from "@sinclairtypebox"

export type MetadataItemLink = string

export type MetadataItemLinkXML =
  | string
  | {
      "_xsi:type"?: "xr:MDObjectRef"
      "#text": string
    }

export type MetadataItemLinkYAML = string
export const MetadataItemLinkJSONSchema = Type.String()

export type MetadataItemLinks = MetadataItemLink[]
export interface MetadataItemLinksXML {
  "xr:Item"?: MetadataItemLinkXML | MetadataItemLinkXML[]
  "xr:Object"?: MetadataItemLinkXML | MetadataItemLinkXML[]
}
export const MetadataItemLinksJSONSchema = Type.Array(Type.String())
export type MetadataItemLinksYAML = Static<typeof MetadataItemLinksJSONSchema>
