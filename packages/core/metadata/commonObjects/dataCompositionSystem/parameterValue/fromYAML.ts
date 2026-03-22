import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../../context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { importDcsMetadataValueFromYAML } from "../dcsMetadataValue/fromYAML"
import { toDcsMetadataValueRule } from "./dcsValueRule"
import type {
  ParameterValue,
  ParameterValueYAML,
  SettingsParameterValue,
  SettingsParameterValuePropertyRule,
  SettingsParameterValueYAML,
} from "./types"

const isYamlObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x)

export const importParameterValueFromYAML = (
  context: ConfigurationContext,
  rule: SettingsParameterValuePropertyRule,
  yaml: ParameterValueYAML | SettingsParameterValueYAML
): ParameterValue | SettingsParameterValue => {
  const dcsRule = toDcsMetadataValueRule(rule)

  if (!isYamlObject(yaml)) {
    throw new Error("SettingsParameterValue YAML: expected object root")
  }

  const y = yaml as Record<string, unknown>

  const parameter = String(y["Параметр"] ?? "")

  const rawValue = y["Значение"]
  const rawList = rawValue === undefined ? [] : Array.isArray(rawValue) ? rawValue : [rawValue]
  const valueParts = rawList
    .map((v) => importDcsMetadataValueFromYAML(context, dcsRule, v as never))
    .filter((v): v is NonNullable<typeof v> => v !== undefined)

  const value: ParameterValue["value"] =
    valueParts.length === 0 ? undefined : valueParts.length === 1 ? valueParts[0] : valueParts

  const rawElements = y["Элементы"]
  const elementList =
    rawElements === undefined ? [] : Array.isArray(rawElements) ? rawElements : [rawElements]
  const item =
    elementList.length === 0
      ? undefined
      : elementList.map((el) => importParameterValueFromYAML(context, rule, el as ParameterValueYAML))

  const base: ParameterValue = {
    parameter,
    ...(y["Использовать"] === "Ложь" ? { use: false } : {}),
    ...(value !== undefined ? { value } : {}),
    ...(item !== undefined ? { item } : {}),
  }

  const hasSettingsYaml =
    y["РежимОтображения"] !== undefined ||
    y["ИдентификаторПользовательскойНастройки"] !== undefined ||
    y["ПредставлениеПользовательскойНастройки"] !== undefined

  if (hasSettingsYaml) {
    const viewKey = y["РежимОтображения"] as SE.DataCompositionSettingsItemViewModeYAML | undefined
    return {
      ...base,
      ...(viewKey !== undefined
        ? { viewMode: SE.DataCompositionSettingsItemViewModeFromYAML[viewKey] }
        : {}),
      ...(y["ИдентификаторПользовательскойНастройки"] !== undefined
        ? { userSettingID: String(y["ИдентификаторПользовательскойНастройки"]) }
        : {}),
      ...(y["ПредставлениеПользовательскойНастройки"] !== undefined
        ? {
            userSettingPresentation: importI8nTextFromYAML({
              context,
              rule: { type: "I8nText" },
              value: y["ПредставлениеПользовательскойНастройки"] as never,
            }),
          }
        : {}),
    } as SettingsParameterValue
  }

  return base
}

const importSettingsParameterValueFromYAMLForRule = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
) =>
  importParameterValueFromYAML(
    context,
    rule as unknown as SettingsParameterValuePropertyRule,
    value as SettingsParameterValueYAML
  )

registerTypeRule("SettingsParameterValue", "importFromYAML", importSettingsParameterValueFromYAMLForRule)
