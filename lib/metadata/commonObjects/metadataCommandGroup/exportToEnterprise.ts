import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataCommandGroup, MetadataCommandGroupEnterprise } from "./types"

export const exportMetadataCommandGroupToEnterprise = (
  data: MetadataCommandGroup | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataCommandGroupEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
