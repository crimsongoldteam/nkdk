import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { MetadataCommandGroup, MetadataCommandGroupXML } from "./types"

export const importMetadataCommandGroupFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataCommandGroupXML | undefined
): MetadataCommandGroup | undefined => {
  if (!data) return undefined

  return data["#text"]
}
