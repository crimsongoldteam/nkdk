import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldStringToEnterprise } from "../metadataPath/exportToEnterprise"
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinks, MetadataItemLinksEnterprise } from "./types"

export const exportMetadataItemLinkToEnterprise = (
  context: ConfigurationContext,
  rule: PropertyRule<any> | undefined,
  data: MetadataItemLink | undefined
): MetadataItemLinkEnterprise | undefined => {
  if (!data) return undefined

  return exportMetadataFieldStringToEnterprise(context, rule, data)
}

export const exportMetadataItemLinksToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataItemLinks | undefined
): MetadataItemLinksEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataItemLinkToEnterprise(_context, undefined, item)!)
}
