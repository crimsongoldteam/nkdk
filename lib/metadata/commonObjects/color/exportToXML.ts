import { ConfigurationSettings } from "../../configurationSettings/types"
import { Color, ColorXML } from "./types"

export const exportColorToXML = (
  color: Color | undefined,
  _configurationSettings: ConfigurationSettings
): ColorXML | undefined => {
  if (!color) return undefined
  return color
}
