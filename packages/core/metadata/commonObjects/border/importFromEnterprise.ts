import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { importSystemEnumerationFromYAML } from "../../systemEnumerations/fromYAML"
import * as SE from "../../systemEnumerations/types"
import { Border, BorderYAML } from "./types"

export const importBorderFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: BorderYAML | undefined
): Border | undefined => {
  if (!data) return undefined

  const result: Border = {}

  if (data.Имя !== undefined) {
    result.ref = data.Имя
  }

  if (data.Ширина !== undefined) {
    result.width = data.Ширина
  }

  const controlBorderType = importSystemEnumerationFromYAML<SE.ControlBorderType>(
    context,
    { type: "SystemEnumeration", typeSE: "ControlBorderType" },
    data.ТипРамки
  )
  if (controlBorderType !== undefined) {
    result.controlBorderType = controlBorderType
  }

  return Object.keys(result).length > 0 ? result : undefined
}

registerTypeRule("Border", "importFromYAML", importBorderFromYAML)
