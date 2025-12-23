import { ConfigurationSettings } from "../../configurationSettings/types"
import { Color, ColorXML } from "./types"

export const exportColorToXML = (
  _configurationSettings: ConfigurationSettings,
  color: Color | undefined
): ColorXML | undefined => {
  if (!color) return undefined
  return color
}
