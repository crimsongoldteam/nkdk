import { ConfigurationSettings } from "../../configurationSettings/types"
import { StringboolXML } from "./types"

export const importBooleanFromXML = (
  _configurationSettings: ConfigurationSettings,
  xml: StringboolXML | undefined
): boolean | undefined => {
  if (xml === undefined) return undefined

  return xml === "true" ? true : xml === "false" ? false : xml
}
