import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldStringToEnterprise } from "../metadataPath/exportToEnterprise"
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinks, MetadataItemLinksEnterprise } from "./types"

export const exportMetadataItemLinkToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLink | undefined
): MetadataItemLinkEnterprise | undefined => {
  if (!data) return undefined

  return exportMetadataFieldStringToEnterprise(context, undefined, data)
}

export const exportMetadataItemLinksToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinks | undefined
): MetadataItemLinksEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataItemLinkToEnterprise(_context, item)!)
}
