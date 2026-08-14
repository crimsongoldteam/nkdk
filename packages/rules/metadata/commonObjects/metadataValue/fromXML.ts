import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ImportFromXMLFunction } from "@nkdk/runtime/rule-kit"
import { ConfigurationContextFromXML } from "@nkdk/runtime"
import { primitiveValueHandlers } from "./handlers"
import { importStandardPeriodFromXML } from "../standardPeriod/fromXML"
import { StandardPeriodXML } from "../standardPeriod/types"
import { importI8nTextFromXML } from "../i8nText/fromXML"
import {
  MetadataFixedArrayValue,
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataPrimitiveValueType,
  MetadataStringValue,
  MetadataTypedValue,
  MetadataValuePropertyRule,
  MetadataValueType,
  MetadataValueTypeFromXML,
  MetadataValueTypeXML,
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

const isEmptyMetadataValueXML = (value: Record<string, unknown>): boolean =>
  Object.keys(value).every((key) => key === "_xsi:type")

const isNilMetadataValueXML = (value: Record<string, unknown>): boolean =>
  value["_xsi:nil"] === true || value["_xsi:nil"] === "true"

/**
 * Импортирует MetadataValue из XML. Всегда возвращает тегированную форму {type, value}.
 * Тип берётся из xsi:type в XML или из параметра `type`.
 */
export const importMetadataValueFromXML = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule | undefined
  value: any
  type?: MetadataValueType
}): MetadataTypedValue | undefined => {
  const { context, value: data, type } = params
  if (!data) return undefined
  if (isNilMetadataValueXML(data)) {
    return context.fromXML.forReference ? (data as any) : undefined
  }

  const resultedType: MetadataValueType | undefined =
    type ?? MetadataValueTypeFromXML(data["_xsi:type"] as MetadataValueTypeXML)
  if (!resultedType) {
    if (context.fromXML.forReference && typeof data["_xsi:type"] === "string") return data as any
    if (typeof data["_xsi:type"] === "string" && isEmptyMetadataValueXML(data)) return undefined
    throw new Error(`MetadataValue: не распознан тип: ${data["_xsi:type"]}`)
  }

  const ruleTyped = params.rule as MetadataValuePropertyRule | undefined
  assertValueType(ruleTyped?.valueType, resultedType, "fromXML")

  if (resultedType === "fixedArray") {
    return importFixedArrayFromXML(context, data)
  }

  if (resultedType === "formChoiceListDesTimeValue") {
    return importFormChoiceListFromXML(context, data as MetadataFormChoiceListValueXML)
  }

  if (resultedType === "valueList") {
    return { type: "valueList" }
  }

  if (resultedType === "standardPeriod") {
    const value = importStandardPeriodFromXML(data as StandardPeriodXML)
    return value === undefined ? undefined : { type: "standardPeriod", value }
  }

  if (!PRIMITIVE_TYPES.includes(resultedType as MetadataPrimitiveValueType)) {
    throw new Error(`MetadataValue: неподдерживаемый примитивный тип: ${resultedType}`)
  }

  const textValue = data["#text"] as string | boolean | number | undefined
  const handler = primitiveValueHandlers[resultedType as MetadataPrimitiveValueType]
  return handler.fromXML(context, textValue)
}

export const importFixedArrayFromXML = (
  context: ConfigurationContextFromXML,
  data: MetadataFixedArrayValueXML | { "v8:Value": unknown | unknown[] }
): MetadataFixedArrayValue => {
  const raw = data["v8:Value"]
  const values = Array.isArray(raw) ? raw : [raw]
  return {
    type: "fixedArray",
    value: values.map((value) =>
      typeof value === "object" &&
      value !== null &&
      "_xsi:nil" in value &&
      value["_xsi:nil"] === true
        ? undefined
        : importMetadataValueFromXML({ context, rule: undefined, value })!
    ),
  }
}

export const importFormChoiceListFromXML = (
  context: ConfigurationContextFromXML,
  data: MetadataFormChoiceListValueXML
): MetadataFormChoiceListValue | undefined => {
  if (!data) return undefined
  const value = importMetadataValueFromXML({ context, rule: undefined, value: data.Value })
  const presentation = importI8nTextFromXML(context, { type: "I8nText" }, data.Presentation)
  const result: MetadataFormChoiceListValue = { type: "formChoiceListDesTimeValue" }
  if (value !== undefined) result.value = value
  if (presentation !== undefined) result.presentation = presentation
  return result
}

export const importMetadataValuesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: any[] | undefined
): MetadataTypedValue[] | undefined => {
  if (!data) return undefined
  return data.map((value) => importMetadataValueFromXML({ context, rule: undefined, value })!)
}

export const importMetadataSimpleValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: any
): string | boolean | number | undefined => {
  const result = importMetadataValueFromXML({ context, rule: undefined, value: data })
  if (!result) return undefined
  if (!("value" in result)) throw new Error(`MetadataValue: ожидался примитив, получен ${result.type}`)
  return (result as any).value as string | boolean | number
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataValue", "configurationIndexValueFromXML", {
})

/** @deprecated Используй importFormChoiceListFromXML из submodule formChoiceList/fromXML */
export const importFormChoiceListValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValueXML
): MetadataFormChoiceListValue | undefined => importFormChoiceListFromXML(context, data)

/**
 * Импортирует AssociatedTable (xs:string) из XML.
 * Возвращает MetadataStringValue вместо raw string.
 */
export const importAssociatedTableFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  data: any
): MetadataStringValue | undefined => {
  const result = importMetadataValueFromXML({ context, rule: undefined, value: data, type: "string" })
  if (!result) return undefined
  return result as MetadataStringValue
}

const importMetadataValueFromXMLForRule: ImportFromXMLFunction = (context, rule, value) =>
  importMetadataValueFromXML({ context, rule, value })

export const metadataPropertyRule001 = definePropertyTypeRule("MetadataValue", "importFromXML", importMetadataValueFromXMLForRule)
export const metadataPropertyRule002 = definePropertyTypeRule("AssociatedTable", "importFromXML", importAssociatedTableFromXML)
