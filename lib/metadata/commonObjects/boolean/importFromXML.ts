import { ConfigurationSettings } from "../../configurationSettings/types"
import { StringboolXML } from "./types"

export const importBooleanFromXML = (
  xml: StringboolXML | undefined,
  _configurationSettings: ConfigurationSettings
): boolean | undefined => {
  if (!xml) return undefined

  return xml === "true" ? true : xml === "false" ? false : xml
}
