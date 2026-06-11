import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { exportFixedArrayToYAML } from "./fixedArray/toYAML"
import { exportFormChoiceListToYAML } from "./formChoiceList/toYAML"
import { primitiveValueHandlers } from "./handlers"
import { exportStandardPeriodToYAML } from "../standardPeriod/toYAML"
import {
  MetadataFixedArrayValue,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueYAML,
  MetadataPrimitiveValueType,
  MetadataStringValue,
  MetadataTypedValue,
  MetadataValuePropertyRule,
  MetadataValueYAML,
  assertValueType,
} from "./types"

const PRIMITIVE_TYPES: readonly MetadataPrimitiveValueType[] = [
  "string",
  "decimal",
  "dateTime",
  "boolean",
  "ref",
  "objectRef",
  "ApplicationUsePurpose",
  "typeRef",
  "uuid",
  "DataCompositionComparisonType",
  "AccountType",
]

/**
 * Экспортирует MetadataValue в YAML. Принимает тегированную форму {type, value}.
 */
export const exportMetadataValueToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataTypedValue | undefined
): MetadataValueYAML | undefined => {
  if (!data) return undefined
  const ruleTyped = rule as MetadataValuePropertyRule | undefined

  assertValueType(ruleTyped?.valueType, data.type, "toYAML")

  if (data.type === "fixedArray") return exportFixedArrayToYAML(context, data as MetadataFixedArrayValue)
  if (data.type === "formChoiceListDesTimeValue") return exportFormChoiceListToYAML(context, data as MetadataFormChoiceListValue)
  if (data.type === "valueList") return "СписокЗначений"
  if (data.type === "standardPeriod") return exportStandardPeriodToYAML(data.value, context, rule)

  if (!PRIMITIVE_TYPES.includes(data.type as MetadataPrimitiveValueType)) {
    throw new Error(`MetadataValue: неподдерживаемый тип для YAML: ${data.type}`)
  }

  if (data.type === "AccountType") {
    return {
      Тип: "ВидСчета",
      Значение: primitiveValueHandlers.AccountType.toYAML(context, data) as string,
    } as MetadataValueYAML
  }

  const handler = primitiveValueHandlers[data.type as MetadataPrimitiveValueType]
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
