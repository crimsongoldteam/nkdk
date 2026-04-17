import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { exportI8nTextToXML } from "../i8nText/toXML"
import { primitiveValueHandlers } from "./handlers"
import {
  MetadataFixedArrayValue,
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataPrimitiveValueType,
  MetadataSimpleValueXML,
  MetadataStringValue,
  MetadataTypedValue,
  MetadataValuePropertyRule,
  MetadataValueTypeToXML,
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
    if (rule.valueType !== undefined) {
      const firstType = Array.isArray(rule.valueType) ? rule.valueType[0] : rule.valueType
      if (firstType) {
        const xmlType = MetadataValueTypeToXML[firstType as keyof typeof MetadataValueTypeToXML]
        return { "_xsi:type": xmlType }
      }
    }
    return undefined
  }

  if (value.type === "fixedArray") {
    return exportFixedArrayValueToXML(params.context, value as MetadataFixedArrayValue)
  }

  if (value.type === "formChoiceListDesTimeValue") {
    return exportFormChoiceListValueToXML(params.context, value as MetadataFormChoiceListValue)
  }

  if (!PRIMITIVE_TYPES.includes(value.type as MetadataPrimitiveValueType)) {
    throw new Error(`MetadataValue: неподдерживаемый тип для экспорта в XML: ${value.type}`)
  }

  const handler = primitiveValueHandlers[value.type as MetadataPrimitiveValueType]
  return handler.toXML(value)
}

const exportFixedArrayValueToXML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValue
): MetadataFixedArrayValueXML => {
  const rule: MetadataValuePropertyRule = { type: "MetadataValue" }
  const values = data.value.map((v) => exportMetadataValueToXML({ context, rule, value: v as MetadataTypedValue }))
  return {
    "_xsi:type": "v8:FixedArray",
    "v8:Value": values.length === 1 ? values[0] : values,
  } as MetadataFixedArrayValueXML
}

export const exportFormChoiceListValueToXML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueXML => {
  const rule: MetadataValuePropertyRule = { type: "MetadataValue", exportNilValue: true }
  const value = exportMetadataValueToXML({ context, rule, value: data.value as MetadataTypedValue | undefined })
  const valueXML: any = value ?? { "_xsi:nil": true }
  return {
    "_xsi:type": "FormChoiceListDesTimeValue",
    Presentation: exportI8nTextToXML(context, { type: "I8nText" }, data.presentation),
    Value: valueXML,
  } as MetadataFormChoiceListValueXML
}

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
