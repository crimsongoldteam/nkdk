import { ConfigurationSettings } from "../../configurationSettings/types"
import { Font, FontEnterprise } from "./types"

export const exportFontToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  font: Font | undefined
): FontEnterprise | undefined => {
  if (!font) return undefined

  return "TODO"
}
