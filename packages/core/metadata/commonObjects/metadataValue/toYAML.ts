import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { primitiveValueHandlers } from "./handlers"
import {
  MetadataFixedArrayValue,
  MetadataFixedArrayValueYAML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueYAML,
  MetadataPrimitiveValueType,
  MetadataStringValue,
  MetadataTypedValue,
  MetadataValuePropertyRule,
  MetadataValueYAML,
} from "./types"

const PRIMITIVE_TYPES: readonly MetadataPrimitiveValueType[] = [
  "string",
  "decimal",
  "dateTime",
  "boolean",
  "ref",
  "objectRef",
  "ApplicationUsePurpose",
]

/**
 * Экспортирует MetadataValue в YAML. Принимает тегированную форму {type, value}.
 *
 * Compat: поддерживает `withType: false` в rule (dscMetadataTypedValue использует это
 * для экспорта строк без кавычек). Будет удалено в #76.
 */
export const exportMetadataValueToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataTypedValue | undefined
): MetadataValueYAML | undefined => {
  if (!data) return undefined
  const ruleTyped = rule as MetadataValuePropertyRule | undefined

  if (data.type === "fixedArray") return exportFixedArrayValueToYAML(context, rule, data as MetadataFixedArrayValue)
  if (data.type === "formChoiceListDesTimeValue") return exportFormChoiceListValueToYAML(context, rule, data as MetadataFormChoiceListValue)

  if (!PRIMITIVE_TYPES.includes(data.type as MetadataPrimitiveValueType)) {
    throw new Error(`MetadataValue: неподдерживаемый тип для YAML: ${data.type}`)
  }

  const handler = primitiveValueHandlers[data.type as MetadataPrimitiveValueType]

  // Compat: withType: false → для строк без кавычек (используется в dscMetadataTypedValue)
  if (ruleTyped?.withType === false && data.type === "string") {
    return (data as MetadataStringValue).value as MetadataValueYAML
  }

  return handler.toYAML(context, data)
}

const exportFixedArrayValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFixedArrayValue
): MetadataFixedArrayValueYAML =>
  data.value.map((v) => exportMetadataValueToYAML(context, undefined, v as MetadataTypedValue)!) as MetadataFixedArrayValueYAML

export const exportFormChoiceListValueToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueYAML => {
  // При экспорте значения внутри formChoiceList всегда используем новый режим (кавычки для строк)
  const valueResult = exportMetadataValueToYAML(context, undefined, data.value as MetadataTypedValue | undefined)
  const presentationItems = data.presentation?.items
  const hasMultipleLanguages = presentationItems && Object.keys(presentationItems).length > 1

  if (valueResult === undefined) {
    const presentation = presentationItems?.[context.defaultLanguage] || presentationItems?.ru || ""
    return `(${presentation})`
  }

  if (hasMultipleLanguages && presentationItems) {
    return {
      Представление: presentationItems,
      Значение: valueResult,
    }
  }

  const presentation = presentationItems?.[context.defaultLanguage] || presentationItems?.ru || ""
  return `${valueResult}(${presentation})`
}

/**
 * Экспортирует AssociatedTable (MetadataStringValue) в YAML.
 */
export const exportAssociatedTableToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: MetadataStringValue | undefined
): string | undefined => {
  if (value === undefined) return undefined
  return value.value
}

export const exportMedatataRefToYAML = (context: ConfigurationContext, value: string): string => {
  const result = primitiveValueHandlers.ref.toYAML(context, { type: "ref", value })
  if (!result) throw new Error(`MetadataValue: не удалось экспортировать ref: ${value}`)
  return result as string
}

registerTypeRule("MetadataValue", "exportToYAML", exportMetadataValueToYAML)
registerTypeRule("AssociatedTable", "exportToYAML", exportAssociatedTableToYAML as any)
