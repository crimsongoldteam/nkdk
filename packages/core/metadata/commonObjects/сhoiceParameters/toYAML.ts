import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportFormChoiceListToYAML } from "../metadataValue/formChoiceList/toYAML"
import { exportMetadataValueToYAML } from "../metadataValue/toYAML"
import type { ChoiceParameter, ChoiceParameters, ChoiceParametersYAML } from "./types"

const exportChoiceParameterValueToYAML = (
  context: ConfigurationContext,
  param: ChoiceParameter
): ChoiceParametersYAML[string] => {
  if (param.value?.type === "formChoiceListDesTimeValue") {
    return {
      Тип: "ЗначениеСпискаВыбора",
      ...exportFormChoiceListToYAML(context, param.value),
    }
  }

  return exportMetadataValueToYAML(context, undefined, param.value)
}

export const exportChoiceParametersToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ChoiceParameters | undefined
): ChoiceParametersYAML | undefined => {
  if (!data) return undefined

  return Object.fromEntries(data.map((param) => [param.name, exportChoiceParameterValueToYAML(context, param)]))
}

registerTypeRule("ChoiceParameters", "exportToYAML", exportChoiceParametersToYAML)
