import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ConfigurationContext } from "../../../context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { asExplicitYAMLStringIfMarked, isExplicitYAMLString, unwrapExplicitYAMLString } from "~/yaml/explicitString"
import { importDcsMetadataValueFromYAML } from "../dcsMetadataValue/fromYAML"
import type { MetadataDcsMetadataValue } from "../dcsMetadataValue/types"
import { toDcsMetadataValueRule } from "./dcsValueRule"
import type {
  LegacyParameterValueYAML,
  LegacySettingsParameterValueYAML,
  ParameterValue,
  ParameterValueYAML,
  SettingsParameterValue,
  SettingsParameterValuePropertyRule,
  SettingsParameterValueYAML,
} from "./types"

const isYamlObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x) && !isExplicitYAMLString(x)

const isExplicitDcsValueYAML = (x: unknown): x is Record<string, unknown> =>
  isYamlObject(x) && typeof x["Тип"] === "string" && "Значение" in x

const hasSettingsParameterValueWrapperKey = (x: Record<string, unknown>): boolean =>
  "Использовать" in x ||
  "Элементы" in x ||
  x["РежимОтображения"] !== undefined ||
  x["ИдентификаторПользовательскойНастройки"] !== undefined ||
  x["ПредставлениеПользовательскойНастройки"] !== undefined

const isExpandedSettingsParameterValueShape = (x: unknown): x is Record<string, unknown> =>
  isYamlObject(x) && (hasSettingsParameterValueWrapperKey(x) || ("Значение" in x && !isExplicitDcsValueYAML(x)))

const normalizeSourceValues = (value: ParameterValue["value"] | undefined): MetadataDcsMetadataValue[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? (value as MetadataDcsMetadataValue[]) : [value]
}

const appendImportedValue = (
  target: MetadataDcsMetadataValue[],
  value: MetadataDcsMetadataValue | null | undefined
): void => {
  if (value === undefined) return
  target.push(value)
}

const normalizeRawValues = (
  valueType: SettingsParameterValuePropertyRule["valueType"],
  rawValue: unknown
): unknown[] => {
  if (rawValue === undefined) return []
  if (valueType === "ChoiceParameterLinks") return [rawValue]
  return Array.isArray(rawValue) ? rawValue : [rawValue]
}

const restoreExplicitRawValue = (parent: unknown, key: string | number, value: unknown): unknown =>
  asExplicitYAMLStringIfMarked(parent, key, value)

const shouldPreserveExplicitYAMLString = (valueType: SettingsParameterValuePropertyRule["valueType"]): boolean =>
  valueType === "Primitive" || valueType === "DesignTimeValue" || valueType === "Field"

const normalizeExplicitRawValue = (
  valueType: SettingsParameterValuePropertyRule["valueType"],
  parent: unknown,
  key: string | number,
  value: unknown
): unknown =>
  shouldPreserveExplicitYAMLString(valueType)
    ? restoreExplicitRawValue(parent, key, value)
    : unwrapExplicitYAMLString(value)

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
  yaml: ParameterValueYAML | SettingsParameterValueYAML | LegacyParameterValueYAML | LegacySettingsParameterValueYAML,
  sourceValue?: ParameterValue | SettingsParameterValue
): ParameterValue | SettingsParameterValue | undefined => {
  if (yaml === undefined) {
    return undefined
  }

  if (yaml === null && rule.valueType !== "Color") {
    return undefined
  }

  const dcsRule = toDcsMetadataValueRule(rule)

  const unwrapped = tryUnwrapParameterValueWrapper(rule, yaml)
  const yamlToParse = unwrapped !== undefined ? unwrapped.inner : yaml
  const parameterFromWrapper = unwrapped?.parameter

  const y = isExpandedSettingsParameterValueShape(yamlToParse) ? yamlToParse : undefined
  const parameterFromRule = typeof rule.yaml === "string" ? rule.yaml : undefined
  const isExpandedSpvShape = y !== undefined
  const parameterFromExpandedField =
    isExpandedSpvShape && typeof y?.["Параметр"] === "string" ? String(y["Параметр"]) : undefined
  const parameter = String(parameterFromWrapper ?? parameterFromExpandedField ?? parameterFromRule ?? "")
  const hasExplicitValue = y !== undefined && "Значение" in y
  const rawValueBase =
    rule.valueType === "Color" && yamlToParse === null
      ? undefined
      : hasExplicitValue
        ? normalizeExplicitRawValue(rule.valueType, y, "Значение", y["Значение"])
        : isExpandedSpvShape
          ? undefined
          : yamlToParse
  const rawValue =
    unwrapped !== undefined
      ? normalizeExplicitRawValue(rule.valueType, yaml, parameterFromWrapper, rawValueBase)
      : rawValueBase
  const rawList = normalizeRawValues(dcsRule.valueType, rawValue)
  const sourceValues = normalizeSourceValues(sourceValue?.value)
  const valueParts: MetadataDcsMetadataValue[] = []
  rawList.forEach((v, index) => {
    const valueToImport = Array.isArray(rawValue) ? restoreExplicitRawValue(rawValue, index, v) : v
    appendImportedValue(
      valueParts,
      importDcsMetadataValueFromYAML(context, dcsRule, valueToImport as never, sourceValues[index] ?? undefined)
    )
  })
  if (rawList.length === 0 && sourceValue?.value !== undefined) {
    const sourceOnlyValues = normalizeSourceValues(sourceValue.value)
    sourceOnlyValues.forEach((sourceOnlyValue) => {
      appendImportedValue(
        valueParts,
        importDcsMetadataValueFromYAML(context, dcsRule, undefined, sourceOnlyValue ?? undefined)
      )
    })
  }

  const value: ParameterValue["value"] =
    valueParts.length === 0 ? undefined : valueParts.length === 1 ? valueParts[0] : valueParts

  const rawElements = y?.["Элементы"]
  const elementList = rawElements === undefined ? [] : Array.isArray(rawElements) ? rawElements : [rawElements]
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
      ...(viewKey !== undefined ? { viewMode: SE.DataCompositionSettingsItemViewModeFromYAML[viewKey] } : {}),
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
  value: unknown,
  sourceValue?: unknown
) =>
  importParameterValueFromYAML(
    context,
    rule as unknown as SettingsParameterValuePropertyRule,
    value as SettingsParameterValueYAML,
    sourceValue as ParameterValue | SettingsParameterValue | undefined
  )

registerTypeRule("SettingsParameterValue", "importFromYAML", importSettingsParameterValueFromYAMLForRule)
