import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ExplicitYAMLString, isExplicitYAMLString, isMetadataTargetUuid } from "@nkdk/runtime"
import { ConfigurationContext } from "@nkdk/runtime"
import { primitiveValueHandlers } from "./handlers"
import { importStandardPeriodFromYAML, isStandardPeriodYAML } from "../standardPeriod/fromYAML"
import { asExplicitYAMLStringIfMarked } from "@nkdk/runtime"
import { isMetadataRootName, rootFromYAML } from "../metadataTargets"
import { DataCompositionComparisonTypeFromYAML } from "../../systemEnumerations/types"
import type { I8nText } from "../i8nText/types"
import { importI8nTextFromYAML } from "../i8nText/fromYAML"
import { restoreExplicitMetadataValueYAMLString } from "./explicitYAMLString"
import {
  MetadataExplicitFormChoiceListValueYAML,
  MetadataFixedArrayValue,
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

  if (data === "СписокЗначений" && (ruleTyped?.valueType === undefined || ruleTyped.valueType.includes("valueList"))) {
    return { type: "valueList" }
  }

  if (ruleTyped?.valueType?.includes("DataCompositionComparisonType")) {
    const result = primitiveValueHandlers.DataCompositionComparisonType.fromYAML(context, data)
    if (result !== undefined) return result
  }

  if (
    typeof data === "string" &&
    (ruleTyped?.valueType?.includes("ref") === true || ruleTyped?.metadataTarget !== undefined) &&
    isMetadataTargetUuid(data)
  ) {
    return { type: "ref", value: data }
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

const isExplicitFormChoiceListValueYAML = (
  value: Exclude<MetadataFixedArrayValueYAMLInput[number], null | undefined>
): value is MetadataExplicitFormChoiceListValueYAML =>
  typeof value === "object" &&
  !Array.isArray(value) &&
  value !== null &&
  (value as Record<string, unknown>).Тип === "ЗначениеСпискаВыбора"

export const importFixedArrayFromYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValueYAMLInput
): MetadataFixedArrayValue => ({
  type: "fixedArray",
  value: data.map((item, index) => {
    if (item === undefined || item === null) return undefined
    const value = asExplicitYAMLStringIfMarked(data, index, item) as Exclude<
      MetadataFixedArrayValueYAMLInput[number],
      null | undefined
    >
    if (isExplicitFormChoiceListValueYAML(value)) {
      const { Тип: _type, ...formChoiceListValue } = value
      return importFormChoiceListFromYAML(
        context,
        formChoiceListValue as MetadataFormChoiceListValueYAML
      )
    }
    return importMetadataValueFromYAML(context, undefined, value)!
  }),
})

const importPresentationFromYAML = (
  context: ConfigurationContext,
  value: MetadataFormChoiceListValueYAML["Представление"]
): I8nText | undefined => {
  if (value === "") return undefined
  return importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value })
}

const importExplicitChoiceListValueFromYAML = (
  value: unknown
): MetadataFormChoiceListValue["value"] | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const data = value as Record<string, unknown>
  if (data.Тип !== "ВидСравненияКомпоновкиДанных" || typeof data.Значение !== "string") {
    return undefined
  }
  const enumValue =
    DataCompositionComparisonTypeFromYAML[
      data.Значение as keyof typeof DataCompositionComparisonTypeFromYAML
    ]
  if (enumValue === undefined) return undefined
  return { type: "DataCompositionComparisonType", value: enumValue }
}

export const importFormChoiceListFromYAML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValueYAML
): MetadataFormChoiceListValue => {
  const presentation = importPresentationFromYAML(context, data.Представление)
  const value =
    data.Значение === undefined
      ? undefined
      : (importExplicitChoiceListValueFromYAML(data.Значение) ??
        importChoiceListValueFromYAML(
          context,
          restoreExplicitMetadataValueYAMLString(
            data,
            "Значение",
            data.Значение
          ) as MetadataFormChoiceListValueYAML["Значение"]
        ))
  const result: MetadataFormChoiceListValue = { type: "formChoiceListDesTimeValue" }
  if (presentation !== undefined) result.presentation = presentation
  if (value !== undefined) result.value = value
  return result
}

const importChoiceListValueFromYAML = (
  context: ConfigurationContext,
  value: MetadataFormChoiceListValueYAML["Значение"]
): MetadataFormChoiceListValue["value"] | undefined => {
  if (typeof value === "string" && isMetadataObjectTargetOnly(value)) {
    return { type: "string", value } satisfies MetadataStringValue
  }
  try {
    return importMetadataValueFromYAML(context, undefined, value)
  } catch (caught) {
    if (typeof value !== "string" || isFullYAMLMetadataTarget(value)) throw caught
    return { type: "string", value } satisfies MetadataStringValue
  }
}

function isMetadataObjectTargetOnly(value: string): boolean {
  const parts = value.split(".")
  if (parts.length !== 2) return false
  const [root] = parts
  return rootFromYAML[root] !== undefined || isMetadataRootName(root)
}

function isFullYAMLMetadataTarget(value: string): boolean {
  const parts = value.split(".")
  const [root] = parts
  return parts.length > 1 && (rootFromYAML[root] !== undefined || isMetadataRootName(root))
}

/**
 * Детерминистская диспетчеризация по синтаксису YAML-значения.
 * Порядок: явная YAML-строка → число → boolean → dateTime → ref → string.
 */
const heuristicFromYAML = (context: ConfigurationContext, data: MetadataSingleYAML): MetadataTypedValue | undefined => {
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

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataValue", "importFromYAML", importMetadataValueFromYAML)
export const metadataPropertyRule001 = definePropertyTypeRule("AssociatedTable", "importFromYAML", importAssociatedTableFromYAML as any)
