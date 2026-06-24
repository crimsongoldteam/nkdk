import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ExplicitYAMLString, isExplicitYAMLString } from "~/yaml/explicitString"
import { ConfigurationContext } from "../../context/types"
import { importFixedArrayFromYAML } from "./fixedArray/fromYAML"
import { importFormChoiceListFromYAML } from "./formChoiceList/fromYAML"
import { primitiveValueHandlers } from "./handlers"
import { importStandardPeriodFromYAML, isStandardPeriodYAML } from "../standardPeriod/fromYAML"
import {
  MetadataFixedArrayValueYAMLInput,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueYAML,
  MetadataTypedValue,
  MetadataStringValue,
  MetadataValuePropertyRule,
  MetadataValueYAML,
  assertValueType,
} from "./types"

type MetadataSingleYAML = string | number | ExplicitYAMLString
type ExplicitMetadataValueYAML = {
  Тип?: unknown
  Значение?: unknown
}

const importExplicitValueFromYAML = (
  context: ConfigurationContext,
  data: ExplicitMetadataValueYAML
): MetadataTypedValue | undefined => {
  if (data.Тип === "ВидСчета" && typeof data.Значение === "string") {
    return primitiveValueHandlers.AccountType.fromYAML(context, data.Значение as MetadataValueYAML)
  }
  return undefined
}

/**
 * Импортирует MetadataValue из YAML. Всегда возвращает тегированную форму {type, value}.
 *
 * Тип определяется из синтаксиса значения YAML (детерминистски).
 * Если rule.valueType задан, проверяется соответствие — несовпадение → throw.
 */
export const importMetadataValueFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataValueYAML | undefined
): MetadataTypedValue | undefined => {
  if (data === undefined || data === null) return undefined
  const ruleTyped = rule as MetadataValuePropertyRule | undefined

  if (
    data === "СписокЗначений" &&
    (ruleTyped?.valueType === undefined || ruleTyped.valueType.includes("valueList"))
  ) {
    return { type: "valueList" }
  }

  if (ruleTyped?.valueType?.includes("DataCompositionComparisonType")) {
    const result = primitiveValueHandlers.DataCompositionComparisonType.fromYAML(context, data)
    if (result !== undefined) return result
  }

  // Агрегатные типы определяются по форме данных, не по rule
  if (isStandardPeriodYAML(data)) {
    const value = importStandardPeriodFromYAML(context, undefined, data)
    if (value === undefined) return undefined
    const result = { type: "standardPeriod", value } satisfies MetadataTypedValue
    assertValueType(ruleTyped?.valueType, result.type, "fromYAML")
    return result
  }

  if (
    typeof data === "object" &&
    !Array.isArray(data) &&
    ("Представление" in data || ("Значение" in data && !("Тип" in data)))
  ) {
    const result = importFormChoiceListFromYAML(context, data as MetadataFormChoiceListValueYAML)
    assertValueType(ruleTyped?.valueType, result.type, "fromYAML")
    return result
  }

  if (typeof data === "object" && !Array.isArray(data)) {
    const result = importExplicitValueFromYAML(context, data as ExplicitMetadataValueYAML)
    if (result !== undefined) {
      assertValueType(ruleTyped?.valueType, result.type, "fromYAML")
      return result
    }
  }

  if (Array.isArray(data)) {
    return importFixedArrayFromYAML(context, data as MetadataFixedArrayValueYAMLInput)
  }

  const result = heuristicFromYAML(context, data as MetadataSingleYAML)

  // Строгая валидация: если valueType задан, фактический тип должен совпадать
  if (result !== undefined) {
    assertValueType(ruleTyped?.valueType, result.type, "fromYAML")
  }

  return result
}

/**
 * Детерминистская диспетчеризация по синтаксису YAML-значения.
 * Порядок: явная YAML-строка → число → boolean → dateTime → ref → string.
 */
const heuristicFromYAML = (
  context: ConfigurationContext,
  data: MetadataSingleYAML
): MetadataTypedValue | undefined => {
  if (isExplicitYAMLString(data)) {
    return { type: "string", value: data.value } satisfies MetadataStringValue
  }

  if (typeof data === "number") {
    return { type: "decimal", value: data }
  }

  if (typeof data !== "string") return undefined

  // Boolean
  if (data === "Истина" || data === "Ложь") {
    return { type: "boolean", value: data === "Истина" }
  }

  // DateTime: dd.MM.yyyy или dd.MM.yyyy HH:mm:ss
  const dateTimeMatch = data.match(/^\d{2}\.\d{2}\.\d{4}(\s+\d{2}:\d{2}:\d{2})?$/)
  if (dateTimeMatch) {
    const result = primitiveValueHandlers.dateTime.fromYAML(context, data)
    if (result) return result
  }

  // Число как строка
  if (!isNaN(Number(data)) && data.trim() !== "" && !isNaN(parseFloat(data))) {
    return { type: "decimal", value: Number(data) }
  }

  // Ref: строка с точками
  const refResult = primitiveValueHandlers.ref.fromYAML(context, data)
  if (refResult) return refResult

  // Fallback: строка
  return { type: "string", value: data } satisfies MetadataStringValue
}

/** @deprecated Используй importFormChoiceListFromYAML из submodule formChoiceList/fromYAML */
export const importFormChoiceListValueFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValueYAML
): MetadataFormChoiceListValue => importFormChoiceListFromYAML(context, data)

/**
 * Импортирует AssociatedTable (строка YAML) → MetadataStringValue.
 */
export const importAssociatedTableFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: string | undefined
): MetadataStringValue | undefined => {
  if (data === undefined) return undefined
  return { type: "string", value: data } satisfies MetadataStringValue
}

registerTypeRule("MetadataValue", "importFromYAML", importMetadataValueFromYAML)
registerTypeRule("AssociatedTable", "importFromYAML", importAssociatedTableFromYAML as any)
