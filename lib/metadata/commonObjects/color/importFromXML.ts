import { ConfigurationSettings } from "../../configurationSettings/types"
import { Color, ColorXML } from "./types"

export const importColorFromXML = (
  _configurationSettings: ConfigurationSettings,
  xml: ColorXML | undefined
): Color | undefined => {
  if (!xml) return undefined
  return xml
}
