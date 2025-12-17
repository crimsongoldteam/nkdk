import { ConfigurationSettings } from "../../configurationSettings/types"
import { Font, FontEnterprise } from "./types"

export const exportFontToEnterprise = (
  font: Font | undefined,
  _configurationSettings: ConfigurationSettings
): FontEnterprise | undefined => {
  if (!font) return undefined

  return "TODO"
}
