import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataCommandGroup, MetadataCommandGroupEnterprise } from "./types"

export const exportMetadataCommandGroupToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: MetadataCommandGroup | undefined
): MetadataCommandGroupEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
