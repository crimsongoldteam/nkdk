import { ConfigurationSettings } from "../../configurationSettings/types"
import { AppliedType, AppliedTypeToEnterprise } from "../typeDescription/types"
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinks, MetadataItemLinksEnterprise } from "./types"

export const exportMetadataItemLinkToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: MetadataItemLink | undefined
): MetadataItemLinkEnterprise | undefined => {
  if (!data) return undefined

  const [type, object] = data.split(".") as [AppliedType, string]

  return `${AppliedTypeToEnterprise[type]}.${object}`
}

export const exportMetadataItemLinksToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: MetadataItemLinks | undefined
): MetadataItemLinksEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataItemLinkToEnterprise(_configurationSettings, item)!)
}
