import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Border, BorderEnterprise } from "./types"

export const exportBorderToEnterprise = (
  context: ConfigurationContext,
  data: Border | undefined
): BorderEnterprise | undefined => {
  if (!data) return undefined

  return {
    Имя: data.ref,
    Ширина: data.width,
    ТипРамки: exportSystemEnumerationToEnterprise(context, data.controlBorderType, SE.ControlBorderTypeToEnterprise),
  }
}
