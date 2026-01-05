import { ConfigurationContext } from "../../context/types"
import { MetadataCommandGroup, MetadataCommandGroupXML } from "./types"

export const importMetadataCommandGroupFromXML = (
  _context: ConfigurationContext,
  data: MetadataCommandGroupXML | undefined
): MetadataCommandGroup | undefined => {
  if (!data) return undefined

  return data["#text"]
}
