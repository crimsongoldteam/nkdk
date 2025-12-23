import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

export function importMetadataItemLinkFromXML(
  _configurationSettings: ConfigurationSettings,
  data: MetadataItemLinkXML | undefined
): MetadataItemLink | undefined {
  if (!data) return undefined

  return data["#text"]
}

export function importMetadataItemLinksFromXML(
  configurationSettings: ConfigurationSettings,
  data: MetadataItemLinksXML | undefined
): MetadataItemLinks | undefined {
  if (!data) return undefined

  return data.map((value) => importMetadataItemLinkFromXML(configurationSettings, value)!)
}
