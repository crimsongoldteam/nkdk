import { Context } from "../../context/types"
import { MetadataTypeFromEnterprise } from "../metadataPath/types"
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinks, MetadataItemLinksEnterprise } from "./types"

export const importMetadataItemLinkFromEnterprise = (
  _context: Context,
  data: MetadataItemLinkEnterprise | undefined
): MetadataItemLink | undefined => {
  if (!data) return undefined

  const [type, object] = data.split(".") as [string, string]

  const xmlType = MetadataTypeFromEnterprise[type as keyof typeof MetadataTypeFromEnterprise]
  if (!xmlType) return undefined

  return `${xmlType}.${object}` as MetadataItemLink
}

export const importMetadataItemLinksFromEnterprise = (
  context: Context,
  data: MetadataItemLinksEnterprise | undefined
): MetadataItemLinks | undefined => {
  if (!data) return undefined

  return data
    .map((item) => importMetadataItemLinkFromEnterprise(context, item)!)
    .filter((item): item is MetadataItemLink => item !== undefined)
}
