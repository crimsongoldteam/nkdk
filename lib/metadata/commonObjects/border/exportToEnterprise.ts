import { ConfigurationSettings } from "../../configurationSettings/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Border, BorderEnterprise } from "./types"

export const exportBorderToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: Border | undefined
): BorderEnterprise | undefined => {
  if (!data) return undefined

  return {
    Имя: data.ref,
    Ширина: data.width,
    ТипРамки: exportSystemEnumerationToEnterprise(configurationSettings, data.controlBorderType, SE.ControlBorderTypeToEnterprise),
  }
}
