import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

export function importMetadataItemLinkFromXML(
  data: MetadataItemLinkXML | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataItemLink | undefined {
  if (!data) return undefined

  return data["#text"]
}

export function importMetadataItemLinksFromXML(
  data: MetadataItemLinksXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataItemLinks | undefined {
  if (!data) return undefined

  return data.map((value) => importMetadataItemLinkFromXML(value, configurationSettings)!)
}
