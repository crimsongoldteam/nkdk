import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Border, BorderEnterprise } from "./types"

export const exportBorderToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: Border | undefined
): BorderEnterprise | undefined => {
  if (!data) return undefined

  return {
    Имя: data.ref,
    Ширина: data.width,
    ТипРамки: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.controlBorderType,
      SE.ControlBorderTypeToEnterprise
    ),
  }
}

registerTypeRule("Border", "exportToEnterprise", exportBorderToEnterprise)
