import { ConfigurationSettings } from "../../configurationSettings/types"
import { Color, ColorXML } from "./types"

export const importColorFromXML = (
  xml: ColorXML | undefined,
  _configurationSettings: ConfigurationSettings
): Color | undefined => {
  if (!xml) return undefined
  return xml
}
