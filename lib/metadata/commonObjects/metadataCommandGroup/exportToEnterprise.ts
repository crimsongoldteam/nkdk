import { Context } from "../../context/types"
import { MetadataCommandGroup, MetadataCommandGroupEnterprise } from "./types"

export const exportMetadataCommandGroupToEnterprise = (
  _configurationSettings: Context,
  data: MetadataCommandGroup | undefined
): MetadataCommandGroupEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
