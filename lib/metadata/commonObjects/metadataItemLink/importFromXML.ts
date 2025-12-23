import { Context } from "../../context/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

export function importMetadataItemLinkFromXML(
  _configurationSettings: Context,
  data: MetadataItemLinkXML | undefined
): MetadataItemLink | undefined {
  if (!data) return undefined

  return data["#text"]
}

export function importMetadataItemLinksFromXML(
  configurationSettings: Context,
  data: MetadataItemLinksXML | undefined
): MetadataItemLinks | undefined {
  if (!data) return undefined

  return data.map((value) => importMetadataItemLinkFromXML(configurationSettings, value)!)
}
