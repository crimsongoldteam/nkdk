import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { exportFixedArrayToXML } from "./fixedArray/toXML"
import { exportFormChoiceListToXML } from "./formChoiceList/toXML"
import { primitiveValueHandlers } from "./handlers"
import {
  MetadataFixedArrayValue,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataPrimitiveValueType,
  MetadataSimpleValueXML,
  MetadataStringValue,
  MetadataTypedValue,
  MetadataValuePropertyRule,
  MetadataValueTypeToXML,
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
]

/**
 * Экспортирует MetadataValue в XML. Принимает тегированную форму {type, value}.
 */
export const exportMetadataValueToXML = (params: {
  context: ConfigurationContext
  rule: MetadataValuePropertyRule
  value: MetadataTypedValue | undefined
}): any => {
  const { rule, value } = params

  if (value === undefined) {
    if (rule.exportNilValue) return { "_xsi:nil": true }
    if (rule.valueType !== undefined && rule.valueType.length > 0) {
      const firstType = rule.valueType[0]
      const xmlType = MetadataValueTypeToXML[firstType]
      return { "_xsi:type": xmlType }
    }
    return undefined
  }

  assertValueType(rule.valueType, value.type, "toXML")

  if (value.type === "fixedArray") {
    return exportFixedArrayToXML(params.context, value as MetadataFixedArrayValue)
  }

  if (value.type === "formChoiceListDesTimeValue") {
    return exportFormChoiceListToXML(params.context, value as MetadataFormChoiceListValue)
  }

  if (!PRIMITIVE_TYPES.includes(value.type as MetadataPrimitiveValueType)) {
    throw new Error(`MetadataValue: неподдерживаемый тип для экспорта в XML: ${value.type}`)
  }

  const handler = primitiveValueHandlers[value.type as MetadataPrimitiveValueType]
  return handler.toXML(value)
}

/** @deprecated Используй exportFormChoiceListToXML из submodule formChoiceList/toXML */
export const exportFormChoiceListValueToXML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueXML => exportFormChoiceListToXML(context, data)

/**
 * Экспортирует AssociatedTable (MetadataStringValue) в XML.
 */
export const exportAssociatedTableToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: MetadataStringValue | undefined
): MetadataSimpleValueXML | undefined => {
  if (value === undefined) return undefined
  return exportMetadataValueToXML({
    context,
    rule: { type: "MetadataValue" },
    value,
  }) as MetadataSimpleValueXML
}

registerTypeRule("MetadataValue", "exportToXML", exportMetadataValueToXML as any)
registerTypeRule("AssociatedTable", "exportToXML", exportAssociatedTableToXML as any)
