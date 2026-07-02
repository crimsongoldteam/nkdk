import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { asExplicitYAMLStringIfMarked } from "~/yaml/explicitString"
import { ConfigurationContext } from "../../context/types"
import { importFormChoiceListFromYAML } from "../metadataValue/formChoiceList/fromYAML"
import { importMetadataValueFromYAML } from "../metadataValue/fromYAML"
import type { MetadataExplicitFormChoiceListValueYAML, MetadataFormChoiceListValueYAML } from "../metadataValue/types"
import type { ChoiceParameter, ChoiceParameters, ChoiceParametersYAML } from "./types"

const isExplicitFormChoiceListValueYAML = (value: unknown): value is MetadataExplicitFormChoiceListValueYAML =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  (value as Record<string, unknown>).Тип === "ЗначениеСпискаВыбора"

const importChoiceParameterValueFromYAML = (
  context: ConfigurationContext,
  value: Exclude<ChoiceParametersYAML[string], null | undefined>
): ChoiceParameter["value"] => {
  if (isExplicitFormChoiceListValueYAML(value)) {
    const { Тип: _type, ...formChoiceListValue } = value
    return importFormChoiceListFromYAML(context, formChoiceListValue as MetadataFormChoiceListValueYAML)
  }

  return importMetadataValueFromYAML(context, undefined, value)
}

export const importChoiceParametersFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ChoiceParametersYAML | undefined
): ChoiceParameters | undefined => {
  if (!data) return undefined

  return Object.entries(data).map(([name, yamlValue]) => {
    const markedValue =
      yamlValue === null || isEmptyObject(yamlValue)
        ? undefined
        : asExplicitYAMLStringIfMarked(data, name, yamlValue)
    const value =
      markedValue === undefined
        ? undefined
        : importChoiceParameterValueFromYAML(
            context,
            markedValue as Exclude<ChoiceParametersYAML[string], null | undefined>
          )
    const result: ChoiceParameter = { name }

    if (value !== undefined) result.value = value

    return result
  })
}

function isEmptyObject(value: unknown): value is Record<string, never> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0
}

registerTypeRule("ChoiceParameters", "importFromYAML", importChoiceParametersFromYAML)
