import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldStringToEnterprise } from "../metadataPath/exportToEnterprise"
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinks, MetadataItemLinksEnterprise } from "./types"

export const exportMetadataItemLinkToEnterprise = (
  context: ConfigurationContext,
  data: MetadataItemLink | undefined
): MetadataItemLinkEnterprise | undefined => {
  if (!data) return undefined

  return exportMetadataFieldStringToEnterprise(context, data)
}

export const exportMetadataItemLinksToEnterprise = (
  _context: ConfigurationContext,
  data: MetadataItemLinks | undefined
): MetadataItemLinksEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataItemLinkToEnterprise(_context, item)!)
}
