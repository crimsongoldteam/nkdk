import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { importSystemEnumerationFromEnterprise } from "../../systemEnumerations/importFromEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Border, BorderEnterprise } from "./types"

export const importBorderFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: BorderEnterprise | undefined
): Border | undefined => {
  if (!data) return undefined

  const result: Border = {}

  if (data.Имя !== undefined) {
    result.ref = data.Имя
  }

  if (data.Ширина !== undefined) {
    result.width = data.Ширина
  }

  const controlBorderType = importSystemEnumerationFromEnterprise<SE.ControlBorderType>(
    context,
    undefined,
    data.ТипРамки,
    SE.ControlBorderTypeFromEnterprise
  )
  if (controlBorderType !== undefined) {
    result.controlBorderType = controlBorderType
  }

  return Object.keys(result).length > 0 ? result : undefined
}

registerTypeRule("Border", "importFromEnterprise", importBorderFromEnterprise)
