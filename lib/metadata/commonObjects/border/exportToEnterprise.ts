import { ConfigurationSettings } from "../../configurationSettings/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Border, BorderEnterprise } from "./types"

export const exportBorderToEnterprise = (
  data: Border | undefined,
  configurationSettings: ConfigurationSettings
): BorderEnterprise | undefined => {
  if (!data) return undefined

  return {
    Имя: data.ref,
    Ширина: data.width,
    ТипРамки: exportSystemEnumerationToEnterprise(
      data.controlBorderType,
      SE.ControlBorderTypeToEnterprise,
      configurationSettings
    ),
  }
}
