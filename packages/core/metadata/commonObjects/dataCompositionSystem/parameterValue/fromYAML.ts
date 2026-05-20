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

/** Поля развёрнутого SPV — не имя параметра снаружи. */
const PARAMETER_VALUE_YAML_INTERNAL_KEYS = new Set([
  "Использовать",
  "Значение",
  "Элементы",
  "РежимОтображения",
  "ИдентификаторПользовательскойНастройки",
  "ПредставлениеПользовательскойНастройки",
])

/** Поля объектного Font YAML. Для Font-значения они не являются wrapper-именем параметра. */
const FONT_YAML_OBJECT_VALUE_KEYS = new Set([
  "Вид",
  "ВидXML",
  "Имя",
  "Масштаб",
  "Размер",
  "Наклонный",
  "Подчеркивание",
  "Полужирный",
  "Зачеркивание",
])

/**
 * Обёртка вида { ИмяПараметра: внутреннийYAML } (как в exportPropertyToYAML).
 * Ключ «Параметр» не разворачиваем: это ChoiceParameters, а не имя SPV.
 */
const tryUnwrapParameterValueWrapper = (
  rule: SettingsParameterValuePropertyRule,
  yaml: unknown
): { parameter: string; inner: unknown } | undefined => {
  if (!isYamlObject(yaml)) return undefined
  const keys = Object.keys(yaml)
  if (keys.length !== 1) return undefined
  const k = keys[0]!
  if (PARAMETER_VALUE_YAML_INTERNAL_KEYS.has(k)) return undefined
  if (rule.valueType === "Font" && FONT_YAML_OBJECT_VALUE_KEYS.has(k)) return undefined
  if (k === "Параметр") return undefined
  return { parameter: k, inner: yaml[k] }
}

export const importParameterValueFromYAML = (
  context: ConfigurationContext,
  rule: SettingsParameterValuePropertyRule,
  yaml: ParameterValueYAML | SettingsParameterValueYAML
): ParameterValue | SettingsParameterValue | undefined => {
  if (yaml === undefined || yaml === null) {
    return undefined
  }

  const dcsRule = toDcsMetadataValueRule(rule)

  const unwrapped = tryUnwrapParameterValueWrapper(rule, yaml)
  const yamlToParse = unwrapped !== undefined ? unwrapped.inner : yaml
  const parameterFromWrapper = unwrapped?.parameter

  const y = isYamlObject(yamlToParse) ? (yamlToParse as Record<string, unknown>) : undefined
  const parameterFromRule = typeof rule.yaml === "string" ? rule.yaml : undefined
  const isExpandedSpvShape =
    y !== undefined &&
    ("Значение" in y ||
      "Использовать" in y ||
      "Элементы" in y ||
      y["РежимОтображения"] !== undefined ||
      y["ИдентификаторПользовательскойНастройки"] !== undefined ||
      y["ПредставлениеПользовательскойНастройки"] !== undefined)
  const parameterFromExpandedField =
    isExpandedSpvShape && typeof y?.["Параметр"] === "string" ? String(y["Параметр"]) : undefined
  const parameter = String(
    parameterFromWrapper ?? parameterFromExpandedField ?? parameterFromRule ?? ""
  )
  const rawValue = y?.["Значение"] ?? yamlToParse
  const rawList = rawValue === undefined ? [] : Array.isArray(rawValue) ? rawValue : [rawValue]
  const valueParts = rawList
    .map((v) => importDcsMetadataValueFromYAML(context, dcsRule, v as never))
    .filter((v): v is NonNullable<typeof v> => v !== undefined)

  const value: ParameterValue["value"] =
    valueParts.length === 0 ? undefined : valueParts.length === 1 ? valueParts[0] : valueParts

  const rawElements = y?.["Элементы"]
  const elementList =
    rawElements === undefined ? [] : Array.isArray(rawElements) ? rawElements : [rawElements]
  const item =
    elementList.length === 0
      ? undefined
      : (elementList
          .map((el) => importParameterValueFromYAML(context, rule, el as ParameterValueYAML))
          .filter((el): el is ParameterValue | SettingsParameterValue => el !== undefined) as (
          | ParameterValue
          | SettingsParameterValue
        )[])

  const base: ParameterValue = {
    parameter,
    ...(y?.["Использовать"] === "Ложь" ? { use: false } : {}),
    ...(value !== undefined ? { value } : {}),
    ...(item !== undefined ? { item } : {}),
  }

  const hasSettingsYaml =
    y?.["РежимОтображения"] !== undefined ||
    y?.["ИдентификаторПользовательскойНастройки"] !== undefined ||
    y?.["ПредставлениеПользовательскойНастройки"] !== undefined

  if (hasSettingsYaml) {
    const viewKey = y?.["РежимОтображения"] as SE.DataCompositionSettingsItemViewModeYAML | undefined
    return {
      ...base,
      ...(viewKey !== undefined
        ? { viewMode: SE.DataCompositionSettingsItemViewModeFromYAML[viewKey] }
        : {}),
      ...(y?.["ИдентификаторПользовательскойНастройки"] !== undefined
        ? { userSettingID: String(y?.["ИдентификаторПользовательскойНастройки"]) }
        : {}),
      ...(y?.["ПредставлениеПользовательскойНастройки"] !== undefined
        ? {
            userSettingPresentation: importI8nTextFromYAML({
              context,
              rule: { type: "I8nText" },
              value: y?.["ПредставлениеПользовательскойНастройки"] as never,
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
