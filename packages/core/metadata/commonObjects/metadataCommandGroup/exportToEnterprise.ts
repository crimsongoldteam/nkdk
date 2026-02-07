import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { MetadataCommandGroup, MetadataCommandGroupEnterprise } from "./types"

export const exportMetadataCommandGroupToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataCommandGroup | undefined
): MetadataCommandGroupEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
