import { ConfigurationContext } from "../../context/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

export function importMetadataItemLinkFromXML(
  _context: ConfigurationContext,
  data: MetadataItemLinkXML | undefined
): MetadataItemLink | undefined {
  if (!data) return undefined

  return data["#text"]
}

export function importMetadataItemLinksFromXML(
  context: ConfigurationContext,
  data: MetadataItemLinksXML | undefined
): MetadataItemLinks | undefined {
  if (!data) return undefined

  return data.map((value) => importMetadataItemLinkFromXML(context, value)!)
}
