import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAML } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Border, BorderEnterprise } from "./types"

export const exportBorderToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: Border | undefined
): BorderEnterprise | undefined => {
  if (!data) return undefined

  return {
    Имя: data.ref,
    Ширина: data.width,
    ТипРамки: exportSystemEnumerationToYAML<SE.ControlBorderTypeEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "ControlBorderType" },
      data.controlBorderType
    ),
  }
}

registerTypeRule("Border", "exportToEnterprise", exportBorderToEnterprise)
