import { ConfigurationSettings } from "../../configurationSettings/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Color } from "./types"

export const exportColorToEnterprise = (
  color: Color | undefined,
  _configurationSettings: ConfigurationSettings
): string | undefined => {
  if (!color) return undefined

  return exportSystemEnumerationToEnterprise(color, SE.ColorTypeToEnterprise, _configurationSettings)
}
