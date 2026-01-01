import { Context } from "../../context/types"
import { importMetadataFieldStringFromEnterprise } from "../metadataPath/importFromEnterprise"
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinks, MetadataItemLinksEnterprise } from "./types"

export const importMetadataItemLinkFromEnterprise = (
  context: Context,
  data: MetadataItemLinkEnterprise | undefined
): MetadataItemLink | undefined => {
  if (!data) return undefined

  return importMetadataFieldStringFromEnterprise(context, data)
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
