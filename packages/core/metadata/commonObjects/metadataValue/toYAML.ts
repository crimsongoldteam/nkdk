import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { exportFixedArrayToYAML } from "./fixedArray/toYAML"
import { exportFormChoiceListToYAML } from "./formChoiceList/toYAML"
import { primitiveValueHandlers } from "./handlers"
import {
  MetadataFixedArrayValue,
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

  if (data.type === "fixedArray") return exportFixedArrayToYAML(context, data as MetadataFixedArrayValue)
  if (data.type === "formChoiceListDesTimeValue") return exportFormChoiceListToYAML(context, data as MetadataFormChoiceListValue)

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

/** @deprecated Используй exportFormChoiceListToYAML из submodule formChoiceList/toYAML */
export const exportFormChoiceListValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueYAML => exportFormChoiceListToYAML(context, data)

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
