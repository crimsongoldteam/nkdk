import { ConfigurationContext } from "../../context/types"
import { MetadataCommandGroup, MetadataCommandGroupEnterprise } from "./types"

export const exportMetadataCommandGroupToEnterprise = (
  _context: ConfigurationContext,
  data: MetadataCommandGroup | undefined
): MetadataCommandGroupEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
