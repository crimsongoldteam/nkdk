import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAML } from "../../systemEnumerations/toYAML"
import * as SE from "../../systemEnumerations/types"
import { Border, BorderYAML } from "./types"

export const exportBorderToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: Border | undefined
): BorderYAML | undefined => {
  if (!data) return undefined

  const result: BorderYAML = {
    Имя: data.ref,
    Ширина: data.width,
  }

  const borderType = exportSystemEnumerationToYAML<SE.ControlBorderTypeYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "ControlBorderType" },
    data.controlBorderType
  )
  if (borderType !== undefined) {
    result.ТипРамки = borderType
  }

  return result
}

registerTypeRule("Border", "exportToYAML", exportBorderToYAML)
