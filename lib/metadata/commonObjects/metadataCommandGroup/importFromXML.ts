import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataCommandGroup, MetadataCommandGroupXML } from "./types"

export const importMetadataCommandGroupFromXML = (
  data: MetadataCommandGroupXML | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataCommandGroup | undefined => {
  if (!data) return undefined

  return data["#text"]
}
