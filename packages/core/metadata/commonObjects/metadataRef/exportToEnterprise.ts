import { Context } from "../../context/types"
import { exportMetadataFieldStringToEnterprise } from "../metadataPath/exportToEnterprise"
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinks, MetadataItemLinksEnterprise } from "./types"

export const exportMetadataItemLinkToEnterprise = (
  context: Context,
  data: MetadataItemLink | undefined
): MetadataItemLinkEnterprise | undefined => {
  if (!data) return undefined

  return exportMetadataFieldStringToEnterprise(context, data)
}

export const exportMetadataItemLinksToEnterprise = (
  _context: Context,
  data: MetadataItemLinks | undefined
): MetadataItemLinksEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataItemLinkToEnterprise(_context, item)!)
}
