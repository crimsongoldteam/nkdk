import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { exportI8nTextToXML } from "../i8nText/toXML"
import {
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataPrimitiveValueType,
  MetadataSimpleValueXML,
  MetadataTypedValue,
  MetadataValueByRule,
  MetadataValuePropertyRule,
  MetadataValueTypeToXML,
  MetadataValueXML,
} from "./types"

export const exportMetadataValueToXML = <Rule extends MetadataValuePropertyRule>(params: {
  context: ConfigurationContext
  rule: Rule
  value: MetadataValueByRule<Rule>
}): MetadataValueXML<Rule, MetadataValueByRule<Rule>> => {
  const { context, rule, value: value } = params

  type Result = any
  if (value === undefined) {
    if (rule.valueType !== undefined) {
      const xmlType = MetadataValueTypeToXML[rule.valueType as keyof typeof MetadataValueTypeToXML]
      return { "_xsi:type": xmlType } as Result
    }
    if (rule.exportNilValue) {
      return {
        "_xsi:nil": true,
      } as Result
    }
    return undefined as Result
  }

  if (rule.valueType !== undefined) {
    const valueType = rule.valueType

    const typedValue: MetadataTypedValue =
      valueType === "formChoiceListDesTimeValue"
        ? ({
            type: valueType,
            value: (value as any as MetadataFormChoiceListValue).value,
            presentation: (value as any as MetadataFormChoiceListValue).presentation,
          } as MetadataTypedValue<"formChoiceListDesTimeValue">)
        : ({
            type: valueType,
            value:
              typeof value === "object" && value !== null && "type" in (value as any) && "value" in (value as any)
                ? (value as any).value
                : value,
          } as unknown as MetadataTypedValue)

    return exportMetadataValueToXML({
      context,
      rule: { ...rule, valueType: undefined },
      value: typedValue,
    })
  }

  const typedValue: MetadataTypedValue =
    typeof value === "object" && value !== null && "type" in (value as any)
      ? (value as any)
      : ({
          type: (typeof value === "string"
            ? "string"
            : typeof value === "number"
              ? "decimal"
              : typeof value === "boolean"
                ? "boolean"
                : "string") as MetadataPrimitiveValueType,
          value,
        } as any)
  const xmlType = MetadataValueTypeToXML[typedValue.type as keyof typeof MetadataValueTypeToXML]

  if (typedValue.type === "fixedArray") return exportFixedArrayValueToXML(context, typedValue as any) as Result

  if (typedValue.type === "formChoiceListDesTimeValue")
    return exportFormChoiceListValueToXML(context, typedValue as any) as Result

  return exportSimpleValue(xmlType, String((typedValue as any).value)) as Result
}

const exportFixedArrayValueToXML = (
  context: ConfigurationContext,
  data: any
): MetadataFixedArrayValueXML => {
  const values = (data.value as any[]).map((v) =>
    exportMetadataValueToXML({ context, rule: { type: "MetadataValue" } as any, value: v as any })
  )
  return {
    "_xsi:type": "v8:FixedArray",
    "v8:Value": values.length === 1 ? values[0] : values,
  } as MetadataFixedArrayValueXML
}

export const exportFormChoiceListValueToXML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueXML => {
  const value = exportMetadataValueToXML({ context, rule: { type: "MetadataValue", exportNilValue: true } as any, value: data.value as any })

  // Если значение undefined, создаем объект с xsi:nil="true"
  const valueXML: any =
    value ??
    ({
      "_xsi:nil": true,
    } as any)

  return {
    "_xsi:type": "FormChoiceListDesTimeValue",
    Presentation: exportI8nTextToXML(context, { type: "I8nText" }, data.presentation),
    Value: valueXML,
  } as MetadataFormChoiceListValueXML
}

const exportSimpleValue = (xsiType: any, text: string): MetadataSimpleValueXML =>
  ({
    "_xsi:type": xsiType,
    "#text": text,
  }) as any

export const exportAssociatedTableToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): MetadataSimpleValueXML | undefined => {
  if (value === undefined) return undefined
  return exportMetadataValueToXML({
    context: _context,
    rule: { type: "MetadataValue", valueType: "string" } as any,
    value,
  }) as any
}

registerTypeRule("MetadataValue", "exportToXML", exportMetadataValueToXML as any)

registerTypeRule("AssociatedTable", "exportToXML", exportAssociatedTableToXML as any)
