import { Context } from "../../context/types"
import { AppliedType, AppliedTypeToEnterprise } from "../typeDescription/types"
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinks, MetadataItemLinksEnterprise } from "./types"

export const exportMetadataItemLinkToEnterprise = (
  _context: Context,
  data: MetadataItemLink | undefined
): MetadataItemLinkEnterprise | undefined => {
  if (!data) return undefined

  const [type, object] = data.split(".") as [AppliedType, string]

  return `${AppliedTypeToEnterprise[type]}.${object}`
}

export const exportMetadataItemLinksToEnterprise = (
  _context: Context,
  data: MetadataItemLinks | undefined
): MetadataItemLinksEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataItemLinkToEnterprise(_context, item)!)
}
