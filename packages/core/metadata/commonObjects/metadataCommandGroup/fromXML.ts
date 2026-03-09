import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { ConfigurationContext } from "../../context/types"
import { MetadataCommandGroup, MetadataCommandGroupXML } from "./types"

export const importMetadataCommandGroupFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataCommandGroupXML | string | undefined
): MetadataCommandGroup | undefined => {
  if (data === undefined) return undefined

  if (typeof data === "string") return data

  return data["#text"]
}

registerTypeRule("MetadataCommandGroup", "importFromXML", importMetadataCommandGroupFromXML)
