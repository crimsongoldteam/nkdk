import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { MetadataCommandGroup, MetadataCommandGroupYAML } from "./types"

export const exportMetadataCommandGroupToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataCommandGroup | undefined
): MetadataCommandGroupYAML | undefined => {
  if (!data) return undefined

  return "TODO"
}
