import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { importMetadataFieldStringFromEnterprise } from "../metadataPath/importFromEnterprise"
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinks, MetadataItemLinksEnterprise } from "./types"

export const importMetadataItemLinkFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataItemLinkEnterprise | undefined
): MetadataItemLink | undefined => {
  if (!data) return undefined

  return importMetadataFieldStringFromEnterprise(context, undefined, data)
}

export const importMetadataItemLinksFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataItemLinksEnterprise | undefined
): MetadataItemLinks | undefined => {
  if (!data) return undefined

  return data
    .map((item) => importMetadataItemLinkFromEnterprise(context, undefined, item)!)
    .filter((item): item is MetadataItemLink => item !== undefined)
}
