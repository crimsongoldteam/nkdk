import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinks, MetadataItemLinksEnterprise } from "./types"

export const exportMetadataItemLinkToEnterprise = (
  data: MetadataItemLink | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataItemLinkEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}

export const exportMetadataItemLinksToEnterprise = (
  data: MetadataItemLinks | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataItemLinksEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataItemLinkToEnterprise(item, _configurationSettings)!)
}
