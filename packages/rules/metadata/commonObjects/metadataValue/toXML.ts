import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext } from "@nkdk/runtime"
import { primitiveValueHandlers } from "./handlers"
import { exportStandardPeriodToXML } from "../standardPeriod/toXML"
import { exportI8nTextToXML } from "../i8nText/toXML"
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
import { importTypeDescriptionFromYAML } from "../typeDescription/fromYAML"
import { effectiveTypeFromTypeDescription } from "../fillValue/effectiveType"

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

const isNilMetadataValueXML = (value: unknown): value is { "_xsi:nil": true } =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  ((value as Record<string, unknown>)["_xsi:nil"] === true || (value as Record<string, unknown>)["_xsi:nil"] === "true")

const isV8NullMetadataValueXML = (value: unknown): value is { "_xsi:type": "v8:Null" } =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  (value as Record<string, unknown>)["_xsi:type"] === "v8:Null"

const getReferenceMetadataValueXMLType = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const xsiType = (value as Record<string, unknown>)["_xsi:type"]
  return typeof xsiType === "string" ? xsiType : undefined
}

/**
 * Экспортирует MetadataValue в XML. Принимает тегированную форму {type, value}.
 */
export const exportMetadataValueToXML = (params: {
  context: ConfigurationContext
  rule: MetadataValuePropertyRule
  value: MetadataTypedValue | { "_xsi:nil": true } | undefined
  referenceMetadata?: unknown
  source?: import("@nkdk/runtime/rule-kit").YAMLPropertySource
  propertyKey?: string
}): any => {
  const { context, rule, value, referenceMetadata, source, propertyKey } = params

  if (isNilMetadataValueXML(value)) return { "_xsi:nil": true }
  if (isV8NullMetadataValueXML(value)) return { "_xsi:type": "v8:Null" }

  if (value === undefined) {
    if (propertyKey === "fillValue" && source !== undefined) {
      const type = importTypeDescriptionFromYAML(
        context,
        undefined,
        source.raw("type") as import("../typeDescription/types").TypeDescriptionYAML | undefined,
      )
      const effectiveType = effectiveTypeFromTypeDescription(type)
      if (
        effectiveType.status === "known" &&
        !effectiveType.composite &&
        effectiveType.alternatives.length === 1 &&
        effectiveType.alternatives[0]?.kind === "string"
      ) {
        return { "_xsi:type": "xs:string" }
      }
    }
    if (propertyKey !== "fillValue") {
      if (isNilMetadataValueXML(referenceMetadata)) return { "_xsi:nil": true }
      const referenceXMLType = getReferenceMetadataValueXMLType(referenceMetadata)
      if (referenceXMLType !== undefined) return { "_xsi:type": referenceXMLType }
    }
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

  if (value.type === "valueList") {
    return { "_xsi:type": MetadataValueTypeToXML.valueList }
  }

  if (value.type === "standardPeriod") {
    return exportStandardPeriodToXML(value.value)
  }

  if (!PRIMITIVE_TYPES.includes(value.type as MetadataPrimitiveValueType)) {
    throw new Error(`MetadataValue: неподдерживаемый тип для экспорта в XML: ${value.type}`)
  }

  const handler = primitiveValueHandlers[value.type as MetadataPrimitiveValueType]
  if (handler === undefined) {
    throw new Error(`MetadataValue: отсутствует toXML-обработчик для типа ${value.type} (rule.type: ${rule.type})`)
  }
  return handler.toXML(value)
}

export const exportFixedArrayToXML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValue
): import("./types").MetadataFixedArrayValueXML => {
  const rule: MetadataValuePropertyRule = { type: "MetadataValue" }
  const values = data.value.map((value) =>
    value === undefined ? { "_xsi:nil": true } : exportMetadataValueToXML({ context, rule, value })
  )
  return {
    "_xsi:type": "v8:FixedArray",
    "v8:Value": values.length === 1 ? values[0] : values,
  } as import("./types").MetadataFixedArrayValueXML
}

export const exportFormChoiceListToXML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueXML => {
  const rule: MetadataValuePropertyRule = { type: "MetadataValue", exportNilValue: true }
  const value = exportMetadataValueToXML({
    context,
    rule,
    value: data.value as MetadataTypedValue | undefined,
  })
  return {
    "_xsi:type": "FormChoiceListDesTimeValue",
    Presentation: exportI8nTextToXML(context, { type: "I8nText" }, data.presentation) ?? {},
    Value: value ?? { "_xsi:nil": true },
  } as MetadataFormChoiceListValueXML
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

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataValue", "exportToXML", exportMetadataValueToXML as any)
export const metadataPropertyRule001 = definePropertyTypeRule("AssociatedTable", "exportToXML", exportAssociatedTableToXML as any)
