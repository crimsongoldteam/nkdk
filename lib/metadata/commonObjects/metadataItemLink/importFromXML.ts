import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

export function importMetadataItemLinkFromXML(data: MetadataItemLinkXML | undefined): MetadataItemLink | undefined {
  if (!data) return undefined

  return data["#text"]
}

export function importMetadataItemLinksFromXML(data: MetadataItemLinksXML | undefined): MetadataItemLinks | undefined {
  if (!data) return undefined

  return data.map((value) => importMetadataItemLinkFromXML(value)!)
}
