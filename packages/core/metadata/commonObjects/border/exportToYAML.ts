import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAML } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Border, BorderEnterprise } from "./types"

export const exportBorderToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  data: Border | undefined
): BorderEnterprise | undefined => {
  if (!data) return undefined

  return {
    Имя: data.ref,
    Ширина: data.width,
    ТипРамки: exportSystemEnumerationToYAML(_context, data.controlBorderType, SE.ControlBorderTypeToEnterprise),
  }
}
