import { ConfigurationSettings } from "../../configurationSettings/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Color } from "./types"

export const exportColorToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  color: Color | undefined
): string | undefined => {
  if (!color) return undefined

  return exportSystemEnumerationToEnterprise(_configurationSettings, color, SE.ColorTypeToEnterprise)
}
