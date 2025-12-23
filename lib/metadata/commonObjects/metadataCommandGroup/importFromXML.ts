import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataCommandGroup, MetadataCommandGroupXML } from "./types"

export const importMetadataCommandGroupFromXML = (
  _configurationSettings: ConfigurationSettings,
  data: MetadataCommandGroupXML | undefined
): MetadataCommandGroup | undefined => {
  if (!data) return undefined

  return data["#text"]
}
