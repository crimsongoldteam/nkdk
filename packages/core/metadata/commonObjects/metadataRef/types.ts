export type MetadataItemLink = string

export interface MetadataItemLinkXML {
  "xsi:type": "xr:MDObjectRef"
  "#text": string
}

export type MetadataItemLinkYAML = string

export type MetadataItemLinks = MetadataItemLink[]
export type MetadataItemLinksXML = MetadataItemLinkXML[]
export type MetadataItemLinksYAML = MetadataItemLinkYAML[]
